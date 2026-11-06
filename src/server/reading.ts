import { database } from "./firebase.ts";
import { createHash } from "node:crypto";
import { collection } from "./config.ts";
import { authorizeReader, readerSession } from "./members.ts";
import { authorize, checkOrigin } from "./auth.ts";
import { getEntry } from "./repository.ts";
import {
  CmsError,
  isRestrictedSection,
  type PublishedEntry,
} from "./models.ts";
import { firebaseOperation, errorCode } from "./telemetry.ts";

const json = (
  data: unknown,
  status = 200,
  extra: Record<string, string> = {},
) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private,no-store",
      "X-Robots-Tag": "noindex,nofollow",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
export async function readingApi(
  request: Request,
  path: string,
): Promise<Response> {
  try {
    checkOrigin(request);
    if (path === "session" && request.method === "DELETE")
      return json({ signedOut: true }, 200, {
        "Set-Cookie":
          "__session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      });
    if (path === "session" && request.method === "POST")
      return json({ ready: true }, 200, {
        "Set-Cookie": `__session=${await readerSession(request)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`,
      });
    await authorizeReader(request);
    if (request.method !== "GET")
      throw new CmsError("METHOD_NOT_ALLOWED", 405, "Use GET to read posts");
    if (path === "me") return json({ invited: true });
    const [section, slug, ...rest] = path.split("/");
    if (
      !section ||
      !isRestrictedSection(section) ||
      rest.length ||
      (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    )
      throw new CmsError("NOT_FOUND", 404, "Post not found");
    const preview = new URL(request.url).searchParams.get("preview");
    if (preview) {
      await authorize(request, true);
      const [target, id] = preview.split(":");
      if (target !== section || !id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id))
        throw new CmsError("INVALID_CONTENT", 400, "Invalid preview");
      return json({ post: (await getEntry(section, id)).data });
    }
    const rows = await firebaseOperation(
      "query",
      "published",
      { section, purpose: "invited-reading" },
      async () => {
        let query = database()
          .collection(collection("published"))
          .where("section", "==", section);
        if (slug) query = query.where("slug", "==", slug);
        return query.limit(slug ? 1 : 1000).get();
      },
      (value) => ({ count: value.size }),
    );
    if (!slug)
      return json({
        posts: rows.docs.map((doc) => {
          const row = doc.data() as PublishedEntry;
          return { ...row.data, id: row.id };
        }),
      });
    let row = rows.docs[0]?.data() as PublishedEntry | undefined;
    if (!row) {
      row = await firebaseOperation(
        "lookup",
        "published",
        { section, purpose: "private-alias" },
        async () => {
          const reservation = await database()
            .collection(collection("slugs"))
            .doc(
              createHash("sha256").update(`${section}/${slug}`).digest("hex"),
            )
            .get();
          if (!reservation.exists) return undefined;
          const current = await database()
            .collection(collection("published"))
            .doc(`${section}--${String(reservation.get("id"))}`)
            .get();
          return current.exists
            ? (current.data() as PublishedEntry)
            : undefined;
        },
        (value) => ({ exists: Boolean(value) }),
      );
    }
    if (!row) throw new CmsError("NOT_FOUND", 404, "Post not found");
    const revision = await firebaseOperation(
      "get",
      "revisions",
      { section, id: row.id, revision: row.revision },
      () =>
        database()
          .collection(collection("revisions"))
          .doc(`${section}--${row.id}--${row.revision}`)
          .get(),
      (value) => ({ exists: value.exists }),
    );
    if (!revision.exists)
      throw new CmsError(
        "DEPENDENCY_INTEGRITY",
        503,
        "This post is temporarily unavailable",
      );
    // Source notes and import metadata remain owner-only even for invited readers.
    const data = revision.get("data") as Record<string, unknown>;
    return json({ post: { ...row.data, html: data.html, id: row.id } });
  } catch (error) {
    return json(
      {
        error: {
          code: errorCode(error),
          message:
            error instanceof CmsError
              ? error.message
              : "This reading room is temporarily unavailable",
        },
      },
      error instanceof CmsError ? error.status : 503,
    );
  }
}
