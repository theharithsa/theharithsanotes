import test from "node:test";
import assert from "node:assert/strict";
import { junitRecords } from "../scripts/junit-records.mjs";
test("JUnit reports preserve actual outcomes and duration while omitting text and stack traces", () => {
  const rows = junitRecords(
    '<testsuites><testcase name="passed" time="0.5"/><testcase name="failed" time="1"><failure>PRIVATE_STACK</failure></testcase><testcase name="skip"><skipped/></testcase></testsuites>',
    {
      runId: 1,
      attempt: 2,
      artifactId: 3,
      sha: "a".repeat(40),
      observedAt: "2026-11-06T00:00:00Z",
      url: "https://github.com/theharithsa/theharithsanotes/actions/runs/1",
    },
  );
  assert.deepEqual(
    rows.map((row) => row.status),
    ["success", "failure", "skipped"],
  );
  assert.equal(rows[0].durationMs, 500);
  assert.ok(!JSON.stringify(rows).includes("PRIVATE_STACK"));
  assert.throws(() => junitRecords("<!DOCTYPE x><testsuites/>", {}));
  assert.throws(() => junitRecords("<testsuites/>", {}));
});
