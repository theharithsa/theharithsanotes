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
import { registerHooks } from "node:module";
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

// Astro supplies this identity wrapper through its virtual middleware module.
const middlewareHook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "astro:middleware")
      return {
        url: "data:text/javascript,export const defineMiddleware = (handler) => handler",
        shortCircuit: true,
      };
    return nextResolve(specifier, context);
  },
});
const { onRequest } = await import("../../src/middleware.ts");
middlewareHook.deregister();
process.env.CMS_DATA_SOURCE = "firestore";
process.env.CMS_AUDIT_CAPTURE = "off";
for (const [path, status, method] of [
  ["/missing-article", 404, "GET"],
  ["/wp-admin/install.php", 404, "HEAD"],
  ["/_image", 404, "GET"],
  ["/api/v1/missing", 404, "GET"],
  ["/broken-article", 503, "GET"],
] as const) {
  const url = new URL(path, "https://example.test");
  const context = {
    url,
    request: new Request(url, { method }),
    locals: {},
  } as Parameters<typeof onRequest>[0];
  const response = await onRequest(
    context,
    async () => new Response(null, { status }),
  );
  assert.ok(response instanceof Response);
  assert.equal(response.status, status);
}
await globalThis.__harithsaTelemetry?.shutdown();
