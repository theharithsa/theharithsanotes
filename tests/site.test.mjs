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

test("the original 12 article paths and all published note bodies are preserved", async () => {
  const migrated = articles.filter(
    (article) => new URL(article.source).hostname === "theharithsa.com",
  );
  assert.equal(migrated.length, 12);
  assert.equal(
    new Set(articles.map((article) => article.slug)).size,
    articles.length,
  );
  for (const article of articles) {
    const page = await readPage(`${article.slug}/index.html`);
    if (migrated.includes(article))
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
    "gallery/index.html",
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

test("article contents links resolve and original ordered/unordered lists survive sanitization", async () => {
  for (const article of articles) {
    const page = await readPage(`${article.slug}/index.html`);
    const countLists = (html) =>
      (html.match(/<(?:ul|ol)(?:\s[^>]*|)>/g) ?? []).length;
    const body =
      page
        .split('class="article-body">')[1]
        ?.split('<div class="article-margin-note"')[0] ?? "";
    assert.equal(countLists(body), countLists(article.html), article.slug);
    for (const [, id] of page.matchAll(/href="#(heading-[^"]+)"/g)) {
      assert.ok(page.includes(`id="${id}"`), `Missing article section ${id}`);
    }
  }
});

test("feed and sitemap include every migrated canonical article exactly once", async () => {
  const feed = await readPage("rss.xml");
  const sitemap = await readPage("sitemap.xml");
  assert.equal((feed.match(/<item>/g) ?? []).length, articles.length);
  for (const article of articles)
    assert.equal(
      sitemap.split(`<loc>https://theharithsa.com/${article.slug}</loc>`)
        .length - 1,
      1,
    );
});

test("the LinkedIn note is published with attribution and dt-mac-agent is discoverable", async () => {
  const note = articles.find(
    (article) => article.slug === "the-war-room-is-dead",
  );
  assert.ok(note);
  const page = await readPage(`${note.slug}/index.html`);
  assert.ok(page.includes(note.source));
  assert.ok(page.includes("Photo by Photos of Korea on Unsplash"));
  assert.ok(page.includes("The signal is there. Every time."));
  assert.ok(!page.includes("Recommended by LinkedIn"));
  for (const route of ["index.html", "notes/index.html"]) {
    assert.ok((await readPage(route)).includes(`href="/${note.slug}"`));
  }
  assert.ok(
    (await readPage("projects/index.html")).includes(
      'href="https://github.com/theharithsa/dt-mac-agent"',
    ),
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
