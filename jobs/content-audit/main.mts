import { drainAudit } from "../../src/server/outbox.ts";
import { operationalLog, observe } from "../../src/server/telemetry.ts";

try {
  await observe("audit.run", { "job.name": "content-audit" }, async () => {
    const result = await drainAudit(200);
    operationalLog("audit.run_completed", result);
    if (result.blocked) process.exitCode = 1;
  });
} catch (error) {
  operationalLog("audit.run_failed", {}, error);
  process.exitCode = 1;
} finally {
  await globalThis.__harithsaTelemetry?.shutdown();
}
