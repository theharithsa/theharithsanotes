import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import {
  isPublicDestination,
  revealElement,
} from "../src/lib/public-motion.ts";
import { socialProfiles } from "../src/data/social.ts";
test("public motion excludes private, draft, API, authentication and search destinations", () => {
  for (const path of [
    "/admin",
    "/admin/api",
    "/people-and-journal/journal",
    "/account",
    "/api/cms/me",
    "/__/auth/handler",
    "/search?q=books",
    "/blogs?preview=blogs:example",
  ])
    assert.equal(
      isPublicDestination(new URL(path, "https://example.test")),
      false,
      path,
    );
  for (const path of [
    "/",
    "/blogs?tag=AI",
    "/books",
    "/projects",
    "/meet-vish",
    "/gallery",
  ])
    assert.equal(
      isPublicDestination(new URL(path, "https://example.test")),
      true,
      path,
    );
});
test("rapid filter reveals cancel older motion and reduced-motion cancels without restarting", () => {
  const records = [];
  let cancelled = 0;
  const target = {
    animate: (frames, options) => {
      records.push({ frames, options });
      return { cancel: () => cancelled++ };
    },
  };
  revealElement(target, false);
  revealElement(target, false);
  assert.equal(records.length, 2);
  assert.equal(cancelled, 1);
  assert.equal(records[1].options.duration, 240);
  revealElement(target, true);
  assert.equal(records.length, 2);
  assert.equal(cancelled, 2);
  assert.doesNotThrow(() => revealElement({}, false));
});
const motionSource = await readFile(
  new URL("../src/scripts/page-motion.ts", import.meta.url),
  "utf8",
);
const client = ts
  .transpileModule(motionSource.replace(/^import .*;\r?\n/, ""), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  })
  .outputText.replace(/export \{\};?\s*$/, "");
function setup(publicPage = true) {
  const events = new Map(),
    windowEvents = new Map(),
    root = { dataset: publicPage ? { pageMotion: "public" } : {} },
    status = { hidden: true },
    results = {};
  let reveals = 0;
  class Target {
    constructor(link = null, filter = false) {
      this.link = link;
      this.filter = filter;
    }
    closest(selector) {
      return selector === "a[href]" ? this.link : this.filter ? {} : null;
    }
    matches(selector) {
      return selector === "#book-rating-filter";
    }
  }
  const context = {
    document: {
      documentElement: root,
      querySelector: (selector) =>
        selector === "#page-navigation-status" ? status : results,
      addEventListener: (name, fn) => events.set(name, fn),
    },
    window: {
      matchMedia: () => ({ matches: false }),
      addEventListener: (name, fn) => windowEvents.set(name, fn),
    },
    Element: Target,
    location: { href: "https://example.test/books" },
    URL,
    isPublicDestination,
    revealElement: () => reveals++,
    queueMicrotask: (fn) => fn(),
  };
  vm.runInNewContext(client, context);
  return {
    root,
    status,
    events,
    windowEvents,
    reveals: () => reveals,
    click: (href, extra = {}) => {
      const link = { href, target: "", hasAttribute: () => false };
      const event = { target: new Target(link), button: 0, ...extra };
      events.get("click")?.(event);
      return event;
    },
    filter: () => events.get("click")?.({ target: new Target(null, true) }),
  };
}
test("native navigation feedback ignores modifiers, external/private/hash links and resets on Back", () => {
  const h = setup();
  for (const [href, extra] of [
    ["https://example.test/projects", { ctrlKey: true }],
    ["https://other.test/", {}],
    ["https://example.test/admin", {}],
    ["https://example.test/books#shelf", {}],
    ["https://example.test/projects", { defaultPrevented: true }],
  ]) {
    h.click(href, extra);
    assert.equal(h.root.dataset.navigating, undefined);
  }
  const event = h.click("https://example.test/projects");
  assert.equal(event.defaultPrevented, undefined);
  assert.equal(h.root.dataset.navigating, "true");
  assert.equal(h.status.hidden, false);
  h.windowEvents.get("pageshow")();
  assert.equal(h.root.dataset.navigating, undefined);
  assert.equal(h.status.hidden, true);
  h.filter();
  assert.equal(h.reveals(), 1);
  const privatePage = setup(false);
  assert.equal(privatePage.events.size, 0);
});
test("published footer contains each owner profile and the same badge links from Meet Vish", async () => {
  const [home, meet, privatePage] = await Promise.all(
    ["index.html", "meet-vish/index.html", "admin/index.html"].map((path) =>
      readFile(new URL(`../dist/${path}`, import.meta.url), "utf8"),
    ),
  );
  const footer = home.slice(home.indexOf("<footer"), home.indexOf("</footer>"));
  for (const profile of socialProfiles) {
    assert.ok(footer.includes(`href="${profile.href}"`), profile.name);
    assert.ok(footer.includes(profile.name));
  }
  assert.ok(footer.includes('href="https://we.directory/theharithsa"'));
  assert.equal(
    (meet.match(/href="https:\/\/we.directory\/theharithsa"/g) || []).length,
    2,
  );
  assert.match(home, /data-page-motion="public"/);
  assert.doesNotMatch(privatePage, /data-page-motion="public"/);
  assert.doesNotMatch(
    privatePage,
    /@view-transition\s*\{\s*navigation:\s*auto/,
  );
});
