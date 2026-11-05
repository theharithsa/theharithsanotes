import {
  observe,
  operationalLog,
  requestCount,
  requestDuration,
  payloadSummary,
  auditEvent,
  producerLinks,
} from "../../src/server/telemetry.ts";
import type { AuditEvent } from "../../src/server/models.ts";
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
  await observe("probe.delivery", {}, async () => {}, producerLinks(produced));
await globalThis.__harithsaTelemetry?.shutdown();
