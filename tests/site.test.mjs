import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const articles = JSON.parse(
  await readFile(new URL("src/data/articles.json", root), "utf8"),
);
const readPage = (path) => readFile(new URL(`dist/${path}`, root), "utf8");

test("all 12 migrated articles keep their original paths and substantive content", async () => {
  assert.equal(articles.length, 12);
  assert.equal(new Set(articles.map((article) => article.slug)).size, 12);
  for (const article of articles) {
    const page = await readPage(`${article.slug}/index.html`);
    assert.equal(new URL(article.source).pathname, `/${article.slug}`);
    assert.ok(page.includes(`href="https://theharithsa.com/${article.slug}"`));
    assert.ok(page.includes('class="article-body"'));
    assert.ok(article.html.length > 1000);
    assert.ok(!/<(?:iframe|object|embed)\b/i.test(page));
    await access(new URL(`public${article.image}`, root));
  }
});

test("every internal page link and local asset resolves in the built site", async () => {
  const routes = [
    "index.html",
    "about/index.html",
    "notes/index.html",
    "projects/index.html",
    "privacy/index.html",
    ...articles.map((article) => `${article.slug}/index.html`),
  ];
  for (const route of routes) {
    const html = await readPage(route);
    for (const match of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) {
      const pathname = new URL(match[1], "https://theharithsa.com").pathname;
      const file = /\.[a-z0-9]+$/i.test(pathname)
        ? pathname.slice(1)
        : `${pathname.replace(/^\//, "")}${pathname.endsWith("/") ? "" : "/"}index.html`;
      await assert.doesNotReject(
        access(new URL(`dist/${file}`, root)),
        `${route}: ${pathname}`,
      );
    }
  }
});

test("feed and sitemap include every migrated canonical article exactly once", async () => {
  const feed = await readPage("rss.xml");
  const sitemap = await readPage("sitemap.xml");
  assert.equal((feed.match(/<item>/g) ?? []).length, 12);
  for (const article of articles)
    assert.equal(
      sitemap.split(`<loc>https://theharithsa.com/${article.slug}</loc>`)
        .length - 1,
      1,
    );
});

test("built assets contain no Dynatrace ingestion credentials or private-key material", async () => {
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (/\.(?:html|js|json|xml|css)$/.test(entry.name)) {
        const content = await readFile(path, "utf8");
        assert.ok(
          !/dt0[sac]\d\.[A-Za-z0-9]+\.[A-Za-z0-9]+|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(
            content,
          ),
          `Sensitive material in ${entry.name}`,
        );
      }
    }
  }
  await inspect(fileURLToPath(new URL("dist", root)));
});

const source = await readFile(
  new URL("src/scripts/telemetry.ts", root),
  "utf8",
);
const client = ts
  .transpileModule(
    source.replace("import.meta.env.PUBLIC_ENABLE_LOCAL_TELEMETRY", "'false'"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    },
  )
  .outputText.replace(/export \{\};?\s*$/, "");
function telemetryHarness(hostname, stored, blocked = false) {
  const handlers = new Map();
  const controls = new Map();
  const requests = [];
  const banner = { hidden: true };
  const storage = new Map(stored ? [["harithsa.analytics.v1", stored]] : []);
  for (const consent of ["granted", "denied"])
    controls.set(consent, {
      dataset: { consent },
      addEventListener: (_event, handler) =>
        (controls.get(consent).click = handler),
    });
  const context = vm.createContext({
    window: { addEventListener: () => {} },
    location: {
      hostname,
      origin: `https://${hostname}`,
      pathname: "/",
      reload: () => {},
    },
    localStorage: {
      getItem: (key) => {
        if (blocked) throw new Error("Blocked");
        return storage.get(key);
      },
      setItem: (key, value) => {
        if (blocked) throw new Error("Blocked");
        storage.set(key, value);
      },
    },
    document: {
      addEventListener: (event, callback) => handlers.set(event, callback),
      querySelector: () => banner,
      querySelectorAll: (selector) =>
        selector === "[data-consent]" ? [...controls.values()] : [],
      createElement: () => ({ addEventListener: () => {} }),
      head: { append: (element) => requests.push(element.src) },
    },
  });
  vm.runInContext(client, context);
  handlers.get("DOMContentLoaded")();
  return { requests, banner, controls, storage };
}

test("first visit and denied consent do not request monitoring scripts", () => {
  const first = telemetryHarness("theharithsa.com");
  assert.equal(first.banner.hidden, false);
  assert.deepEqual(first.requests, []);
  first.controls.get("denied").click();
  assert.equal(first.banner.hidden, true);
  assert.equal(first.storage.get("harithsa.analytics.v1"), "denied");
  assert.deepEqual(first.requests, []);
  assert.equal(
    telemetryHarness("theharithsa.com", "denied").banner.hidden,
    true,
  );
});

test("local preview stays isolated from production even when consent is granted", () => {
  const local = telemetryHarness("127.0.0.1", "granted");
  assert.deepEqual(local.requests, []);
  const blocked = telemetryHarness("localhost", undefined, true);
  assert.doesNotThrow(() => blocked.controls.get("granted").click());
  assert.deepEqual(blocked.requests, []);
});
