import {
  observe,
  operationalLog,
  requestCount,
  requestDuration,
  payloadSummary,
  auditEvent,
  producerLinks,
  requestContext,
  wireEvent,
} from "../../src/server/telemetry.ts";
import assert from "node:assert/strict";
import { CmsError, type AuditEvent } from "../../src/server/models.ts";
import { SpanKind } from "@opentelemetry/api";
let produced: AuditEvent | undefined;
await Promise.all(
  ["alpha", "beta"].map((label) =>
    observe(`probe.${label}`, { "probe.label": label }, async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, label === "alpha" ? 20 : 5),
      );
      await observe(
        `probe.${label}.child`,
        { "probe.label": label },
        async () => {
          if (label === "alpha") produced = auditEvent("probe.produced", {});
          operationalLog("probe.correlated", {
            "probe.label": label,
            ...payloadSummary({ secret: "PRIVATE_PROBE_TEXT" }),
          });
          requestCount.add(1, {
            route: "/probe",
            method: "GET",
            outcome: "success",
            "error.type": "NONE",
          });
          requestDuration.record(0.025, {
            route: "/probe",
            method: "GET",
            outcome: "success",
          });
        },
      );
    }),
  ),
);
if (produced)
  await observe(
    "probe.delivery",
    {},
    async () => {},
    producerLinks(produced),
    SpanKind.CLIENT,
  );
await assert.rejects(
  observe(
    "probe.server",
    { "http.route": "/probe/:entry" },
    async () => {
      throw new CmsError("FORBIDDEN", 403, "PRIVATE_PROBE_TEXT");
    },
    [],
    SpanKind.SERVER,
  ),
  { code: "FORBIDDEN" },
);
requestContext.run(
  { requestId: "fixture-request", actor: "fixture-actor", cache: new Map() },
  () => {
    const event = wireEvent(
      auditEvent("content.draft_saved", {
        "content.id": "fixture-entry",
        "content.section": "blogs",
      }),
    );
    assert.equal(event.request_id, "fixture-request");
    assert.equal(event.transaction_id, "fixture-request");
    assert.equal(event.actor_id, "fixture-actor");
    assert.equal(event.content_id, "fixture-entry");
    assert.equal(event.content_section, "blogs");
    assert.equal(event["content.id"], event.content_id);
    assert.equal(
      wireEvent(auditEvent("developer.key_revoked", {})).content_id,
      undefined,
    );
  },
);
assert.equal(
  wireEvent(
    auditEvent("sdlc.workflow", {
      "sdlc.execution.id": "fixture-run",
    }),
  )["sdlc.execution_id"],
  "fixture-run",
);
assert.equal(wireEvent(auditEvent("http.request", {})).actor_id, undefined);
await globalThis.__harithsaTelemetry?.shutdown();
