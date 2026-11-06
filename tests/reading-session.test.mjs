import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(
  new URL("../src/scripts/reading.ts", import.meta.url),
  "utf8",
);
const client = ts
  .transpileModule(source.replace(/^import[\s\S]*?from\s+"[^"]+";\s*/gm, ""), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  })
  .outputText.replace(/export \{\};?\s*$/, "");
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function harness() {
  const elements = new Map();
  const storage = new Map();
  const windowHandlers = new Map();
  const requests = [];
  const states = [];
  const historyWrites = [];
  let observer;
  const element = () => ({
    hidden: true,
    textContent: "",
    children: [],
    handlers: new Map(),
    dataset: {},
    attrs: new Map(),
    setAttribute(key, value) {
      this.attrs.set(key, value);
    },
    getAttribute(key) {
      return this.attrs.get(key) ?? null;
    },
    removeAttribute(key) {
      this.attrs.delete(key);
    },
    replaceChildren() {
      this.children = [];
    },
    append(...items) {
      this.children.push(...items);
    },
    addEventListener(event, callback) {
      this.handlers.set(event, callback);
    },
  });
  const node = (id) => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  node("reading-room").dataset = new Proxy(
    {},
    {
      set(target, key, value) {
        states.push(value);
        target[key] = value;
        return true;
      },
    },
  );
  const user = {
    uid: "synthetic-reader",
    getIdToken: async () => "synthetic-test-token",
  };
  const auth = { currentUser: null, authStateReady: async () => {} };
  const location = {
    origin: "https://example.test",
    pathname: "/people-and-journal/journal",
    search: "",
    replace() {},
  };
  const links = ["journal", "people"].map((section) => {
    const link = element();
    link.href = `${location.origin}/people-and-journal/${section}`;
    link.setAttribute("href", `/people-and-journal/${section}`);
    return link;
  });
  const context = vm.createContext({
    AbortController,
    AbortSignal,
    URLSearchParams,
    URL,
    Intl,
    Date,
    getApps: () => [{}],
    initializeApp: () => ({}),
    firebaseConfig: {},
    getAuth: () => auth,
    onAuthStateChanged: (_auth, callback) => {
      observer = callback;
    },
    GoogleAuthProvider: class {
      setCustomParameters() {}
    },
    signInWithPopup: async () => {},
    signOut: async () => {
      auth.currentUser = null;
      observer();
    },
    document: {
      getElementById: node,
      querySelectorAll: (selector) =>
        selector === ".reading-categories a" ? links : [],
      querySelector: () => null,
      createElement: element,
    },
    location,
    history: {
      pushState: (state, _title, path) => {
        historyWrites.push({ state, path });
        location.pathname = path;
        location.search = "";
      },
    },
    localStorage: {
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    },
    window: {
      addEventListener: (event, callback) =>
        windowHandlers.set(event, callback),
    },
    fetch: (path, options) => {
      const task = deferred();
      requests.push({ path, options, ...task });
      return task.promise;
    },
  });
  vm.runInContext(client, context);
  return {
    auth,
    location,
    historyWrites,
    links,
    async navigate(section, modifiers = {}) {
      const event = {
        button: 0,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        ...modifiers,
      };
      links[section === "people" ? 1 : 0].handlers.get("click")(event);
      await tick();
      return event.defaultPrevented;
    },
    async back(section) {
      location.pathname = `/people-and-journal/${section}`;
      windowHandlers.get("popstate")();
      await tick();
    },
    node,
    requests,
    states,
    storage,
    windowHandlers,
    async identity(signedIn) {
      auth.currentUser = signedIn ? user : null;
      observer();
      await tick();
    },
    reply(index, status = 200, body = { posts: [] }) {
      requests[index].resolve({
        ok: status < 400,
        status,
        json: async () => body,
      });
    },
  };
}

test("restored identity never shows sign-in while session and content are pending", async () => {
  const h = harness();
  assert.equal(h.node("reading-gate").hidden, true);
  await h.identity(true);
  assert.deepEqual(h.requests.map((r) => r.path).sort(), [
    "/api/reading/journal",
    "/api/reading/session",
  ]);
  assert.equal(h.node("reading-gate").hidden, true);
  h.reply(1);
  await tick();
  assert.equal(h.node("reading-content").hidden, true);
  h.reply(0);
  await tick();
  assert.equal(h.node("reading-content").hidden, false);
  assert.equal(h.node("reading-loading").hidden, true);
  assert.equal(h.states.includes("signed-out"), false);
});

test("a confirmed signed-out visitor gets the gate without private requests", async () => {
  const h = harness();
  await h.identity(false);
  assert.equal(h.node("reading-gate").hidden, false);
  assert.equal(h.requests.length, 0);
});

test("late session and content responses cannot restore access after identity signs out", async () => {
  const h = harness();
  await h.identity(true);
  await h.identity(false);
  h.reply(0);
  h.reply(1);
  await tick();
  assert.equal(h.node("reading-content").hidden, true);
  assert.equal(h.node("reading-gate").hidden, false);
  assert.equal(h.storage.has("harithsa.reader-ready"), false);
});

test("revoked access shows the gate, while temporary failures offer retry without sign-in", async () => {
  for (const status of [403, 503]) {
    const h = harness();
    await h.identity(true);
    h.reply(0, status, { error: { message: "Synthetic failure" } });
    h.reply(1);
    await tick();
    assert.equal(h.node("reading-content").hidden, true);
    assert.equal(h.node("reading-gate").hidden, status === 503);
    assert.equal(h.node("reader-retry").hidden, status === 403);
    if (status === 503) {
      h.node("reader-retry").handlers.get("click")();
      await tick();
      h.reply(2);
      h.reply(3);
      await tick();
      assert.equal(h.node("reading-content").hidden, false);
    }
  }
});

test("pagehide clears private content and Back restoration stays pending until revalidated", async () => {
  const h = harness();
  await h.identity(true);
  h.reply(0);
  h.reply(1);
  await tick();
  h.windowHandlers.get("pagehide")();
  assert.equal(h.node("reading-content").hidden, true);
  assert.equal(h.node("reading-gate").hidden, true);
  h.windowHandlers.get("pageshow")({ persisted: true });
  await tick();
  assert.equal(h.node("reading-gate").hidden, true);
  h.reply(2);
  h.reply(3);
  await tick();
  assert.equal(h.node("reading-content").hidden, false);
});

test("sign-out waits for pending cookie creation before deleting the server session", async () => {
  const h = harness();
  await h.identity(true);
  h.node("reader-signout").handlers.get("click")();
  await tick();
  assert.equal(h.requests.length, 2);
  h.reply(0);
  await tick();
  assert.equal(h.requests[2].options.method, "DELETE");
  h.reply(2);
  h.reply(1);
  await tick();
  assert.equal(h.node("reading-gate").hidden, false);
  assert.equal(h.node("reading-content").hidden, true);
  assert.equal(h.storage.has("harithsa.reader-ready"), false);
});

test("Back navigation waits for Firebase initialization instead of treating null as signed out", async () => {
  const h = harness();
  const restored = deferred();
  h.auth.authStateReady = () => restored.promise;
  h.windowHandlers.get("pageshow")({ persisted: true });
  await tick();
  assert.equal(h.node("reading-gate").hidden, true);
  assert.equal(h.requests.length, 0);
  await h.identity(true);
  restored.resolve();
  await tick();
  h.reply(0);
  h.reply(1);
  await tick();
  assert.equal(h.node("reading-content").hidden, false);
  assert.equal(h.states.includes("signed-out"), false);
});

test("collection switches keep generic navigation visible and clear content while loading", async () => {
  const h = harness();
  await h.identity(true);
  h.reply(0);
  h.reply(1);
  await tick();
  assert.equal(await h.navigate("people"), true);
  assert.equal(h.location.pathname, "/people-and-journal/people");
  assert.deepEqual(h.historyWrites, [
    { state: null, path: "/people-and-journal/people" },
  ]);
  assert.equal(h.node("reading-toolbar").hidden, false);
  assert.equal(h.node("reading-content").hidden, true);
  assert.equal(h.node("reading-gate").hidden, true);
  assert.equal(h.requests[3].path, "/api/reading/people");
  h.reply(2);
  h.reply(3);
  await tick();
  assert.equal(h.node("reading-content").hidden, false);
  assert.equal(h.links[0].getAttribute("aria-current"), null);
  assert.equal(h.links[1].getAttribute("aria-current"), "page");
});

test("rapid collection switches ignore older data and Back revalidates the restored collection", async () => {
  const h = harness();
  await h.identity(true);
  h.reply(0);
  h.reply(1);
  await tick();
  await h.navigate("people");
  await h.navigate("journal");
  h.reply(2);
  h.reply(3);
  await tick();
  assert.equal(h.node("reading-content").hidden, true);
  h.reply(4);
  h.reply(5);
  await tick();
  assert.equal(h.node("reading-content").hidden, false);
  assert.equal(h.links[0].getAttribute("aria-current"), "page");
  await h.back("people");
  assert.equal(h.requests[7].path, "/api/reading/people");
  assert.equal(h.node("reading-content").hidden, true);
  h.reply(6);
  h.reply(7);
  await tick();
  assert.equal(h.node("reading-content").hidden, false);
  assert.equal(h.links[1].getAttribute("aria-current"), "page");
  assert.equal(h.historyWrites.length, 2);
});

test("modified collection clicks retain native browser navigation", async () => {
  const h = harness();
  await h.identity(true);
  h.reply(0);
  h.reply(1);
  await tick();
  assert.equal(await h.navigate("people", { ctrlKey: true }), false);
  assert.equal(h.historyWrites.length, 0);
  assert.equal(h.requests.length, 2);
});

test("access revoked during a collection switch hides navigation and all private content", async () => {
  const h = harness();
  await h.identity(true);
  h.reply(0);
  h.reply(1);
  await tick();
  await h.navigate("people");
  h.reply(2, 403, { error: { message: "Synthetic invitation ended" } });
  h.reply(3);
  await tick();
  assert.equal(h.node("reading-toolbar").hidden, true);
  assert.equal(h.node("reading-content").hidden, true);
  assert.equal(h.node("reading-gate").hidden, false);
});
