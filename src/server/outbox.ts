import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { database } from "./firebase.ts";
import { collection } from "./config.ts";
import type { AuditEvent } from "./models.ts";
import {
  observe,
  producerLinks,
  operationalLog,
  wireEvent,
  workerBacklog,
  workerOldest,
  workerOutcomes,
  workerLag,
} from "./telemetry.ts";
import { trace, SpanStatusCode } from "@opentelemetry/api";

export async function drainAudit(
  limit = 100,
  budgetMs = 170000,
): Promise<{ sent: number; failed: number; skipped: number; blocked: number }> {
  const result = { sent: 0, failed: 0, skipped: 0, blocked: 0 };
  const token = process.env.DYNATRACE_INGEST_TOKEN;
  if (!token && process.env.BIZEVENTS_LOCAL_TEST !== "true")
    return { ...result, blocked: 1 };
  const endpoint =
    process.env.BIZEVENTS_ENDPOINT ??
    "https://indiacs.live.dynatrace.com/api/v2/bizevents/ingest";
  if (
    endpoint !== "https://indiacs.live.dynatrace.com/api/v2/bizevents/ingest" &&
    !(
      process.env.BIZEVENTS_LOCAL_TEST === "true" &&
      /^http:\/\/(?:localhost|127\.0\.0\.1):\d+\//.test(endpoint)
    )
  )
    throw new Error("Unapproved BizEvents endpoint");
  return observe(
    "audit.drain",
    { "messaging.system": "firestore-outbox" },
    async () => {
      const store = database().collection(collection("outbox"));
      const [depth, pending, oldest] = await Promise.all([
        store.where("state", "in", ["pending", "processing"]).count().get(),
        store
          .where("availableAt", "<=", Date.now())
          .orderBy("availableAt")
          .limit(Math.min(limit, 200))
          .get(),
        store
          .where("state", "==", "pending")
          .orderBy("createdAt")
          .limit(1)
          .get(),
      ]);
      workerBacklog.record(depth.data().count);
      workerOldest.record(
        oldest.empty
          ? 0
          : Math.max(
              0,
              (Date.now() - Number(oldest.docs[0]!.get("createdAt"))) / 1000,
            ),
      );
      let index = 0;
      const deadline =
        performance.now() + Math.min(170000, Math.max(1000, budgetMs));
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          while (index < pending.docs.length && performance.now() < deadline) {
            const reference = pending.docs[index++]!.ref;
            const owner = randomUUID();
            const claimed = await database().runTransaction(async (tx) => {
              const snap = await tx.get(reference);
              const row = snap.data();
              if (
                !row ||
                !["pending", "processing"].includes(row.state) ||
                Number(row.availableAt) > Date.now()
              )
                return null;
              tx.update(reference, {
                state: "processing",
                leaseOwner: owner,
                leaseUntil: Date.now() + 60000,
                availableAt: Date.now() + 60000,
              });
              return row;
            });
            if (!claimed) {
              result.skipped++;
              continue;
            }
            const event = claimed.event as AuditEvent;
            let delivered = false;
            let status = 0;
            let retryAfter = 0;
            try {
              await observe(
                "audit.ingest",
                { "messaging.message.id": event.id, "event.type": event.type },
                async () => {
                  const response = await fetch(endpoint, {
                    method: "POST",
                    redirect: "error",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify([wireEvent(event)]),
                    signal: AbortSignal.timeout(12000),
                  });
                  status = response.status;
                  delivered = status === 202;
                  trace
                    .getActiveSpan()
                    ?.setAttribute("http.response.status_code", status);
                  if (!delivered) {
                    trace
                      .getActiveSpan()
                      ?.setAttribute("error.type", "INGEST_REJECTED");
                    trace
                      .getActiveSpan()
                      ?.setStatus({ code: SpanStatusCode.ERROR });
                  }
                  const retry = response.headers.get("retry-after");
                  retryAfter = retry
                    ? Math.min(
                        86400000,
                        Math.max(
                          0,
                          Number.isFinite(Number(retry))
                            ? Number(retry) * 1000
                            : Date.parse(retry) - Date.now(),
                        ),
                      )
                    : 0;
                  if (!Number.isFinite(retryAfter)) retryAfter = 0;
                  await response.arrayBuffer();
                },
                producerLinks(event),
              );
            } catch {
              status = 0;
            }
            const attempts = Number(claimed.attempts ?? 0) + 1;
            const blocked =
              [400, 401, 403, 404].includes(status) || attempts >= 16;
            const outcome = await database().runTransaction(async (tx) => {
              const latest = await tx.get(reference);
              if (latest.get("leaseOwner") !== owner) return "skipped";
              if (delivered) {
                tx.update(reference, {
                  state: "delivered",
                  deliveredAt: Date.now(),
                  availableAt: FieldValue.delete(),
                  leaseOwner: null,
                  leaseUntil: 0,
                  expiresAt: Timestamp.fromMillis(Date.now() + 30 * 86400000),
                  lastError: null,
                });
                return "sent";
              }
              tx.update(reference, {
                state: blocked ? "blocked" : "pending",
                attempts,
                availableAt: blocked
                  ? FieldValue.delete()
                  : Date.now() +
                    Math.max(
                      retryAfter,
                      Math.min(3600000, 30000 * 2 ** Math.min(attempts, 7)),
                    ) +
                    Math.floor(Math.random() * 5000),
                leaseOwner: null,
                leaseUntil: 0,
                lastError: status ? `INGEST_HTTP_${status}` : "INGEST_TIMEOUT",
              });
              return blocked ? "blocked" : "retry";
            });
            workerOutcomes.add(1, { outcome });
            if (outcome === "sent") {
              result.sent++;
              workerLag.record(
                Math.max(0, (Date.now() - Date.parse(event.time)) / 1000),
              );
            } else if (outcome === "skipped") result.skipped++;
            else {
              result.failed++;
              if (outcome === "blocked") result.blocked++;
              operationalLog("audit.delivery_failed", {
                "event.type": event.type,
                "http.response.status_code": status,
                "error.type":
                  outcome === "blocked"
                    ? "INGEST_REJECTED"
                    : "INGEST_UNAVAILABLE",
              });
            }
          }
        }),
      );
      return result;
    },
  );
}
export async function auditHealth() {
  const store = database().collection(collection("outbox"));
  const [pending, blocked] = await Promise.all([
    store.where("state", "in", ["pending", "processing"]).count().get(),
    store.where("state", "==", "blocked").count().get(),
  ]);
  return {
    pending: pending.data().count,
    blocked: blocked.data().count,
    configured: Boolean(process.env.DYNATRACE_INGEST_TOKEN),
  };
}
export async function retryBlocked() {
  const rows = await database()
    .collection(collection("outbox"))
    .where("state", "==", "blocked")
    .limit(100)
    .get();
  const batch = database().batch();
  for (const row of rows.docs)
    batch.update(row.ref, {
      state: "pending",
      availableAt: Date.now(),
      attempts: 0,
    });
  await batch.commit();
  return rows.size;
}
