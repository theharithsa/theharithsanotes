import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
const source = await readFile(
  new URL("../src/scripts/cms.ts", import.meta.url),
  "utf8",
);
const client = ts.transpileModule(
  source.slice(
    source.indexOf("function collectionPhase("),
    source.indexOf("function currentSection("),
  ),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;
function setup() {
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id))
      nodes.set(id, {
        dataset: {},
        hidden: false,
        disabled: false,
        textContent: "",
        attrs: {},
        children: ["old"],
        setAttribute(k, v) {
          this.attrs[k] = v;
        },
        replaceChildren() {
          this.children = [];
        },
      });
    return nodes.get(id);
  };
  const requests = [];
  const context = vm.createContext({
    element: node,
    document: { querySelectorAll: () => [] },
    workspaceReady: true,
    loadingGeneration: 0,
    section: "blogs",
    rows: [{ id: "old" }],
    nextCursor: "next-page",
    descriptions: {
      blogs: { title: "Blog" },
      books: { title: "Books" },
      people: { title: "People" },
    },
    notice: node("notice"),
    message: (value) => (node("notice").textContent = value),
    Error,
    api: (path) =>
      new Promise((resolve, reject) =>
        requests.push({ path, resolve, reject }),
      ),
    renderRows: () => {
      node("cms-rows").children = Array.from(context.rows);
      node("cms-more").hidden = !context.nextCursor;
    },
  });
  vm.runInContext(client, context);
  return {
    context,
    node,
    requests,
    load: (append = false) => context.loadCollection(append),
  };
}
test("collection loading clears old rows, keeps controls and reveals only the current response", async () => {
  const h = setup(),
    first = h.load();
  assert.equal(h.node("cms-table-region").attrs["aria-busy"], "true");
  assert.equal(h.node("cms-collection-loading").hidden, false);
  assert.equal(h.node("cms-rows").children.length, 0);
  h.context.section = "books";
  const second = h.load();
  h.requests[0].resolve({ entries: [{ id: "stale" }], next: null });
  await first;
  assert.equal(h.node("cms-table-region").dataset.state, "loading");
  h.requests[1].resolve({ entries: [{ id: "book" }], next: null });
  await second;
  assert.equal(h.node("cms-rows").children[0].id, "book");
  assert.equal(h.node("cms-table-region").dataset.state, "ready");
  assert.equal(h.node("cms-table-region").attrs["aria-busy"], "false");
  assert.equal(h.node("cms-collection-loading").hidden, true);
});
test("pagination preserves existing rows and cursor while disabling duplicate load-more", async () => {
  const h = setup(),
    task = h.load(true);
  assert.equal(h.requests[0].path, "entries/blogs?cursor=next-page");
  assert.equal(h.node("cms-more").disabled, true);
  assert.equal(h.context.rows[0].id, "old");
  assert.equal(h.node("cms-table-region").dataset.state, "appending");
  h.requests[0].resolve({ entries: [{ id: "new" }], next: null });
  await task;
  assert.deepEqual(
    Array.from(h.context.rows, (row) => row.id),
    ["old", "new"],
  );
  assert.equal(h.node("cms-more").disabled, false);
});
test("a failed collection stops shimmering and stays retryable without old rows", async () => {
  const h = setup(),
    task = h.load();
  h.requests[0].reject(new Error("Unavailable"));
  await task;
  assert.equal(h.node("cms-table-region").dataset.state, "error");
  assert.equal(h.node("cms-collection-loading").hidden, true);
  assert.equal(h.node("cms-rows").children.length, 0);
  assert.match(h.node("cms-row-count").textContent, /Try Refresh/);
  const retry = h.load();
  h.requests[1].resolve({ entries: [], next: null });
  await retry;
  assert.equal(h.node("cms-table-region").dataset.state, "ready");
});
test("a response after sign-out or a developer-view switch cannot reveal rows", async () => {
  for (const suspend of [
    (h) => (h.context.workspaceReady = false),
    (h) => h.context.loadingGeneration++,
  ]) {
    const h = setup(),
      task = h.load();
    suspend(h);
    h.requests[0].resolve({ entries: [{ id: "late" }], next: null });
    await task;
    assert.equal(h.node("cms-rows").children.length, 0);
    assert.notEqual(h.node("cms-table-region").dataset.state, "ready");
  }
});
