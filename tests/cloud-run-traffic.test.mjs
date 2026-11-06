import test from "node:test";
import assert from "node:assert/strict";
import { trafficForRelease } from "../scripts/run-traffic.mjs";
test("new releases retain immutable Hosting pins without sending ordinary traffic to old revisions", () => {
  const previous = [
    { type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST", percent: 100 },
    {
      type: "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION",
      revision: "journal-00001",
      tag: "fh-previous",
      percent: 0,
    },
    {
      type: "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION",
      revision: "journal-00002",
      tag: "owner-preview",
      percent: 10,
    },
  ];
  const original = structuredClone(previous);
  const next = trafficForRelease(previous);
  assert.deepEqual(previous, original);
  assert.equal(
    next.reduce((sum, target) => sum + target.percent, 0),
    100,
  );
  assert.equal(
    next.find((target) => target.tag === "fh-previous").revision,
    "journal-00001",
  );
  assert.equal(
    next.find((target) => target.tag === "owner-preview").revision,
    "journal-00002",
  );
  assert.equal(
    next.filter((target) => target.tag).every((target) => target.percent === 0),
    true,
  );
  assert.throws(() =>
    trafficForRelease([
      { type: "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION", tag: "broken" },
    ]),
  );
});
