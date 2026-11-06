import { createHash, randomUUID } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { database } from "./firebase.ts";
import { collection } from "./config.ts";
import {
  CmsError,
  isRestrictedSection,
  identifier,
  validateData,
  summaryData,
  type Entry,
  type EntryData,
  type PublishedEntry,
  type Section,
} from "./models.ts";
import {
  auditEvent,
  firebaseOperation,
  outboxDocument,
  requestContext,
} from "./telemetry.ts";

const key = (section: Section, id: string) =>
  `${section}--${identifier.parse(id)}`;
const revisionKey = (section: Section, id: string, revision: number) =>
  `${key(section, id)}--${revision}`;
const slugKey = (section: Section, slug: string) =>
  createHash("sha256").update(`${section}/${slug}`).digest("hex");
const entryRef = (section: Section, id: string) =>
  database().collection(collection("entries")).doc(key(section, id));
const publicRef = (section: Section, id: string) =>
  database().collection(collection("published")).doc(key(section, id));
const revisionRef = (section: Section, id: string, revision: number) =>
  database()
    .collection(collection("revisions"))
    .doc(revisionKey(section, id, revision));
const objectData = (value: unknown) => value as EntryData;
export const entryPath = (section: Section, slug: string) =>
  isRestrictedSection(section)
    ? `/people-and-journal/${section}/${slug}`
    : section === "blogs"
      ? `/${slug}`
      : section === "podcasts"
        ? `/podcasts/listening/${slug}`
        : section === "photos"
          ? "/gallery"
          : section === "pages"
            ? slug === "home"
              ? "/"
              : `/${slug}`
            : `/${section}/${slug}`;

export async function listEntries(
  section: Section,
  cursor?: string,
): Promise<{ entries: Entry[]; next: string | null }> {
  return firebaseOperation(
    "query",
    "entries",
    { section, cursor: cursor ?? null },
    async () => {
      let query = database()
        .collection(collection("entries"))
        .where("section", "==", section)
        .orderBy(FieldPath.documentId())
        .limit(101);
      if (cursor)
        query = query.startAfter(key(section, identifier.parse(cursor)));
      const result = await query.get();
      const rows = result.docs.map((doc) => doc.data() as Entry);
      return {
        entries: rows.slice(0, 100),
        next: rows.length > 100 ? rows[99]!.id : null,
      };
    },
  );
}
export async function getEntry(section: Section, id: string): Promise<Entry> {
  return firebaseOperation("get", "entries", { section, id }, async () => {
    const snap = await entryRef(section, id).get();
    if (!snap.exists)
      throw new CmsError("NOT_FOUND", 404, "This entry was not found");
    return snap.data() as Entry;
  });
}
export async function saveEntry(
  section: Section,
  id: string,
  data: unknown,
  expectedRevision: number,
  restoredFrom?: number,
): Promise<Entry> {
  const valid = validateData(section, data);
  const reference = entryRef(section, id);
  const now = new Date().toISOString();
  return firebaseOperation(
    "save",
    "entries",
    { section, id, data: valid, expectedRevision },
    async () =>
      database().runTransaction(async (tx) => {
        const old = await tx.get(reference);
        const previous = old.exists ? (old.data() as Entry) : null;
        if ((previous?.draftRevision ?? 0) !== expectedRevision)
          throw new CmsError(
            "REVISION_CONFLICT",
            409,
            "A newer draft exists. Reload it before saving your changes",
          );
        const row: Entry = {
          id,
          section,
          data: valid,
          draftRevision: expectedRevision + 1,
          publishedRevision: previous?.publishedRevision ?? null,
          createdAt: previous?.createdAt ?? now,
          updatedAt: now,
          publishedAt: previous?.publishedAt ?? null,
        };
        const event = auditEvent(
          restoredFrom === undefined
            ? "content.draft_saved"
            : "content.revision_restored",
          {
            "content.id": id,
            "content.section": section,
            "content.revision": row.draftRevision,
            ...(restoredFrom === undefined
              ? {}
              : { "content.source_revision": restoredFrom }),
          },
        );
        tx.set(reference, row);
        tx.create(revisionRef(section, id, row.draftRevision), {
          id,
          section,
          revision: row.draftRevision,
          data: valid,
          createdAt: now,
        });
        tx.create(
          database().collection(collection("outbox")).doc(event.id),
          outboxDocument(event),
        );
        return row;
      }),
  );
}

function referencedMedia(data: EntryData): string[] {
  return [
    ...new Set(
      [...JSON.stringify(data).matchAll(/\/media\/([a-f0-9]{64})\//g)].map(
        (match) => match[1]!,
      ),
    ),
  ].slice(0, 100);
}
export async function publishEntry(
  section: Section,
  id: string,
  expectedRevision: number,
  idempotencyKey: string,
): Promise<Entry> {
  identifier.parse(idempotencyKey);
  const operation = database()
    .collection(collection("operations"))
    .doc(`${key(section, id)}--publish--${idempotencyKey}`);
  return firebaseOperation(
    "publish",
    "entries",
    { section, id, expectedRevision, idempotencyKey },
    async () =>
      database().runTransaction(async (tx) => {
        const [existing, rowSnap] = await Promise.all([
          tx.get(operation),
          tx.get(entryRef(section, id)),
        ]);
        if (!rowSnap.exists)
          throw new CmsError("NOT_FOUND", 404, "This entry was not found");
        const row = rowSnap.data() as Entry;
        if (existing.exists) {
          if (existing.get("revision") !== expectedRevision)
            throw new CmsError(
              "REVISION_CONFLICT",
              409,
              "That publish request belongs to another revision",
            );
          return row;
        }
        if (row.draftRevision !== expectedRevision)
          throw new CmsError(
            "REVISION_CONFLICT",
            409,
            "A newer draft exists. Review it before publishing",
          );
        const valid = validateData(section, row.data, true);
        const slug = String(valid.slug ?? id);
        const reservation = database()
          .collection(collection("slugs"))
          .doc(slugKey(section, slug));
        const reserved = await tx.get(reservation);
        if (reserved.exists && reserved.get("id") !== id)
          throw new CmsError(
            "SLUG_CONFLICT",
            409,
            "Another entry already owns that address",
          );
        const mediaIds = referencedMedia(valid);
        const media = await Promise.all(
          mediaIds.map((mediaId) =>
            tx.get(database().collection(collection("media")).doc(mediaId)),
          ),
        );
        if (media.some((snap) => !snap.exists || snap.get("state") !== "ready"))
          throw new CmsError(
            "MEDIA_NOT_READY",
            409,
            "An image is still unavailable. Upload it again before publishing",
          );
        if (
          media.some(
            (snap) =>
              isRestrictedSection(String(snap.get("section"))) &&
              snap.get("section") !== section,
          )
        )
          throw new CmsError(
            "FORBIDDEN",
            403,
            "Private images must stay in their original collection",
          );
        if (
          isRestrictedSection(section) &&
          media.some((snap) => snap.get("section") !== section)
        )
          throw new CmsError(
            "INVALID_MEDIA",
            400,
            "Upload images specifically for this private collection",
          );
        const now = new Date().toISOString();
        const updated = {
          ...row,
          data: valid,
          publishedRevision: row.draftRevision,
          publishedAt: now,
          updatedAt: now,
        };
        const modified =
          row.publishedRevision === null &&
          row.draftRevision === 1 &&
          typeof valid.date === "string" &&
          Number.isFinite(Date.parse(valid.date))
            ? new Date(valid.date).toISOString()
            : now;
        const published: PublishedEntry = {
          mediaIds,
          id,
          section,
          slug,
          revision: row.draftRevision,
          data: summaryData(section, valid),
          updatedAt: modified,
        };
        const event = auditEvent("content.published", {
          "content.id": id,
          "content.section": section,
          "content.revision": row.draftRevision,
          "content.previous_revision": row.publishedRevision,
          "transaction.id": idempotencyKey,
        });
        tx.set(entryRef(section, id), updated);
        tx.set(publicRef(section, id), published);
        tx.set(reservation, { section, slug, id });
        tx.create(operation, { revision: row.draftRevision, createdAt: now });
        tx.create(
          database().collection(collection("outbox")).doc(event.id),
          outboxDocument(event),
        );
        for (const image of media)
          tx.update(image.ref, { published: !isRestrictedSection(section) });
        clearPublishedCache();
        return updated;
      }),
  );
}
export async function unpublishEntry(
  section: Section,
  id: string,
  expectedRevision: number,
): Promise<Entry> {
  if (section === "pages")
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Core pages stay live. Publish an edited version instead",
    );
  return firebaseOperation(
    "unpublish",
    "entries",
    { section, id, expectedRevision },
    async () =>
      database().runTransaction(async (tx) => {
        const snap = await tx.get(entryRef(section, id));
        if (!snap.exists)
          throw new CmsError("NOT_FOUND", 404, "This entry was not found");
        const row = snap.data() as Entry;
        if (row.draftRevision !== expectedRevision)
          throw new CmsError(
            "REVISION_CONFLICT",
            409,
            "A newer draft exists. Reload before unpublishing",
          );
        const updated = {
          ...row,
          publishedRevision: null,
          updatedAt: new Date().toISOString(),
        };
        tx.set(snap.ref, updated);
        tx.delete(publicRef(section, id));
        if (row.publishedRevision !== null) {
          const event = auditEvent("content.unpublished", {
            "content.id": id,
            "content.section": section,
            "content.revision": row.publishedRevision,
          });
          tx.create(
            database().collection(collection("outbox")).doc(event.id),
            outboxDocument(event),
          );
        }
        clearPublishedCache();
        return updated;
      }),
  );
}
export async function listRevisions(section: Section, id: string) {
  return firebaseOperation(
    "history",
    "revisions",
    { section, id },
    async () => {
      const snap = await database()
        .collection(collection("revisions"))
        .where("id", "==", id)
        .where("section", "==", section)
        .orderBy("revision", "desc")
        .limit(30)
        .get();
      return snap.docs.map((doc) => {
        const value = doc.data();
        return {
          revision: Number(value.revision),
          createdAt: String(value.createdAt),
          title: String(objectData(value.data).title),
        };
      });
    },
  );
}
export async function restoreRevision(
  section: Section,
  id: string,
  revision: number,
  expectedRevision: number,
): Promise<Entry> {
  const stored = await firebaseOperation(
    "get",
    "revisions",
    { section, id, revision },
    () => revisionRef(section, id, revision).get(),
    (snap) => (snap.exists ? snap.data() : null),
  );
  if (!stored.exists)
    throw new CmsError("NOT_FOUND", 404, "This revision was not found");
  const result = await saveEntry(
    section,
    id,
    stored.get("data"),
    expectedRevision,
    revision,
  );
  return result;
}

const publicCache = new Map<
  string,
  { expires: number; value: Promise<unknown> }
>();
export function clearPublishedCache() {
  publicCache.clear();
  requestContext.getStore()?.cache.clear();
}
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const current = requestContext.getStore()?.cache.get(key);
  if (current) return current as Promise<T>;
  const stored = publicCache.get(key);
  if (stored && stored.expires > Date.now()) return stored.value as Promise<T>;
  const value = load().catch((error) => {
    publicCache.delete(key);
    throw error;
  });
  if (publicCache.size > 500) publicCache.clear();
  publicCache.set(key, { expires: Date.now() + 15000, value });
  requestContext.getStore()?.cache.set(key, value);
  return value;
}
export async function listPublished<T>(section: Section): Promise<T[]> {
  if (isRestrictedSection(section))
    throw new CmsError("FORBIDDEN", 403, "Use the invitation-only reading API");
  const result = await cached(`${section}:list`, () =>
    firebaseOperation("query", "published", { section }, async () => {
      const snap = await database()
        .collection(collection("published"))
        .where("section", "==", section)
        .limit(1000)
        .get();
      return snap.docs.map((doc) => doc.data() as PublishedEntry);
    }),
  );
  let rows = result;
  const preview = requestContext.getStore()?.preview;
  if (preview?.section === section) {
    const draft = await getEntry(section, preview.id);
    rows = [
      ...result.filter((item) => item.id !== preview.id),
      {
        id: draft.id,
        section,
        slug: String(draft.data.slug ?? draft.id),
        revision: draft.draftRevision,
        data: draft.data,
        updatedAt: draft.updatedAt,
      },
    ];
  }
  return rows.map((row) => ({ ...row.data, dateModified: row.updatedAt }) as T);
}
export async function publishedDetail<T>(
  section: Section,
  slug: string,
): Promise<{ data: T; canonical: string } | null> {
  if (isRestrictedSection(section))
    throw new CmsError("FORBIDDEN", 403, "Use the invitation-only reading API");
  const preview = requestContext.getStore()?.preview;
  if (preview?.section === section) {
    const draft = await getEntry(section, preview.id);
    return {
      data: draft.data as T,
      canonical: String(draft.data.slug ?? draft.id),
    };
  }
  return cached(`${section}:${slug}`, () =>
    firebaseOperation("lookup", "published", { section, slug }, async () => {
      const reserved = await database()
        .collection(collection("slugs"))
        .doc(slugKey(section, slug))
        .get();
      if (!reserved.exists) return null;
      const published = await publicRef(
        section,
        String(reserved.get("id")),
      ).get();
      if (!published.exists) return null;
      const row = published.data() as PublishedEntry;
      const revision = await revisionRef(section, row.id, row.revision).get();
      if (!revision.exists)
        throw new CmsError(
          "DEPENDENCY_INTEGRITY",
          503,
          "Published revision is temporarily unavailable",
        );
      return {
        data: { ...revision.get("data"), dateModified: row.updatedAt } as T,
        canonical: row.slug,
      };
    }),
  );
}
export const newEntryId = () => randomUUID();
