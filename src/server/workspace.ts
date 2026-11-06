import { createHash } from "node:crypto";
import { database } from "./firebase.ts";
import { collection } from "./config.ts";
import { sections, type Entry, CmsError } from "./models.ts";
import { firebaseOperation } from "./telemetry.ts";
import { saveEntry, publishEntry } from "./repository.ts";
import { pageDefaults } from "./page-defaults.ts";

export async function workspaceSummary() {
  return firebaseOperation(
    "query",
    "entries",
    { purpose: "workspace-counts" },
    async () => {
      const rows = await database()
        .collection(collection("entries"))
        .select("section")
        .limit(10000)
        .get();
      const counts = Object.fromEntries(
        sections.map((section) => [section, 0]),
      );
      for (const row of rows.docs) {
        const section = row.get("section") as string;
        if (Object.hasOwn(counts, section)) counts[section]!++;
      }
      return { counts };
    },
  );
}
export async function reconcileWorkspace() {
  const entries = await firebaseOperation(
    "query",
    "entries",
    { purpose: "catalog-reconcile" },
    async () => {
      const rows = await database()
        .collection(collection("entries"))
        .limit(10000)
        .get();
      return rows.docs.map((row) => row.data() as Entry);
    },
    (rows) => ({ count: rows.length }),
  );
  const existing = new Set(entries.map((row) => `${row.section}/${row.id}`));
  const pageAddresses = new Set(
    entries
      .filter((row) => row.section === "pages")
      .map((row) => row.data.slug),
  );
  const labels = new Map<
    string,
    { title: string; kind: "tag" | "genre" | "topic" }
  >();
  for (const row of entries) {
    for (const [field, kind] of [
      ["tags", "tag"],
      ["genres", "genre"],
      ["topic", "topic"],
      ["category", "topic"],
    ] as const) {
      const raw = row.data[field];
      for (const value of Array.isArray(raw) ? raw : [raw])
        if (typeof value === "string" && value.trim()) {
          const title = value.trim();
          labels.set(`${kind}/${title.toLowerCase()}`, { title, kind });
        }
    }
  }
  let tags = 0,
    pages = 0;
  for (const [identity, data] of labels) {
    const id =
      "label-" +
      createHash("sha256").update(identity).digest("hex").slice(0, 24);
    if (
      existing.has(`tags/${id}`) ||
      entries.some(
        (row) =>
          row.section === "tags" &&
          row.data.kind === data.kind &&
          String(row.data.title).toLowerCase() === data.title.toLowerCase(),
      )
    )
      continue;
    try {
      const slug =
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || id;
      const row = await saveEntry(
        "tags",
        id,
        { ...data, slug: `${data.kind}-${slug.slice(0, 140)}-${id.slice(-8)}` },
        0,
      );
      await publishEntry("tags", id, row.draftRevision, "catalog-initial");
      tags++;
    } catch (error) {
      if (!(error instanceof CmsError && error.code === "REVISION_CONFLICT"))
        throw error;
    }
  }
  for (const page of pageDefaults) {
    if (pageAddresses.has(page.slug)) continue;
    try {
      const row = await saveEntry("pages", page.slug, page, 0);
      await publishEntry("pages", row.id, row.draftRevision, "catalog-initial");
      pages++;
    } catch (error) {
      if (!(error instanceof CmsError && error.code === "REVISION_CONFLICT"))
        throw error;
    }
  }
  return { added: { tags, pages }, ...(await workspaceSummary()) };
}
