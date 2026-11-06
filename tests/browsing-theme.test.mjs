import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { books, genres } from "../src/data/books.ts";
import { projects } from "../src/data/projects.ts";
import { pageMeta } from "../src/lib/page-meta.ts";
const root = new URL("../", import.meta.url);
const page = (path) => readFile(new URL(`dist/${path}`, root), "utf8");
const compile = (source) =>
  ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replace(/export \{\};?\s*$/, "");
const siteClient = compile(
  await readFile(new URL("src/scripts/site.ts", root), "utf8"),
);
const themeClient = compile(
  await readFile(new URL("src/scripts/theme.ts", root), "utf8"),
);
function element(dataset = {}) {
  const listeners = new Map(),
    attrs = new Map(),
    classes = new Set();
  return {
    dataset,
    listeners,
    attrs,
    hidden: false,
    value: "",
    textContent: "",
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
    },
    setAttribute: (name, value) => attrs.set(name, value),
    addEventListener: (name, listener) => listeners.set(name, listener),
  };
}
test("read-only genre browsing combines genre, author and rating; project topics reset cleanly", () => {
  assert.equal(books.length, 50);
  for (const book of books) {
    assert.equal(book.status, "Read");
    assert.ok(book.genres.length);
    assert.ok(book.genres.every((genre) => genres.includes(genre)));
  }
  const genreSelect = element();
  genreSelect.value = "All genres";
  const bookCards = books.map((book) =>
    element({
      genres: JSON.stringify(book.genres),
      rating: String(book.goodreads.rating),
      bookSearch: `${book.title} ${book.author}`,
    }),
  );
  const topicButtons = [
    "All projects",
    ...new Set(projects.map((project) => project.category)),
  ].map((topic) => element({ projectFilter: topic }));
  const projectCards = projects.map((project) =>
    element({ topic: project.category }),
  );
  const search = element(),
    rating = element(),
    count = element(),
    empty = element(),
    grid = element(),
    projectCount = element();
  rating.value = "all";
  const singles = new Map([
    ["#book-genre-filter", genreSelect],
    ["#book-search", search],
    ["#book-rating-filter", rating],
    ["#shelf-count", count],
    ["#book-empty", empty],
    ["#project-results", grid],
    ["#project-count", projectCount],
  ]);
  const groups = new Map([
    ["[data-book]", bookCards],
    ["[data-project-filter]", topicButtons],
    ["[data-project]", projectCards],
  ]);
  vm.runInNewContext(siteClient, {
    window: { location: { search: "" }, addEventListener: () => {} },
    document: {
      querySelector: (selector) => singles.get(selector) ?? null,
      querySelectorAll: (selector) => groups.get(selector) ?? [],
      addEventListener: () => {},
    },
    URLSearchParams,
  });
  const choose = (buttons, key, value) =>
    buttons
      .find((button) => button.dataset[key] === value)
      .listeners.get("click")();
  const chooseGenre = (genre) => {
    genreSelect.value = genre;
    genreSelect.listeners.get("change")();
  };
  chooseGenre("Science & nature");
  assert.equal(count.textContent, "6 books");
  search.value = "Hawking";
  search.listeners.get("input")();
  assert.equal(count.textContent, "4 books");
  rating.value = "5";
  rating.listeners.get("change")();
  assert.equal(count.textContent, "2 books");
  search.value = "does not exist";
  search.listeners.get("input")();
  assert.equal(empty.hidden, false);
  assert.equal(count.textContent, "0 books");
  search.value = "";
  rating.value = "all";
  chooseGenre("All genres");
  assert.equal(count.textContent, "50 books");
  assert.equal(empty.hidden, true);
  for (const topic of [
    "Observability",
    "AI & tools",
    "Money & planning",
    "People & places",
  ]) {
    choose(topicButtons, "projectFilter", topic);
    const visible = projectCards.filter((card) => !card.hidden);
    assert.equal(
      visible.length,
      projects.filter((project) => project.category === topic).length,
    );
    assert.ok(visible.every((card) => card.dataset.topic === topic));
    assert.equal(grid.dataset.filtered, "true");
    assert.equal(
      visible.filter((card) => card.classList.contains("filter-lead")).length,
      visible.length >= 3 ? 1 : 0,
    );
  }
  choose(topicButtons, "projectFilter", "All projects");
  assert.equal(projectCards.filter((card) => !card.hidden).length, 12);
  assert.equal(grid.dataset.filtered, "false");
  assert.ok(
    projectCards.every((card) => !card.classList.contains("filter-lead")),
  );
});
function themeHarness({ stored, systemDark = false, blocked = false } = {}) {
  const html = element(),
    button = element(),
    chrome = {
      ...element(),
      content: "#efe1ce",
      dataset: { light: "#efe1ce", dark: "#3c3228" },
    };
  const system = {
    matches: systemDark,
    addEventListener: (_name, listener) => (system.change = listener),
  };
  const storage = new Map(stored ? [["harithsa.theme.v1", stored]] : []),
    handlers = new Map();
  vm.runInNewContext(themeClient, {
    document: {
      documentElement: html,
      querySelector: (selector) =>
        selector === "[data-theme-toggle]" ? button : chrome,
    },
    window: {
      matchMedia: () => system,
      addEventListener: (name, listener) => handlers.set(name, listener),
    },
    localStorage: {
      getItem: (key) => {
        if (blocked) throw Error("Blocked");
        return storage.get(key);
      },
      setItem: (key, value) => {
        if (blocked) throw Error("Blocked");
        storage.set(key, value);
      },
    },
  });
  return {
    html,
    button,
    chrome,
    system,
    storage,
    handlers,
    toggle: () => button.listeners.get("click")(),
  };
}
test("theme follows the system until chosen, persists, synchronizes tabs and survives blocked storage", () => {
  const auto = themeHarness({ systemDark: true });
  assert.equal(auto.html.dataset.theme, "dark");
  assert.equal(auto.chrome.content, "#3c3228");
  auto.system.matches = false;
  auto.system.change();
  assert.equal(auto.html.dataset.theme, "light");
  auto.toggle();
  assert.equal(auto.storage.get("harithsa.theme.v1"), "dark");
  assert.equal(auto.button.attrs.get("aria-label"), "Switch to light mode");
  assert.equal(auto.button.attrs.get("aria-pressed"), "true");
  auto.system.change();
  assert.equal(auto.html.dataset.theme, "dark");
  auto.handlers.get("storage")({ key: "harithsa.theme.v1", newValue: "light" });
  assert.equal(auto.html.dataset.theme, "light");
  assert.equal(auto.chrome.content, "#efe1ce");
  const saved = themeHarness({ stored: "light", systemDark: true });
  assert.equal(saved.html.dataset.theme, "light");
  const invalid = themeHarness({ stored: "not-a-theme", systemDark: true });
  assert.equal(invalid.html.dataset.theme, "dark");
  const denied = themeHarness({ blocked: true });
  assert.doesNotThrow(() => denied.toggle());
  assert.equal(denied.html.dataset.theme, "dark");
  assert.equal(denied.chrome.content, "#3c3228");
});
test("SEO, route colours, canonical aliases and GoGs are present in the built documents", async () => {
  const sitemap = await page("sitemap.xml");
  assert.ok(sitemap.includes("https://theharithsanotes.com/gogs</loc>"));
  for (const [alias, target] of [
    ["notes", "blogs"],
    ["about", "meet-vish"],
  ]) {
    assert.ok(
      (await page(`${alias}/index.html`)).includes(
        `rel="canonical" href="https://theharithsanotes.com/${target}"`,
      ),
    );
    assert.ok(!sitemap.includes(`https://theharithsanotes.com/${alias}</loc>`));
  }
  assert.ok((await page("404.html")).includes('content="noindex,follow"'));
  for (const route of [
    "books",
    "projects",
    "blogs",
    "podcasts",
    "entertainment",
    "meet-vish",
    "gallery",
    "gogs",
  ]) {
    const html = await page(`${route}/index.html`);
    const palette = pageMeta(`/${route}`);
    assert.ok(html.includes(`name="theme-color" content="${palette.light}"`));
    assert.ok(html.includes(`data-dark="${palette.dark}"`));
    for (const meta of [
      'name="description"',
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'name="twitter:image"',
    ])
      assert.ok(html.includes(meta));
    assert.ok(html.includes("data-theme-toggle"));
  }
  const gogs = await page("gogs/index.html");
  assert.ok(gogs.includes('id="games"'));
  assert.ok(gogs.includes('id="gadgets"'));
  assert.ok(gogs.includes("gogs-portrait-v1"));
  assert.ok(gogs.includes("coming soon"));
  const shelf = await page("books/index.html");
  assert.ok(!/data-shelf-filter|data-status=|>To read<|>Reading</.test(shelf));
  assert.ok(shelf.includes('id="book-genre-filter"'));
  assert.ok(!shelf.includes("data-genre-filter="));
  const articleData = JSON.parse(
    await readFile(new URL("src/data/medium-articles.json", root), "utf8"),
  );
  for (const article of articleData) {
    const html = await page(`${article.slug}/index.html`);
    const data = JSON.parse(
      html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )[1],
    );
    const schema = data["@graph"].find(
      (item) => item["@type"] === "BlogPosting",
    );
    assert.equal(schema.headline, article.title);
    assert.equal(schema.datePublished, article.date);
    assert.ok(
      schema.image[0].startsWith("https://theharithsanotes.com/images/"),
    );
  }
  for (const book of books) {
    const html = await page(`books/${book.slug}/index.html`);
    const data = JSON.parse(
      html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      )[1],
    );
    const schema = data["@graph"].find((item) => item["@type"] === "Book");
    assert.equal(schema.review.reviewRating.ratingValue, book.goodreads.rating);
    assert.equal(schema.name, book.title);
  }
});
