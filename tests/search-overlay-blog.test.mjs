import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
const root = new URL("../", import.meta.url);
const source = await readFile(new URL("src/scripts/site.ts", root), "utf8");
const client = ts.transpileModule(
  source.slice(
    source.indexOf("const search ="),
    source.indexOf("const genreFilters ="),
  ),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;
function setup(query = "") {
  const make = (dataset = {}) => ({
    dataset,
    value: "",
    hidden: false,
    textContent: "",
    events: new Map(),
    setAttribute() {},
    addEventListener(name, fn) {
      this.events.set(name, fn);
    },
  });
  const picker = make();
  picker.options = ["", "AI", "Cloud"].map((value) => ({ value }));
  const count = make(),
    empty = make(),
    reset = make();
  const buttons = ["All notes", "Observability", "Life & learning"].map(
    (filter) => make({ filter }),
  );
  const notes = [
    make({ topic: "Observability", tags: '["AI"]', search: "ai monitoring" }),
    make({ topic: "Life & learning", tags: '["AI"]', search: "ai learning" }),
    make({ topic: "Observability", tags: '["Cloud"]', search: "cloud" }),
  ];
  const location = { href: "https://example.test/blogs" + query },
    history = { replaceState: (_s, _t, url) => (location.href = url.href) };
  const singles = new Map([
    ["#blog-tag-filter", picker],
    ["#result-count", count],
    ["#empty-state", empty],
    ["[data-reset-search]", reset],
  ]);
  const groups = new Map([
    ["[data-filter]", buttons],
    ["[data-note]", notes],
  ]);
  vm.runInNewContext(client, {
    window: { location: { search: query } },
    location,
    history,
    URL,
    URLSearchParams,
    CustomEvent: class {},
    document: {
      querySelector: (key) => singles.get(key) ?? null,
      querySelectorAll: (key) => groups.get(key) ?? [],
      dispatchEvent() {},
    },
  });
  return { picker, count, notes, buttons, empty, reset, location };
}
test("compact Blog tag picker combines with topics, preserves links and resets both", () => {
  const h = setup("?tag=AI");
  assert.equal(h.count.textContent, "2 articles");
  assert.equal(h.picker.value, "AI");
  h.buttons[1].events.get("click")();
  assert.equal(h.count.textContent, "1 article");
  assert.match(h.location.href, /topic=Observability/);
  h.picker.value = "Cloud";
  h.picker.events.get("change")();
  assert.equal(h.count.textContent, "1 article");
  assert.equal(h.notes[2].hidden, false);
  h.reset.events.get("click")();
  assert.equal(h.count.textContent, "3 articles");
  assert.equal(h.picker.value, "");
  assert.equal(h.location.href, "https://example.test/blogs");
  const invalid = setup("?tag=does-not-exist");
  assert.equal(invalid.count.textContent, "3 articles");
  assert.equal(invalid.picker.value, "");
});
test("Blog masthead is editorial; shared search is one masked modal rather than a header route", async () => {
  const html = await readFile(new URL("dist/blogs/index.html", root), "utf8");
  const masthead = html.slice(
    html.indexOf('<section class="section-masthead'),
    html.indexOf("</section>"),
  );
  assert.doesNotMatch(masthead, /data-blog-tag|blog-tag-filter|blog-tag-row/);
  assert.match(html, /id="blog-tag-filter"/);
  assert.equal((html.match(/id="site-search"/g) || []).length, 1);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /data-dtrum-mask/);
  assert.match(html, /data-dt-mask/);
  assert.doesNotMatch(html, /class="search-link"[^>]*href=/);
  assert.match(html, /id="public-page-transitions"/);
  assert.match(html, /method="dialog"/);
});
