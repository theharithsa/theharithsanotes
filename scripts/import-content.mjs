import { XMLParser } from "fast-xml-parser";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const host = "https://theharithsa.com";
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  trimValues: false,
});
function text(value) {
  if (typeof value === "string") return value;
  return value?.__cdata ?? value?.["#text"] ?? "";
}
async function download(url, file) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Asset request failed: ${response.status}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}
try {
  const response = await fetch(`${host}/rss.xml`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
  const feed = parser.parse(await response.text());
  const entries = feed.rss?.channel?.item;
  if (!Array.isArray(entries) || entries.length === 0)
    throw new Error("The source feed contains no articles.");
  await mkdir("public/images", { recursive: true });
  await mkdir("src/data", { recursive: true });
  const articles = [];
  for (const [index, entry] of entries.entries()) {
    const source = text(entry.link);
    const parsed = new URL(source);
    if (parsed.origin !== host)
      throw new Error("Unexpected source article origin.");
    const slug = parsed.pathname.replace(/^\/|\/$/g, "");
    const title = text(entry.title);
    const html = text(entry["content:encoded"]);
    const imageUrl = entry.enclosure?.["@_url"];
    if (!title || !html)
      throw new Error(`Incomplete article at index ${index}.`);
    const image = imageUrl ? `/images/note-${index}.jpg` : "/images/ideas.svg";
    if (imageUrl) await download(imageUrl, `public${image}`);
    articles.push({
      slug,
      title,
      description: /senna/.test(slug)
        ? "What Ayrton Senna can teach us about ambition, perspective, and finding clarity at work."
        : text(entry.description),
      date: new Date(text(entry.pubDate)).toISOString(),
      topic: /senna/.test(slug)
        ? "Life & learning"
        : /ai|artificial-intelligence|mcp|spring|apis-101/.test(slug)
          ? "AI & building"
          : "Observability",
      image,
      imageAlt: `Cover illustration for ${title}`,
      minutes: Math.max(
        1,
        Math.ceil(html.replace(/<[^>]*>/g, " ").split(/\s+/).length / 220),
      ),
      html,
      source,
    });
  }
  await download(
    "https://github.com/theharithsa.png?size=800",
    "public/images/vishruth.jpg",
  );
  const existing = JSON.parse(await readFile("src/data/articles.json", "utf8"));
  const preserved = existing.filter(
    (article) => !article.source.startsWith(`${host}/`),
  );
  const combined = [...articles, ...preserved].sort(
    (left, right) => Date.parse(right.date) - Date.parse(left.date),
  );
  await writeFile(
    "src/data/articles.json",
    `${JSON.stringify(combined, null, 2)}\n`,
  );
  process.stdout.write(
    `Imported ${articles.length} articles, cover images, and profile image.\n`,
  );
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Content import failed."}\n`,
  );
  process.exitCode = 1;
}
