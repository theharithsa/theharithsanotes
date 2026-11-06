import { database } from "./firebase.ts";
import { collection, firestoreEnabled } from "./config.ts";
import { checkOrigin } from "./auth.ts";
import { authorizeReader } from "./members.ts";
import {
  CmsError,
  isRestrictedSection,
  type PublishedEntry,
  type EntryData,
  type Section,
} from "./models.ts";
import { firebaseOperation } from "./telemetry.ts";
import {
  searchDocument,
  findSearchResults,
  searchLabels,
  type SearchDocument,
} from "./search-index.ts";
import {
  getArticles,
  getBooks,
  getProjects,
  getListening,
  getScreenNotes,
  getGallery,
  getGogs,
  getPages,
} from "../lib/journal.ts";

let publicIndex:
  { until: number; value: Promise<SearchDocument[]> } | undefined;
async function loadPublished(privateOnly: boolean): Promise<SearchDocument[]> {
  return firebaseOperation(
    "query",
    "published",
    { purpose: "global-search", privateOnly },
    async () => {
      // Separate queries keep private records out of every shared index and cache.
      const allowed = (Object.keys(searchLabels) as Section[]).filter(
        (section) => isRestrictedSection(section) === privateOnly,
      );
      const snapshots = await Promise.all(
        allowed.map((section) =>
          database()
            .collection(collection("published"))
            .where("section", "==", section)
            .limit(1001)
            .get(),
        ),
      );
      if (snapshots.some((snapshot) => snapshot.size > 1000))
        throw new CmsError(
          "SEARCH_CAPACITY",
          503,
          "Search is being updated. Please try again shortly.",
        );
      const rows = snapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => doc.data() as PublishedEntry),
      );
      const documents: SearchDocument[] = [];
      for (let start = 0; start < rows.length; start += 100) {
        const batch = rows.slice(start, start + 100);
        const revisions = await database().getAll(
          ...batch.map((row) =>
            database()
              .collection(collection("revisions"))
              .doc(`${row.section}--${row.id}--${row.revision}`),
          ),
        );
        for (const [i, revision] of revisions.entries()) {
          if (!revision.exists)
            throw new CmsError(
              "DEPENDENCY_INTEGRITY",
              503,
              "Search is temporarily unavailable.",
            );
          const row = batch[i]!;
          documents.push(
            searchDocument(
              row.section,
              row.slug,
              revision.get("data") as EntryData,
            ),
          );
        }
      }
      return documents;
    },
    (rows) => ({ count: rows.length }),
  );
}
async function publicDocuments(): Promise<SearchDocument[]> {
  if (publicIndex && publicIndex.until > Date.now()) return publicIndex.value;
  const value = firestoreEnabled()
    ? loadPublished(false)
    : Promise.all([
        getArticles(),
        getBooks(),
        getProjects(),
        getListening(),
        getScreenNotes(),
        getGallery(),
        getGogs(),
        getPages(),
      ]).then((groups) =>
        groups.flatMap((group, index) =>
          group.map((row) => {
            const section = [
              "blogs",
              "books",
              "projects",
              "podcasts",
              "entertainment",
              "photos",
              "gogs",
              "pages",
            ][index] as Section;
            return searchDocument(
              section,
              row.slug ?? "gallery",
              row as unknown as EntryData,
            );
          }),
        ),
      );
  publicIndex = { until: Date.now() + 15000, value };
  value.catch(() => {
    if (publicIndex?.value === value) publicIndex = undefined;
  });
  return value;
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private,no-store",
      "X-Robots-Tag": "noindex,nofollow",
      Vary: "Cookie, Authorization",
      "X-Content-Type-Options": "nosniff",
    },
  });
let searchWindow = { until: 0, count: 0 };
export async function searchApi(request: Request): Promise<Response> {
  try {
    checkOrigin(request);
    if (request.method !== "POST")
      throw new CmsError("METHOD_NOT_ALLOWED", 405, "Use POST to search.");
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new CmsError("INVALID_CONTENT", 415, "Send JSON content.");
    const reader = request.body?.getReader();
    let body = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytes = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.length;
        if (bytes > 1024) {
          await reader.cancel();
          throw new CmsError("INVALID_CONTENT", 413, "Search is too long.");
        }
        body += decoder.decode(part.value, { stream: true });
      }
      body += decoder.decode();
    }
    let input: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(body);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error();
      input = parsed as Record<string, unknown>;
    } catch {
      throw new CmsError("INVALID_CONTENT", 400, "Enter a search term.");
    }
    const query = typeof input.query === "string" ? input.query.trim() : "";
    if (query.length < 2 || query.length > 160)
      throw new CmsError(
        "INVALID_CONTENT",
        400,
        "Use between 2 and 160 characters.",
      );
    const section = typeof input.section === "string" ? input.section : "";
    if (section && !(section in searchLabels))
      throw new CmsError("INVALID_CONTENT", 400, "Choose a valid section.");
    const offset = input.offset === undefined ? 0 : input.offset;
    if (
      typeof offset !== "number" ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 10000
    )
      throw new CmsError("INVALID_CONTENT", 400, "Invalid result page.");
    if (searchWindow.until < Date.now())
      searchWindow = { until: Date.now() + 60000, count: 0 };
    if (++searchWindow.count > 300)
      throw new CmsError(
        "RATE_LIMITED",
        429,
        "Search is busy. Please try again in a minute.",
      );
    let privateAvailable = false;
    if (
      firestoreEnabled() &&
      (request.headers.has("cookie") || request.headers.has("authorization"))
    ) {
      try {
        await authorizeReader(request);
        privateAvailable = true;
      } catch (error) {
        if (!(error instanceof CmsError && [401, 403].includes(error.status)))
          throw error;
      }
    }
    const docs = await publicDocuments();
    const privateDocs = privateAvailable ? await loadPublished(true) : [];
    return json({
      ...findSearchResults([...docs, ...privateDocs], query, section, offset),
      privateAvailable,
    });
  } catch (error) {
    return json(
      {
        error: {
          message:
            error instanceof CmsError
              ? error.message
              : "Search is temporarily unavailable. Please try again.",
        },
      },
      error instanceof CmsError ? error.status : 503,
    );
  }
}
