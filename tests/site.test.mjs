import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { listening } from "../src/data/interests.ts";
import { books, completedBooks } from "../src/data/books.ts";
import { projects } from "../src/data/projects.ts";
import { screenNotes } from "../src/data/screen-notes.ts";

const root = new URL("../", import.meta.url);
const sourceArticles = JSON.parse(
  await readFile(new URL("src/data/articles.json", root), "utf8"),
);
const blogArt = JSON.parse(
  await readFile(new URL("src/data/blog-art.json", root), "utf8"),
);
const mediumArticles = JSON.parse(
  await readFile(new URL("src/data/medium-articles.json", root), "utf8"),
);
const articles = [...sourceArticles, ...mediumArticles].map((article) => ({
  ...article,
  ...blogArt.find((art) => art.slug === article.slug),
}));
const readPage = (path) => readFile(new URL(`dist/${path}`, root), "utf8");

test("Medium migration accounts for all 83 stories, original bodies, dates and copied media", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("docs/medium-import.json", root), "utf8"),
  );
  const media = JSON.parse(
    await readFile(new URL("docs/medium-media.json", root), "utf8"),
  );
  const sources = JSON.parse(
    await readFile(new URL("src/data/medium-sources.json", root), "utf8"),
  );
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  assert.equal(manifest.articles.length, 83);
  assert.equal(mediumArticles.length, 75);
  assert.equal(sources.length, 8);
  assert.equal(articles.length, 88);
  assert.equal(
    new Set(manifest.articles.map((entry) => entry.source)).size,
    83,
  );
  for (const record of manifest.articles) {
    const page = await readPage(`${record.slug}/index.html`);
    assert.ok(page.includes(`href="${record.source}"`));
    if (record.status === "existing-article") {
      assert.ok(sourceArticles.some((article) => article.slug === record.slug));
      continue;
    }
    const article = mediumArticles.find(
      (article) => article.slug === record.slug,
    );
    assert.ok(article);
    assert.equal(digest(article.html), record.bodySha256, record.slug);
    assert.equal(article.sourcePublishedAt, record.originalDate);
    assert.equal(
      article.date.slice(0, 10),
      new Date(`${record.originalDate} 12:00:00 GMT`)
        .toISOString()
        .slice(0, 10),
    );
    assert.ok(page.includes('class="article-body"'));
    const renderedBody =
      page.split('class="article-body">')[1]?.split("</div>")[0] ?? "";
    for (const tag of ["pre", "br", "figure", "blockquote"]) {
      const pattern = new RegExp(`<${tag}(?:\\s[^>]*|)>`, "g");
      assert.equal(
        (renderedBody.match(pattern) ?? []).length,
        (article.html.match(pattern) ?? []).length,
        `${record.slug}: ${tag}`,
      );
    }
  }
  assert.equal(media.length, 151);
  for (const image of media) {
    const buffer = await readFile(new URL(`public${image.path}`, root));
    assert.equal(buffer.length, image.bytes);
    assert.equal(digest(buffer), image.sha256);
    assert.equal(new URL(image.sourceImage).hostname, "miro.medium.com");
  }
});

test("Goodreads journal preserves all 50 personal ratings and original reviews", async () => {
  assert.equal(completedBooks.length, 50);
  assert.equal(new Set(completedBooks.map((book) => book.slug)).size, 50);
  assert.equal(
    completedBooks.filter((book) => book.goodreads.review).length,
    46,
  );
  assert.equal(
    books.length,
    50,
    "Only the confirmed read collection belongs on this shelf",
  );
  const archive = await readPage("books/index.html");
  const sitemap = await readPage("sitemap.xml");
  const escape = (text) =>
    text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  for (const book of completedBooks) {
    const entry = book.goodreads;
    assert.ok(entry.shelves.includes("read"));
    assert.ok(
      Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5,
    );
    const route = `/books/${book.slug}`;
    const page = await readPage(`books/${book.slug}/index.html`);
    assert.ok(archive.includes(`href="${route}"`));
    assert.ok(page.includes(`My rating: ${entry.rating} out of 5 stars`));
    assert.ok(page.includes(`href="${entry.reviewUrl}"`));
    assert.ok(page.includes(`href="${entry.goodreadsUrl}"`));
    assert.ok(
      sitemap.includes(`<loc>https://theharithsanotes.com${route}</loc>`),
    );
    for (const paragraph of entry.review.split(/\n\s*\n/).filter(Boolean)) {
      assert.ok(
        page
          .replace(/\s+/g, " ")
          .includes(escape(paragraph).replace(/\s+/g, " ")),
        `Review text changed: ${book.title}`,
      );
    }
    if (!entry.review)
      assert.ok(
        !page.includes('id="review-heading"'),
        "Do not invent a review",
      );
  }
  assert.ok(!archive.includes('id="book-search"'));
  assert.ok(archive.includes('href="/search"'));
  assert.ok(archive.includes('id="book-rating-filter"'));
});

test("screen reflections have reading pages, lessons and discoverable canonical links", async () => {
  const archive = await readPage("entertainment/index.html");
  const sitemap = await readPage("sitemap.xml");
  assert.equal(
    new Set(screenNotes.map((note) => note.slug)).size,
    screenNotes.length,
  );
  assert.ok(screenNotes.some((note) => note.kind === "Movie"));
  assert.ok(screenNotes.some((note) => note.kind === "Series"));
  for (const note of screenNotes) {
    const route = `/entertainment/${note.slug}`;
    const page = await readPage(`entertainment/${note.slug}/index.html`);
    assert.equal(new URL(note.officialUrl).protocol, "https:");
    const poster = await readFile(new URL(`public${note.poster.src}`, root));
    assert.equal(
      poster.readUInt16BE(0),
      0xffd8,
      `Invalid poster: ${note.title}`,
    );
    assert.ok(
      !archive.includes(`src="${note.poster.src}"`),
      "Real posters belong inside opened reflections",
    );
    assert.ok(page.includes(`src="${note.poster.src}"`));
    for (const html of [archive, page]) {
      assert.ok(html.includes(`href="${note.officialUrl}"`));
    }
    assert.ok(page.includes(`href="${note.poster.source}"`));
    assert.ok(archive.includes(`href="${route}"`));
    assert.equal(
      sitemap.split(`<loc>https://theharithsanotes.com${route}</loc>`).length -
        1,
      1,
    );
    assert.ok(page.includes(`href="https://theharithsanotes.com${route}"`));
    assert.ok(page.includes(note.lesson));
    for (const paragraph of note.paragraphs)
      assert.ok(page.includes(paragraph), note.slug);
    assert.ok(
      !/https?:\/\/(?:app\.)?notion\.(?:com|so)|collection:\/\//i.test(page),
    );
  }
});

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
    assert.ok(
      page.includes(`href="https://theharithsanotes.com/${article.slug}"`),
    );
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
    "blogs/index.html",
    "books/index.html",
    "gogs/index.html",
    "podcasts/index.html",
    "podcasts/created/index.html",
    ...listening.map((note) => `podcasts/listening/${note.slug}/index.html`),
    "entertainment/index.html",
    "meet-vish/index.html",
    "projects/index.html",
    "gallery/index.html",
    "privacy/index.html",
    ...projects.map((project) => `projects/${project.slug}/index.html`),
    ...screenNotes.map((note) => `entertainment/${note.slug}/index.html`),
    ...articles.map((article) => `${article.slug}/index.html`),
  ];
  for (const route of routes) {
    const html = await readPage(route);
    for (const match of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) {
      const pathname = new URL(match[1], "https://theharithsanotes.com")
        .pathname;
      const file = /\.[a-z0-9]+$/i.test(pathname)
        ? pathname.slice(1)
        : `${pathname.replace(/^\//, "")}${pathname.endsWith("/") ? "" : "/"}index.html`;
      await assert.doesNotReject(
        access(new URL(`dist/${file}`, root)),
        `${route}: ${pathname}`,
      );
      const target = new URL(match[1], "https://theharithsanotes.com");
      if (target.hash && /\.html$/.test(file)) {
        const targetHtml = await readPage(file);
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(
          targetHtml.includes(`id="${id}"`),
          `${route}: missing ${target.pathname}${target.hash}`,
        );
      }
    }
  }
});

test("home does not repeat visible story headings", async () => {
  const main = (await readPage("index.html"))
    .split('<main id="main">')[1]
    ?.split("</main>")[0];
  assert.ok(main);
  const headings = [...main.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)].map(
    (match) => match[1].replace(/<[^>]+>/g, "").trim(),
  );
  assert.ok(headings.length > 0);
  assert.equal(new Set(headings).size, headings.length);
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
      sitemap.split(`<loc>https://theharithsanotes.com/${article.slug}</loc>`)
        .length - 1,
      1,
    );
});

test("the LinkedIn note is published with attribution and dt-mac-agent is discoverable", async () => {
  const note = articles.find(
    (article) => article.slug === "the-war-room-is-dead",
  );
  assert.ok(note);
  assert.ok(
    note.minutes >= 5,
    "The full-length essay must not be labelled as a one-minute read",
  );
  const page = await readPage(`${note.slug}/index.html`);
  assert.ok(page.includes(note.source));
  assert.ok(
    page.includes("Original illustration created for The Harithsa Notes."),
  );
  assert.ok(page.includes("The signal is there. Every time."));
  assert.ok(!page.includes("Recommended by LinkedIn"));
  for (const route of ["index.html", "notes/index.html"]) {
    assert.ok((await readPage(route)).includes(`href="/${note.slug}"`));
  }
  assert.ok(
    (await readPage("projects/dt-mac-agent/index.html")).includes(
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
function telemetryHarness(
  hostname,
  stored,
  blocked = false,
  pathname = "/",
  search = "",
) {
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
    URLSearchParams,
    window: { addEventListener: () => {} },
    location: {
      hostname,
      origin: `https://${hostname}`,
      pathname,
      search,
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

test("private workspace and draft previews never load browser analytics", () => {
  for (const [path, query] of [
    ["/admin", ""],
    ["/the-war-room-is-dead", "?preview=blogs:draft"],
  ]) {
    const view = telemetryHarness(
      "theharithsa.com",
      "granted",
      false,
      path,
      query,
    );
    assert.equal(view.requests.length, 0);
    assert.equal(view.banner.hidden, true);
  }
});

test("local preview stays isolated from production even when consent is granted", () => {
  const local = telemetryHarness("127.0.0.1", "granted");
  assert.deepEqual(local.requests, []);
  const blocked = telemetryHarness("localhost", undefined, true);
  assert.doesNotThrow(() => blocked.controls.get("granted").click());
  assert.deepEqual(blocked.requests, []);
});

test("every project opens a researched detail page with a distinct cover and verified resources", async () => {
  const archive = await readPage("projects/index.html");
  const sitemap = await readPage("sitemap.xml");
  assert.equal(projects.length, 12);
  assert.equal(
    new Set(projects.map((project) => project.image)).size,
    projects.length,
  );
  assert.equal(
    (archive.match(/class="workbench-card"/g) ?? []).length,
    projects.length,
  );
  for (const project of projects) {
    const route = `/projects/${project.slug}`;
    const page = await readPage(`projects/${project.slug}/index.html`);
    assert.ok(archive.includes(`id="${project.slug}"`));
    assert.ok(archive.includes(`href="${route}"`));
    assert.ok(page.includes(`href="${project.href}"`));
    assert.ok(page.includes(`href="/projects#${project.slug}"`));
    assert.ok(project.source.startsWith("https://github.com/"));
    assert.ok(page.includes(`href="${project.source}"`));
    assert.ok(!page.includes("Repository link not yet published"));
    assert.ok(project.overview.join(" ").length > 300);
    assert.equal(project.features.length, 4);
    assert.ok(page.includes("Original illustration"));
    const renderedImage = [...page.matchAll(/<img\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => tag.includes('class="project-concept"'));
    assert.ok(renderedImage?.includes("srcset="));
    assert.ok(renderedImage?.includes(`${project.slug}-editorial-v2`));
    assert.ok(renderedImage?.includes(".webp"));
    const imagePath = renderedImage.match(/src="([^"]+)"/)[1];
    const optimizedImage = await readFile(new URL(`dist${imagePath}`, root));
    assert.ok(
      optimizedImage.length < 300000,
      `Oversized project image: ${project.slug}`,
    );
    const image = await readFile(new URL(`public${project.image}`, root));
    assert.equal(image.subarray(1, 4).toString(), "PNG");
    assert.equal(image.readUInt32BE(16), 1536);
    assert.equal(image.readUInt32BE(20), 1024);
    assert.equal(
      sitemap.split(`<loc>https://theharithsanotes.com${route}</loc>`).length -
        1,
      1,
    );
  }
});

test("all blog articles use unique responsive editorial covers without changing source bodies", async () => {
  assert.equal(blogArt.length, articles.length);
  assert.equal(new Set(blogArt.map((art) => art.image)).size, articles.length);
  const archive = await readPage("blogs/index.html");
  for (const art of blogArt) {
    const page = await readPage(`${art.slug}/index.html`);
    assert.ok(page.includes(basename(art.image, ".png")));
    assert.ok(archive.includes(basename(art.image, ".png")));
    assert.ok(page.includes('class="blog-editorial-art"'));
    assert.ok(page.includes(art.imageCredit));
    const master = await readFile(new URL(`public${art.image}`, root));
    assert.equal(master.subarray(1, 4).toString(), "PNG");
    assert.equal(master.readUInt32BE(16), 1536);
    assert.equal(master.readUInt32BE(20), 1024);
    const cover = [...page.matchAll(/<img\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => tag.includes('class="blog-editorial-art"'));
    assert.ok(cover.includes("srcset="));
    assert.ok(cover.includes(".webp"));
  }
});

test("podcast listening journeys preserve notes and resources while Created stays empty", async () => {
  const index = await readPage("podcasts/index.html");
  const created = await readPage("podcasts/created/index.html");
  const sitemap = await readPage("sitemap.xml");
  assert.equal(
    (index.match(/class="workbench-card"/g) ?? []).length,
    listening.length,
  );
  assert.equal(
    new Set(listening.map((note) => note.slug)).size,
    listening.length,
  );
  for (const note of listening) {
    const route = `/podcasts/listening/${note.slug}`;
    const page = await readPage(`podcasts/listening/${note.slug}/index.html`);
    assert.ok(index.includes(`href="${route}"`));
    assert.ok(page.includes(`href="${note.href}"`));
    assert.ok(page.includes(note.note));
    assert.ok(page.includes(note.status));
    assert.ok(page.includes(`href="/podcasts#${note.slug}"`));
    assert.ok(
      sitemap.includes(`<loc>https://theharithsanotes.com${route}</loc>`),
    );
  }
  assert.ok(created.includes('aria-label="No created episodes yet"'));
  assert.ok(!created.includes('class="workbench-card"'));
  assert.ok(!/<(?:audio|iframe)\b/.test(created));
});

test("section menus use full-label disclosure buttons and seven local portrait illustrations", async () => {
  const home = await readPage("index.html");
  const header = home
    .split('<header class="site-header">')[1]
    .split("</header>")[0];
  assert.ok(!/[⌄↗]/.test(header));
  assert.match(header, />\s*Blog\s*<\/button>/);
  assert.ok(!/>\s*Blogs\s*<\/button>/.test(header));
  assert.equal((header.match(/class="nav-disclosure"/g) ?? []).length, 7);
  assert.equal((header.match(/class="menu-illustration"/g) ?? []).length, 7);
  for (const slug of [
    "blogs",
    "books",
    "podcasts",
    "projects",
    "entertainment",
    "meet-vish",
    "gogs",
  ]) {
    assert.ok(header.includes(`${slug}-portrait-v1`));
    const master = await readFile(
      new URL(`public/images/navigation/${slug}-portrait-v1.png`, root),
    );
    assert.equal(master.subarray(1, 4).toString(), "PNG");
  }
  assert.ok(home.includes('href="/projects/copilot-otel"'));
  assert.ok(home.includes("aroha-retreat-editorial-v2"));
});
