import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
mkdirSync("artifacts", { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "--test",
    "--test-reporter=spec",
    "--test-reporter=junit",
    "--test-reporter-destination=stdout",
    "--test-reporter-destination=artifacts/site-tests.xml",
    "tests/*.test.mjs",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
