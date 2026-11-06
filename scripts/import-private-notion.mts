import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createApiKey, revokeApiKey } from "../src/server/api-keys.ts";
import { namespace } from "../src/server/config.ts";
import {
  cleanHtml,
  validateData,
  type Entry,
  type EntryData,
} from "../src/server/models.ts";

// The export and covers are operator-owned private input, never build inputs.
const input = resolve(process.argv[2] ?? "");
const endpoint = process.argv[3];
if (
  !process.argv[2] ||
  !["live", "preview"].includes(namespace) ||
  ![
    "https://theharithsanotes.com",
    "https://the-harithsa-notes-94--review-tzxuxkbf.web.app",
  ].includes(endpoint ?? "")
)
  throw new Error(
    "Provide a private input directory, explicit CMS_NAMESPACE and approved endpoint",
  );
if ((namespace === "live") !== (endpoint === "https://theharithsanotes.com"))
  throw new Error("Endpoint namespace mismatch");
const { marked } = (await import(
  pathToFileURL(join(input, "tooling/node_modules/marked/lib/marked.esm.js"))
    .href
)) as { marked: { parse: (source: string) => Promise<string> | string } };
const covers = JSON.parse(
  await readFile(join(input, "art-manifest.json"), "utf8"),
) as { index: number; path: string }[];
const files = (await readdir(input))
  .filter((name) => /^\d{3}\.json$/.test(name))
  .sort();
if (
  files.length !== 54 ||
  covers.length !== 54 ||
  new Set(covers.map((row) => row.path)).size !== 54
)
  throw new Error("Expected 54 source pages and distinct illustrations");
const credential = await createApiKey({
  name: "Private Notion import",
  scopes: ["content:read", "content:write", "content:publish", "media:write"],
  sections: ["journal", "people"],
  expiresInDays: 1,
});
async function api<T>(
  path: string,
  method = "GET",
  body?: BodyInit,
): Promise<T> {
  const response = await fetch(endpoint + "/api/v1/" + path, {
    method,
    headers: {
      Authorization: `Bearer ${credential.token}`,
      ...(typeof body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(path.endsWith("/publish")
        ? { "Idempotency-Key": "notion-initial-import" }
        : {}),
    },
    body,
    signal: AbortSignal.timeout(120000),
  });
  const value = await response.json();
  if (!response.ok) {
    const error = new Error(
      `Import request failed (${response.status}, ${String(value.error?.code ?? "UNKNOWN")})`,
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
  return value as T;
}
const receipts: Record<string, unknown>[] = [];
try {
  for (let index = 0; index < files.length; index++) {
    const raw = JSON.parse(
      await readFile(join(input, files[index]!), "utf8"),
    ) as {
      section: "journal" | "people";
      properties: Record<string, string>;
      page: { content: { type: string; text?: string }[] };
    };
    const source = JSON.parse(
      raw.page.content.find((row) => row.type === "text")!.text!,
    ) as { text: string; page_last_edited_at?: string };
    const notionId = raw.properties.url?.match(/[a-f0-9]{32}/)?.[0];
    if (!notionId) throw new Error("Source page identity is missing");
    const id = "notion-" + notionId;
    const section = raw.section;
    const path = `entries/${section}/${id}`;
    try {
      const existing = await api<Entry>(path);
      if (
        existing.draftRevision === 1 &&
        existing.publishedRevision === null &&
        (existing.data.notion as { id?: string } | undefined)?.id === notionId
      )
        await api<Entry>(
          path + "/publish",
          "POST",
          JSON.stringify({ expectedRevision: 1 }),
        );
      receipts.push({
        id,
        section,
        state: "preserved",
        revision: existing.draftRevision,
      });
      continue;
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ))
        throw error;
    }
    const markdown = source.text
      .match(/<content>([\s\S]*?)<\/content>/)?.[1]
      ?.trim();
    if (!markdown)
      throw new Error(
        "A source body is unavailable; refusing an incomplete import",
      );
    const title = raw.properties.Entry ?? raw.properties.Name;
    if (!title) throw new Error("A source title is missing");
    const cover = covers.find((row) => row.index === index);
    if (!cover) throw new Error("A cover is missing");
    const form = new FormData();
    form.set(
      "file",
      new Blob([new Uint8Array(await readFile(cover.path))], {
        type: "image/webp",
      }),
      "editorial-cover.webp",
    );
    form.set("title", "Private editorial illustration");
    form.set(
      "alt",
      section === "people"
        ? "An original editorial illustration about companionship"
        : "An original editorial illustration for a page of the notebook",
    );
    form.set("section", section);
    const media = await api<{ url: string }>("media", "POST", form);
    const date =
      raw.properties[
        section === "journal" ? "date:Date:start" : "date:Known Since:start"
      ];
    if (!date) throw new Error("A source date is missing");
    const html = cleanHtml(
      await marked.parse(markdown.replace(/<image\b[^>]*\/>/g, "")),
    );
    const data: EntryData = {
      title,
      slug: id,
      description: raw.properties.Summary ?? raw.properties.Notes ?? "",
      date,
      tags: [],
      html,
      image: media.url,
      imageAlt: String(form.get("alt")),
      audience: "invited",
      ...(section === "people"
        ? {
            relationship: raw.properties.Relationship ?? "",
            species: raw.properties.Species ?? "Human",
          }
        : {}),
      notion: {
        id: notionId,
        url: raw.properties.url,
        editedAt: source.page_last_edited_at ?? null,
        sha256: createHash("sha256").update(markdown).digest("hex"),
        markdown,
        properties: raw.properties,
      },
    };
    validateData(section, data, true);
    const draft = await api<Entry>(
      path,
      "PUT",
      JSON.stringify({ data, expectedRevision: 0 }),
    );
    const published = await api<Entry>(
      path + "/publish",
      "POST",
      JSON.stringify({ expectedRevision: draft.draftRevision }),
    );
    receipts.push({
      id,
      section,
      state: "imported",
      revision: published.publishedRevision,
      bodySha256: createHash("sha256").update(html).digest("hex"),
    });
    await writeFile(
      join(input, `receipt-${namespace}.json`),
      JSON.stringify({ namespace, receipts }, null, 2),
    );
    process.stdout.write(
      JSON.stringify({
        completed: receipts.length,
        total: files.length,
        section,
      }) + "\n",
    );
  }
} finally {
  await revokeApiKey(credential.key.id);
  await globalThis.__harithsaTelemetry?.shutdown();
}
await writeFile(
  join(input, `receipt-${namespace}.json`),
  JSON.stringify({ namespace, receipts }, null, 2),
);
process.stdout.write(
  JSON.stringify({
    namespace,
    total: receipts.length,
    imported: receipts.filter((row) => row.state === "imported").length,
    preserved: receipts.filter((row) => row.state === "preserved").length,
  }) + "\n",
);
