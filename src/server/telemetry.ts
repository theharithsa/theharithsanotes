import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import {
  trace,
  metrics,
  SpanStatusCode,
  SpanKind,
  type Attributes,
  type Link,
} from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { database } from "./firebase.ts";
import {
  collection,
  firestoreEnabled,
  namespace,
  serviceVersion,
} from "./config.ts";
import { CmsError, isSection, type AuditEvent } from "./models.ts";

export interface RequestContext {
  requestId: string;
  actor?: string;
  preview?: { section: string; id: string };
  cache: Map<string, Promise<unknown>>;
}
export const requestContext = new AsyncLocalStorage<RequestContext>();
const tracer = trace.getTracer("harithsa-notes", "1.0.0");
const meter = metrics.getMeter("harithsa-notes", "1.0.0");
const logger = logs.getLogger("harithsa-notes", "1.0.0");
export const requestCount = meter.createCounter("journal.http.requests", {
  unit: "{request}",
});
const durationBuckets = {
  explicitBucketBoundaries: [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10,
  ],
};
export const requestDuration = meter.createHistogram("journal.http.duration", {
  unit: "s",
  advice: durationBuckets,
});
const dependencyDuration = meter.createHistogram("journal.firebase.duration", {
  unit: "s",
  advice: durationBuckets,
});
const auditDrops = meter.createCounter("journal.audit.capture_failures", {
  unit: "{event}",
});
export const workerOutcomes = meter.createCounter("journal.audit.deliveries", {
  unit: "{event}",
});
export const workerLag = meter.createHistogram("journal.audit.delivery_lag", {
  unit: "s",
});
export const workerBacklog = meter.createGauge("journal.audit.backlog", {
  unit: "{event}",
});
export const workerOldest = meter.createGauge("journal.audit.oldest_age", {
  unit: "s",
});

export function errorCode(error: unknown): string {
  if (error instanceof CmsError) return error.code;
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (["10", "ABORTED"].includes(code)) return "DEPENDENCY_CONFLICT";
  if (["4", "14", "DEADLINE_EXCEEDED", "UNAVAILABLE"].includes(code))
    return "DEPENDENCY_TIMEOUT";
  if (["8", "RESOURCE_EXHAUSTED"].includes(code)) return "DEPENDENCY_QUOTA";
  if (["7", "403", "PERMISSION_DENIED"].includes(code))
    return "DEPENDENCY_PERMISSION";
  if (["5", "404", "NOT_FOUND"].includes(code)) return "DEPENDENCY_NOT_FOUND";
  if (["6", "409", "ALREADY_EXISTS"].includes(code))
    return "DEPENDENCY_CONFLICT";
  if (["3", "400", "INVALID_ARGUMENT"].includes(code))
    return "DEPENDENCY_INVALID";
  if (["16", "401", "UNAUTHENTICATED"].includes(code))
    return "DEPENDENCY_UNAUTHENTICATED";
  if (
    error instanceof Error &&
    ["AbortError", "TimeoutError"].includes(error.name)
  )
    return "DEPENDENCY_TIMEOUT";
  if (code.startsWith("auth/")) return "UNAUTHENTICATED";
  return "INTERNAL";
}
export function errorAttributes(code: string, message: string): Attributes {
  return { "error.type": code, "error.message": message };
}

export function operationalLog(
  name: string,
  fields: Attributes,
  error?: unknown,
): void {
  logger.emit({
    severityNumber: error ? SeverityNumber.WARN : SeverityNumber.INFO,
    body: name,
    attributes: {
      ...fields,
      ...(error ? { "error.type": errorCode(error) } : {}),
    },
  });
}
export function payloadSummary(
  value: unknown,
  prefix = "payload",
): Record<string, string | number> {
  let serialized: string;
  try {
    serialized = JSON.stringify(value) ?? "null";
  } catch {
    serialized = "unserializable";
  }
  return {
    [`${prefix}.bytes`]: Buffer.byteLength(serialized),
    [`${prefix}.sha256`]: createHash("sha256").update(serialized).digest("hex"),
    [`${prefix}.fields`]:
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.keys(value)
            .filter((key) => /^[a-zA-Z_][a-zA-Z0-9_.]{0,48}$/.test(key))
            .slice(0, 30)
            .join(",")
        : Array.isArray(value)
          ? "array"
          : typeof value,
  };
}
export function auditEvent(
  type: string,
  data: AuditEvent["data"],
  authority: AuditEvent["authority"] = "server-confirmed",
): AuditEvent {
  const span = trace.getActiveSpan()?.spanContext();
  const state = requestContext.getStore();
  return {
    id: randomUUID(),
    type,
    time: new Date().toISOString(),
    authority,
    data: {
      ...data,
      "origin.service.version": serviceVersion,
      "origin.service.name":
        process.env.OTEL_SERVICE_NAME ?? "harithsa-notes-web",
      ...(state
        ? {
            "request.id": state.requestId,
            "transaction.id": data["transaction.id"] ?? state.requestId,
          }
        : {}),
      ...(state?.actor ? { "actor.id": state.actor } : {}),
      ...(span
        ? {
            trace_id: span.traceId,
            span_id: span.spanId,
            trace_flags: span.traceFlags,
          }
        : {}),
    },
  };
}
export function outboxDocument(event: AuditEvent) {
  return {
    event,
    state: "pending",
    attempts: 0,
    availableAt: Date.now(),
    createdAt: Date.now(),
    leaseUntil: 0,
    leaseOwner: null,
    lastError: null,
  };
}
export async function enqueueAudit(event: AuditEvent): Promise<void> {
  if (!firestoreEnabled() || process.env.CMS_AUDIT_CAPTURE === "off") return;
  try {
    await database()
      .collection(collection("outbox"))
      .doc(event.id)
      .create(outboxDocument(event));
  } catch (error) {
    auditDrops.add(1, { "error.type": errorCode(error) });
    operationalLog("audit.capture_failed", { "event.type": event.type }, error);
  }
}
export function producerLinks(event: AuditEvent): Link[] {
  const { trace_id, span_id, trace_flags } = event.data;
  return typeof trace_id === "string" &&
    /^[a-f0-9]{32}$/.test(trace_id) &&
    !/^0+$/.test(trace_id) &&
    typeof span_id === "string" &&
    /^[a-f0-9]{16}$/.test(span_id) &&
    !/^0+$/.test(span_id) &&
    [0, 1].includes(Number(trace_flags)) &&
    trace_flags !== null &&
    trace_flags !== undefined
    ? [
        {
          context: {
            traceId: trace_id,
            spanId: span_id,
            traceFlags: Number(trace_flags),
            isRemote: true,
          },
        },
      ]
    : [];
}
export async function observe<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
  links: Link[] = [],
  kind: SpanKind = SpanKind.INTERNAL,
): Promise<T> {
  return tracer.startActiveSpan(
    name,
    { attributes, links, kind },
    async (span) => {
      try {
        return await operation();
      } catch (error) {
        const code = errorCode(error);
        span.setAttributes(errorAttributes(code, `Operation failed (${code})`));
        if (error instanceof CmsError && kind === SpanKind.SERVER)
          span.setAttribute("http.response.status_code", error.status);
        span.setStatus({ code: SpanStatusCode.ERROR });
        operationalLog("operation.failed", attributes, error);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
export async function firebaseOperation<T>(
  operation: string,
  model: string,
  payload: unknown,
  run: () => Promise<T>,
  summarize: (value: T) => unknown = (value) => value,
): Promise<T> {
  const start = performance.now();
  // These models receive structured application arguments, separate from raw input.
  const content =
    ["entries", "revisions", "published"].includes(model) &&
    payload &&
    typeof payload === "object" &&
    "section" in payload &&
    typeof payload.section === "string" &&
    isSection(payload.section)
      ? {
          "content.section": payload.section,
          ...("id" in payload &&
          typeof payload.id === "string" &&
          /^[a-zA-Z0-9_-]{1,100}$/.test(payload.id)
            ? { "content.id": payload.id }
            : {}),
        }
      : {};
  return observe(
    `firebase.${operation}`,
    {
      "db.system.name":
        model === "authentication"
          ? "gcp.firebase_auth"
          : model === "media" &&
              ["upload", "download", "copy"].includes(operation)
            ? "gcp.cloud_storage"
            : "gcp.firestore",
      "db.operation.name": operation,
      "db.collection.name": model,
      ...content,
    },
    async () => {
      let outcome = "success";
      let failure = "NONE";
      let response: unknown = null;
      try {
        const value = await run();
        response = summarize(value);
        return value;
      } catch (error) {
        outcome = "failed";
        failure = errorCode(error);
        throw error;
      } finally {
        const seconds = (performance.now() - start) / 1000;
        dependencyDuration.record(seconds, {
          operation,
          collection: model,
          outcome,
          "error.type": failure,
        });
        await enqueueAudit(
          auditEvent(
            "firebase.operation",
            {
              "firebase.operation": operation,
              "firebase.collection": model,
              ...content,
              outcome,
              "error.type": failure,
              "duration.ms": Math.round(seconds * 1000),
              ...payloadSummary(payload, "request.payload"),
              ...payloadSummary(response, "response.payload"),
            },
            "server-observed",
          ),
        );
      }
    },
  );
}
export function wireEvent(
  event: AuditEvent,
): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {
    "event.type": event.type,
    "event.provider": "harithsa-notes.cms",
    "event.id": event.id,
    "event.authority": event.authority,
    "event.occurred_at": event.time,
    "service.namespace": "harithsa-notes",
    "service.name": String(
      event.data["origin.service.name"] ?? "harithsa-notes-web",
    ),
    "service.version": String(
      event.data["origin.service.version"] ?? serviceVersion,
    ),
    "deployment.environment.name": namespace,
  };
  for (const [key, value] of Object.entries(event.data))
    if (value !== null)
      fields[key] = typeof value === "string" ? value.slice(0, 2048) : value;
  // Keep existing dotted fields for dashboards while the weekly audit uses
  // these aliases. Only copy fields present on the source event.
  for (const [source, alias] of [
    ["actor.id", "actor_id"],
    ["request.id", "request_id"],
    ["transaction.id", "transaction_id"],
    ["content.id", "content_id"],
    ["content.section", "content_section"],
    ["sdlc.execution.id", "sdlc.execution_id"],
  ] as const) {
    if (source in fields) fields[alias] = fields[source]!;
  }
  return fields;
}
