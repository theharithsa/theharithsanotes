import { test } from "node:test";
import assert from "node:assert/strict";
import { SearchSession } from "../src/lib/search-session.ts";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const response = (title) => ({
  results: [
    {
      title,
      description: "Synthetic note",
      label: "Journal",
      href: "/people-and-journal/journal/synthetic",
      private: true,
    },
  ],
  total: 1,
  next: null,
  privateAvailable: true,
});
function setup() {
  const calls = [],
    states = [];
  const session = new SearchSession({
    request: (...args) => {
      const task = deferred();
      calls.push({ args, ...task });
      return task.promise;
    },
    loading: (append) => states.push({ phase: "loading", append }),
    ready: (data, append) => states.push({ phase: "ready", data, append }),
    idle: () => states.push({ phase: "idle" }),
    failed: () => states.push({ phase: "failed" }),
  });
  return { calls, states, session };
}
test("closing discards an in-flight private result even when its fetch ignores abort", async () => {
  const h = setup(),
    task = h.session.run("note", "");
  h.session.reset();
  assert.equal(h.calls[0].args[3].aborted, true);
  h.calls[0].resolve(response("Private fixture"));
  await task;
  assert.equal(h.states.at(-1).phase, "idle");
  assert.equal(
    h.states.some((s) => s.phase === "ready"),
    false,
  );
});
test("rapid queries and reopen cannot be overwritten by an older response", async () => {
  const h = setup(),
    old = h.session.run("first", "");
  h.session.reset();
  const current = h.session.run("second", "books");
  h.calls[1].resolve(response("Current fixture"));
  await current;
  h.calls[0].resolve(response("Old fixture"));
  await old;
  assert.equal(h.states.at(-1).data.results[0].title, "Current fixture");
  assert.equal(h.calls[0].args[3].aborted, true);
  h.session.reset();
});
test("failed requests remain retryable and pagination keeps the requested offset", async () => {
  const h = setup(),
    first = h.session.run("book", "");
  h.calls[0].reject(new Error("Synthetic failure"));
  await first;
  assert.equal(h.states.at(-1).phase, "failed");
  const next = h.session.run("book", "books", 20);
  assert.equal(h.states.at(-1).append, true);
  assert.equal(h.calls[1].args[2], 20);
  h.calls[1].resolve(response("Book fixture"));
  await next;
  assert.equal(h.states.at(-1).phase, "ready");
  h.session.reset();
});
test("debounced typing only requests the latest term and a short query clears immediately", async () => {
  const h = setup();
  h.session.schedule("first", "");
  h.session.schedule("latest", "");
  await new Promise((resolve) => setTimeout(resolve, 220));
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].args[0], "latest");
  h.session.schedule("x", "");
  assert.equal(h.states.at(-1).phase, "idle");
  h.calls[0].resolve(response("Late fixture"));
  await Promise.resolve();
  assert.equal(h.states.at(-1).phase, "idle");
  h.session.reset();
});
