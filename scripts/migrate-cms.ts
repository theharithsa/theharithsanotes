import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { articles } from "../src/lib/content.ts";
import { books } from "../src/data/books.ts";
import { projects } from "../src/data/projects.ts";
import { listening } from "../src/data/interests.ts";
import { screenNotes } from "../src/data/screen-notes.ts";
import { gallery } from "../src/data/gallery.ts";
import { pageDefaults, inferredTags } from "../src/lib/journal.ts";
import { saveEntry, publishEntry, getEntry } from "../src/server/repository.ts";
import { uploadMedia } from "../src/server/media.ts";
import { namespace } from "../src/server/config.ts";
import type { Section, EntryData } from "../src/server/models.ts";

// An explicit operator command. Runtime application credentials are ADC, never copied here.
if (!process.argv.includes("--apply"))
  throw Error("Use --apply after reviewing the migration manifest");
if (!["preview", "live"].includes(namespace))
  throw Error("Choose preview or live explicitly");
const images = new Map<string, string>();
const proof: {
  namespace: string;
  counts: Record<string, number>;
  images: number;
  entries: Array<{ section: string; id: string; sourceHash: string }>;
} = { namespace, counts: {}, images: 0, entries: [] };
async function image(path: string, alt: string): Promise<string> {
  if (!path.startsWith("/images/")) return path;
  const cached = images.get(path);
  if (cached) return cached;
  const absolute = resolve("public", "." + path);
  if (
    !absolute.startsWith(resolve("public") + "\\") &&
    !absolute.startsWith(resolve("public") + "/")
  )
    throw Error("Invalid source path");
  const row = await uploadMedia(
    await readFile(absolute),
    path.split("/").at(-1) ?? "Image",
    alt,
  );
  const url = `/media/${row.id}/1600.webp`;
  images.set(path, url);
  proof.images = images.size;
  return url;
}
async function transform(source: EntryData): Promise<EntryData> {
  const output = structuredClone(source);
  for (const field of ["image", "src"])
    if (typeof output[field] === "string")
      output[field] = await image(
        output[field],
        String(output.imageAlt ?? output.alt ?? output.title ?? ""),
      );
  if (output.poster && typeof output.poster === "object") {
    const poster = output.poster as EntryData;
    poster.src = await image(String(poster.src), String(poster.alt));
  }
  if (typeof output.html === "string") {
    const paths = [
      ...new Set(
        [...output.html.matchAll(/src="(\/images\/[^"<>]+)"/g)].map(
          (match) => match[1]!,
        ),
      ),
    ];
    for (const path of paths)
      output.html = String(output.html).replaceAll(
        path,
        await image(path, String(output.title)),
      );
  }
  return output;
}
const collections: Array<[Section, EntryData[]]> = [
  [
    "blogs",
    articles.map((row) => ({ ...row, tags: row.tags ?? inferredTags(row) })),
  ],
  ["books", books as unknown as EntryData[]],
  ["projects", projects as unknown as EntryData[]],
  ["podcasts", listening as unknown as EntryData[]],
  ["entertainment", screenNotes as unknown as EntryData[]],
  ["photos", gallery as unknown as EntryData[]],
  ["pages", pageDefaults as unknown as EntryData[]],
];
for (const [section, rows] of collections) {
  proof.counts[section] = 0;
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < rows.length) {
        const order = next++;
        const source = rows[order]!;
        const sourceId = String(source.slug ?? `photo-${order + 1}`);
        const id =
          sourceId.length <= 100
            ? sourceId
            : createHash("sha256").update(sourceId).digest("hex");
        let existing = null;
        process.stdout.write(
          JSON.stringify({ section, id, stage: "migrating" }) + "\n",
        );
        try {
          existing = await getEntry(section, id);
        } catch (error) {
          if (!(
            error instanceof Error &&
            "code" in error &&
            error.code === "NOT_FOUND"
          ))
            throw error;
        }
        if (!existing) {
          const data = await transform({
            ...source,
            order,
            ...(section === "photos" ? { slug: id } : {}),
            ...(section === "podcasts" ? { kind: "listening" } : {}),
          });
          const saved = await saveEntry(section, id, data, 0);
          await publishEntry(
            section,
            id,
            saved.draftRevision,
            `migration-v1-${id}`.slice(0, 100),
          );
        } else if (existing.publishedRevision === null)
          await publishEntry(
            section,
            id,
            existing.draftRevision,
            `migration-v1-${id}`.slice(0, 100),
          );
        proof.counts[section]++;
        proof.entries.push({
          section,
          id,
          sourceHash: createHash("sha256")
            .update(JSON.stringify(source))
            .digest("hex"),
        });
      }
    }),
  );
  process.stdout.write(
    JSON.stringify({ section, count: proof.counts[section] }) + "\n",
  );
}
await mkdir("qa/local", { recursive: true });
await writeFile(
  `qa/local/migration-${namespace}.json`,
  JSON.stringify(proof, null, 2),
);
process.stdout.write(
  JSON.stringify({
    complete: true,
    namespace,
    counts: proof.counts,
    images: proof.images,
  }) + "\n",
);
