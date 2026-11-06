import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
mkdirSync("artifacts", { recursive: true });
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const execution =
  "node --import tsx --test --test-reporter=spec --test-reporter=junit --test-reporter-destination=stdout --test-reporter-destination=artifacts/cms-tests.xml tests/cms.test.ts";
const result = spawnSync(
  command,
  [
    "--yes",
    "firebase-tools@15.34.2",
    "emulators:exec",
    "--only",
    "firestore,auth,storage",
    "--config",
    "firebase.cms.json",
    "--project",
    "demo-harithsa-cms",
    ...(process.platform === "win32" ? [`"${execution}"`] : [execution]),
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      CMS_NAMESPACE: "test",
      GOOGLE_CLOUD_PROJECT: "demo-harithsa-cms",
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
