import { reconcileWorkspace } from "../../src/server/workspace.ts";
import { namespace } from "../../src/server/config.ts";
import { observe, operationalLog } from "../../src/server/telemetry.ts";
try {
  const result = await observe(
    "workspace.catalog_reconcile",
    { "cms.namespace": namespace },
    reconcileWorkspace,
  );
  operationalLog("workspace.catalog_reconciled", {
    "catalog.tags_added": result.added.tags,
    "catalog.pages_added": result.added.pages,
  });
  process.stdout.write(JSON.stringify({ namespace, ...result }) + "\n");
} finally {
  await globalThis.__harithsaTelemetry?.shutdown();
}
