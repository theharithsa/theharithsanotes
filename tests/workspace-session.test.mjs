import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthRestoration } from "../src/lib/auth-restoration.ts";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup() {
  const phases = [],
    entered = [];
  let user = { uid: "synthetic-owner" };
  let clears = 0;
  const auth = deferred(),
    verification = deferred();
  const controller = new AuthRestoration({
    ready: () => auth.promise,
    user: () => user,
    verify: () => verification.promise,
    clear: () => clears++,
    show: (phase) => phases.push(phase),
    enter: (profile) => entered.push(profile),
    denied: (error) => error.status === 403,
    message: () => "Synthetic error",
  });
  return {
    controller,
    phases,
    entered,
    auth,
    verification,
    setUser: (value) => (user = value),
    clears: () => clears,
  };
}
test("workspace stays pending through identity and owner verification", async () => {
  const h = setup(),
    task = h.controller.restore();
  assert.deepEqual(h.phases, ["loading", "loading"]);
  h.auth.resolve();
  await Promise.resolve();
  assert.equal(h.phases.at(-1), "loading");
  h.verification.resolve({ environment: "preview" });
  await task;
  assert.equal(h.phases.at(-1), "ready");
  assert.equal(h.entered.length, 1);
  assert.equal(h.phases.includes("signed-out"), false);
});
test("workspace only shows sign-in after auth confirms there is no user", async () => {
  const h = setup();
  h.setUser(null);
  const task = h.controller.restore();
  assert.equal(h.phases.at(-1), "loading");
  h.auth.resolve();
  await task;
  assert.equal(h.phases.at(-1), "signed-out");
  assert.equal(h.entered.length, 0);
});
test("late owner verification cannot enter a suspended workspace", async () => {
  const h = setup(),
    task = h.controller.restore();
  h.auth.resolve();
  await Promise.resolve();
  h.controller.suspend();
  h.verification.resolve({});
  await task;
  assert.equal(h.entered.length, 0);
  assert.equal(h.phases.at(-1), "loading");
});
test("changed identity cannot receive the previous owner result", async () => {
  const h = setup(),
    task = h.controller.restore();
  h.auth.resolve();
  await Promise.resolve();
  h.setUser({ uid: "another-synthetic-user" });
  h.verification.resolve({});
  await task;
  assert.equal(h.entered.length, 0);
});
test("denied access and temporary failures remain different states", async () => {
  for (const status of [403, 503]) {
    const h = setup(),
      task = h.controller.restore();
    h.auth.resolve();
    await Promise.resolve();
    h.verification.reject({ status });
    await task;
    assert.equal(h.phases.at(-1), status === 403 ? "denied" : "error");
    assert.equal(h.entered.length, 0);
  }
});
test("a late failure cannot overwrite a newer signed-out state", async () => {
  const h = setup(),
    first = h.controller.restore();
  h.auth.resolve();
  await Promise.resolve();
  h.setUser(null);
  await h.controller.restore();
  h.verification.reject({ status: 503 });
  await first;
  assert.equal(h.phases.at(-1), "signed-out");
});

test("catalog initialization finishes before the workspace becomes ready", async () => {
  const entered = deferred();
  const phases = [];
  const controller = new AuthRestoration({
    ready: async () => {},
    user: () => ({ uid: "synthetic-owner" }),
    verify: async () => ({}),
    clear: () => {},
    show: (phase) => phases.push(phase),
    enter: () => entered.promise,
    denied: () => false,
    message: () => "Synthetic error",
  });
  const task = controller.restore();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(phases.at(-1), "loading");
  entered.resolve();
  await task;
  assert.equal(phases.at(-1), "ready");
});
