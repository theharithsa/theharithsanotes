import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["node_modules/astro/bin/astro.mjs", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CMS_BUILD_TARGET: "server",
      ASTRO_TELEMETRY_DISABLED: "1",
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
