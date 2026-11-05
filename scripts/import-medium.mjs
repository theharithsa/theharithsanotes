import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { parseDocument } from "htmlparser2";
import { findAll, getInnerHTML, textContent } from "domutils";
import sanitizeHtml from "sanitize-html";

const captureDirectory = process.argv[2] ?? "qa/local";
const legacy = JSON.parse(await readFile("src/data/articles.json", "utf8"));
const inventory = JSON.parse(
  await readFile(join(captureDirectory, "medium-inventory.json"), "utf8"),
);
const art = JSON.parse(await readFile("docs/medium-art-prompts.json", "utf8"));
const duplicateSlugs = new Map([
  [0, "unravelling-the-components-of-enterprise-cloud"],
  [3, "a-glimpse-into-hypermodal-ai-and-its-potential-in-indian-markets"],
  [4, "exploring-the-future-with-hypermodal-ai"],
  [6, "artificial-intelligence-the-future-is-then-and-now"],
  [7, "entry-of-dynatrace"],
  [8, "apis-101"],
  [9, "evolution-of-observability"],
  [11, "which-is-better-spring-boot-or-nodejs"],
]);
const slugify = (value) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const captures = await Promise.all(
  inventory.map((_, index) =>
    readFile(
      join(
        captureDirectory,
        `medium-article-${String(index).padStart(3, "0")}.json`,
      ),
      "utf8",
    ).then(JSON.parse),
  ),
);
const canonicalBySource = new Map(
  captures.map((entry) => [
    entry.url,
    duplicateSlugs.get(entry.index) ?? slugify(entry.title.normalize("NFKC")),
  ]),
);
const media = [];
const manifest = [];
const imported = [];
const importedArt = [];
const normalizeLink = (href, source) => {
  try {
    const url = new URL(href, source);
    if (!["https:", "http:", "mailto:"].includes(url.protocol)) return "";
    if (url.hostname.endsWith("medium.com")) {
      const canonical = canonicalBySource.get(url.origin + url.pathname);
      if (canonical) return `/${canonical}${url.hash}`;
      for (const key of ["source", "sk", "gi"]) url.searchParams.delete(key);
    }
    return url.href;
  } catch {
    return "";
  }
};
const cleanHtml = (html, source) =>
  sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "strong",
      "b",
      "em",
      "i",
      "s",
      "del",
      "a",
      "blockquote",
      "pre",
      "code",
      "figure",
      "figcaption",
      "img",
      "hr",
      "br",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      ol: ["start", "reversed"],
      li: ["value"],
      img: ["src", "alt", "loading", "width", "height"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: {
          href: normalizeLink(attrs.href ?? "", source),
          ...(attrs.title ? { title: attrs.title } : {}),
        },
      }),
    },
  });
async function copyImage(image, id, figureIndex, source) {
  const url = new URL(image.src);
  if (url.protocol !== "https:" || url.hostname !== "miro.medium.com")
    throw new Error(`Unapproved image host in ${id}`);
  const prefix = `medium-${id}-figure-${figureIndex}`;
  const directory = "public/images/medium";
  await mkdir(directory, { recursive: true });
  const cachePath = join(captureDirectory, `${prefix}.json`);
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    await access(`public${cached.path}`);
    media.push(cached);
    return cached.path;
  } catch {
    /* No saved copy; download the public image observed in the article. */
  }
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (response.ok) break;
    if (response.status < 500) break;
  }
  if (!response?.ok)
    throw new Error(
      `Image download failed for ${prefix}: HTTP ${response?.status}`,
    );
  const type = response.headers.get("content-type")?.split(";")[0];
  const extension = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]).get(type);
  if (!extension) throw new Error(`Unexpected image type for ${prefix}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 15000000 || buffer.length < 50)
    throw new Error(`Unexpected image size for ${prefix}`);
  const path = `/images/medium/${prefix}.${extension}`;
  await writeFile(`public${path}`, buffer);
  const record = {
    path,
    sourceImage: url.href,
    article: source,
    originalAlt: image.alt,
    bytes: buffer.length,
    sha256: hash(buffer),
  };
  await writeFile(cachePath, JSON.stringify(record));
  media.push(record);
  return path;
}
for (const entry of captures) {
  if (
    entry.author !== "Vishruth Harithsa" ||
    !entry.date ||
    !entry.blocks?.length
  )
    throw new Error(`Incomplete article ${entry.index}`);
  if (
    /you.ve read all|get unlimited access to read|this story is available exclusively|purchase a membership/i.test(
      entry.text,
    )
  )
    throw new Error(`Access gate in article ${entry.index}`);
  const slug = canonicalBySource.get(entry.url);
  const duplicate = duplicateSlugs.has(entry.index);
  const sourceText = entry.blocks.map((block) => block.text).join("\n\n");
  const record = {
    source: entry.url,
    title: entry.title.normalize("NFKC"),
    slug,
    status: duplicate ? "existing-article" : "imported",
    sourceBlocks: entry.blocks.length,
    sourceTextSha256: hash(sourceText),
    sourceWords: sourceText.split(/\s+/).length,
    originalDate: entry.date,
  };
  if (duplicate) {
    if (!legacy.some((article) => article.slug === slug))
      throw new Error(`Missing duplicate destination ${slug}`);
    manifest.push(record);
    continue;
  }
  const id = entry.url.match(/-([a-f0-9]+)$/)?.[1];
  const artwork = art.assets.find((asset) => asset.index === entry.index);
  if (!artwork) throw new Error(`Missing artwork plan ${entry.index}`);
  const chunks = [];
  let figureIndex = 0;
  for (const block of entry.blocks) {
    if (block.tag !== "FIGURE") {
      chunks.push(cleanHtml(block.html, entry.url));
      continue;
    }
    figureIndex++;
    const root = parseDocument(block.html);
    const caption = findAll(
      (node) => node.type === "tag" && node.name === "figcaption",
      root.children,
    )[0];
    const captionHtml = caption
      ? cleanHtml(getInnerHTML(caption), entry.url)
      : "";
    const image = block.images[0];
    if (image) {
      const path = await copyImage(image, id, figureIndex, entry.url);
      chunks.push(
        `<figure><img src="${path}" alt="${escape(image.alt ?? "")}" loading="lazy">${captionHtml ? `<figcaption>${captionHtml}</figcaption>` : ""}</figure>`,
      );
    } else if (captionHtml) {
      chunks.push(
        `<figure><figcaption>${captionHtml} · <a href="${escape(entry.url)}">View the original media on Medium</a></figcaption></figure>`,
      );
    }
  }
  const html = chunks.join("\n");
  const date = new Date(`${entry.date} 12:00:00 GMT`);
  if (!Number.isFinite(date.getTime()))
    throw new Error(`Unrecognized publication date ${entry.index}`);
  const topic = /cloud|dynatrace|observability|aiops|performance/i.test(
    entry.title,
  )
    ? "Observability"
    : /chatgpt|artificial intelligence|javascript|spring boot|node\.js|api|git basics|programming|azure|browsers|apps that/i.test(
          entry.title,
        )
      ? "AI & building"
      : "Life & learning";
  const firstParagraph =
    entry.blocks
      .find((block) => block.tag === "P")
      ?.text.replace(/\s+/g, " ")
      .trim() ?? "";
  const description =
    entry.subtitle.normalize("NFKC") ||
    (firstParagraph.length > 210
      ? firstParagraph.slice(0, 210).replace(/\s+\S*$/, "") + "…"
      : firstParagraph);
  imported.push({
    slug,
    title: entry.title.normalize("NFKC"),
    description,
    date: date.toISOString(),
    topic,
    image: artwork.path.replace(/^public/, ""),
    imageAlt: artwork.subject,
    imageCredit: "Original illustration created for The Harithsa Notes.",
    minutes:
      Number(entry.minutes.match(/\d+/)?.[0]) ||
      Math.max(1, Math.ceil(sourceText.split(/\s+/).length / 220)),
    html,
    source: entry.url,
    sourceLabel: "Medium",
    sourcePublishedAt: entry.date,
  });
  importedArt.push({
    slug,
    image: artwork.path.replace(/^public/, ""),
    imageAlt: artwork.subject,
    imageCredit: "Original illustration created for The Harithsa Notes.",
  });
  manifest.push({
    ...record,
    bodySha256: hash(html),
    bodyTextSha256: hash(textContent(parseDocument(html))),
    imageCount: figureIndex,
    titleNormalizedForTypography: entry.title !== entry.title.normalize("NFKC"),
  });
}
if (
  captures.length !== 83 ||
  imported.length !== 75 ||
  duplicateSlugs.size !== 8
)
  throw new Error("Archive completeness mismatch");
if (
  new Set([...legacy, ...imported].map((article) => article.slug)).size !== 88
)
  throw new Error("Duplicate article slug");
const legacyArt = JSON.parse(
  await readFile("src/data/blog-art.json", "utf8"),
).filter((asset) => legacy.some((article) => article.slug === asset.slug));
const cloudArt = art.assets.find((asset) => asset.index === 0);
Object.assign(
  legacyArt.find((asset) => asset.slug === duplicateSlugs.get(0)),
  { image: cloudArt.path.replace(/^public/, ""), imageAlt: cloudArt.subject },
);
await writeFile(
  "src/data/medium-articles.json",
  JSON.stringify(imported, null, 2) + "\n",
);
await writeFile(
  "src/data/blog-art.json",
  JSON.stringify([...legacyArt, ...importedArt], null, 2) + "\n",
);
await writeFile(
  "src/data/medium-sources.json",
  JSON.stringify(
    manifest
      .filter((record) => record.status === "existing-article")
      .map(({ slug, source }) => ({ slug, source })),
    null,
    2,
  ) + "\n",
);
await writeFile(
  "docs/medium-import.json",
  JSON.stringify({ issue: 19, articles: manifest }, null, 2) + "\n",
);
await writeFile(
  "docs/medium-media.json",
  JSON.stringify(media, null, 2) + "\n",
);
process.stdout.write(
  JSON.stringify({
    captured: captures.length,
    imported: imported.length,
    existing: duplicateSlugs.size,
    media: media.length,
  }),
);
