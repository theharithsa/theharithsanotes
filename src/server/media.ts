import { createHash } from "node:crypto";
import sharp from "sharp";
import { database, mediaBucket } from "./firebase.ts";
import { collection, namespace } from "./config.ts";
import { authorize } from "./auth.ts";
import { CmsError, isRestrictedSection } from "./models.ts";
import { authorizeReader } from "./members.ts";
import { auditEvent, firebaseOperation, outboxDocument } from "./telemetry.ts";
import { playableFormat, mediaRange } from "./media-format.ts";

export interface MediaRecord {
  kind?: "image" | "video" | "audio";
  contentType?: string;
  fileName?: string;
  section?: "journal" | "people";
  id: string;
  state: "ready";
  published: boolean;
  title: string;
  alt: string;
  width: number;
  height: number;
  createdAt: string;
  sourceSha256: string;
  paths: Record<string, string>;
}
export async function uploadMedia(
  bytes: Buffer,
  title: string,
  alt: string,
  section?: "journal" | "people",
): Promise<MediaRecord> {
  const playable = playableFormat(bytes);
  if (playable) {
    if (bytes.length > 24 * 1024 * 1024)
      throw new CmsError(
        "INVALID_MEDIA",
        413,
        "Choose video or audio under 24 MiB",
      );
    const id = createHash("sha256")
      .update(`${section ?? "public"}-playable-v1`)
      .update(bytes)
      .digest("hex");
    const fileName = `source.${playable.extension}`;
    const path = `journal/${namespace}/media/${id}/${fileName}`;
    const row: MediaRecord = {
      ...(section ? { section } : {}),
      id,
      kind: playable.kind,
      contentType: playable.contentType,
      fileName,
      state: "ready",
      published: false,
      title: title.slice(0, 240),
      alt: alt.slice(0, 2000),
      width: 0,
      height: 0,
      createdAt: new Date().toISOString(),
      sourceSha256: createHash("sha256").update(bytes).digest("hex"),
      paths: { source: path },
    };
    await firebaseOperation(
      "upload",
      "media",
      { id, bytes: bytes.length, kind: playable.kind },
      async () => {
        try {
          await mediaBucket()
            .file(path)
            .save(bytes, {
              resumable: false,
              metadata: {
                contentType: playable.contentType,
                cacheControl: "private,no-store",
              },
              preconditionOpts: { ifGenerationMatch: 0 },
            });
        } catch (error) {
          if (!(
            error &&
            typeof error === "object" &&
            "code" in error &&
            Number(error.code) === 412
          ))
            throw error;
        }
      },
      () => ({ id, bytes: bytes.length }),
    );
    const event = auditEvent("media.ready", {
      "media.id": id,
      "media.kind": playable.kind,
      "media.bytes": bytes.length,
    });
    return firebaseOperation(
      "create",
      "media",
      { id, kind: playable.kind },
      () =>
        database().runTransaction(async (tx) => {
          const reference = database().collection(collection("media")).doc(id);
          const existing = await tx.get(reference);
          if (existing.exists) return existing.data() as MediaRecord;
          tx.create(reference, row);
          tx.create(
            database().collection(collection("outbox")).doc(event.id),
            outboxDocument(event),
          );
          return row;
        }),
    );
  }
  if (bytes.length > 8 * 1024 * 1024)
    throw new CmsError(
      "INVALID_MEDIA",
      413,
      "Choose a JPEG, PNG or WebP under 8 MiB",
    );
  const allowed =
    bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP");
  if (!allowed)
    throw new CmsError(
      "INVALID_MEDIA",
      400,
      "Choose a JPEG, PNG or WebP image",
    );
  let master: Buffer;
  let width: number;
  let height: number;
  try {
    const image = sharp(bytes, { limitInputPixels: 40000000 }).rotate();
    const metadata = await image.metadata();
    if ((metadata.width ?? 0) > 20000 || (metadata.height ?? 0) > 20000)
      throw Error("Image dimensions exceed limits");
    const output = await image
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
    master = output.data;
    width = output.info.width;
    height = output.info.height;
  } catch {
    throw new CmsError(
      "INVALID_MEDIA",
      400,
      "This image could not be decoded safely",
    );
  }
  const id = createHash("sha256")
    .update(section ? `journal-private-${section}-v1` : "journal-media-v1")
    .update(master)
    .digest("hex");
  const existing = await firebaseOperation(
    "get",
    "media",
    { id },
    () => database().collection(collection("media")).doc(id).get(),
    (snap) => (snap.exists ? { id, state: snap.get("state") } : null),
  );
  if (existing.exists) return existing.data() as MediaRecord;
  const paths: Record<string, string> = {};
  for (const variant of ["master", "400", "800", "1600"]) {
    const body =
      variant === "master"
        ? master
        : await sharp(master)
            .resize({ width: Number(variant), withoutEnlargement: true })
            .webp({ quality: 86 })
            .toBuffer();
    const path = `journal/${namespace}/media/${id}/${variant}.webp`;
    paths[variant] = path;
    await firebaseOperation(
      "upload",
      "media",
      { id, variant, bytes: body.length },
      async () => {
        try {
          await mediaBucket()
            .file(path)
            .save(body, {
              resumable: false,
              metadata: {
                contentType: "image/webp",
                cacheControl: "private,no-store",
              },
              preconditionOpts: { ifGenerationMatch: 0 },
            });
        } catch (error) {
          if (!(
            error &&
            typeof error === "object" &&
            "code" in error &&
            Number(error.code) === 412
          ))
            throw error;
        }
      },
      () => ({ id, variant, bytes: body.length }),
    );
  }
  const row: MediaRecord = {
    ...(section ? { section } : {}),
    id,
    state: "ready",
    published: false,
    title: title.slice(0, 240),
    alt: alt.slice(0, 2000),
    width,
    height,
    createdAt: new Date().toISOString(),
    sourceSha256: createHash("sha256").update(bytes).digest("hex"),
    paths,
  };
  const event = auditEvent("media.ready", {
    "media.id": id,
    "media.width": width,
    "media.height": height,
    "media.bytes": master.length,
  });
  await firebaseOperation(
    "create",
    "media",
    { id, title: row.title, alt: row.alt, width, height },
    async () =>
      database().runTransaction(async (tx) => {
        const reference = database().collection(collection("media")).doc(id);
        const exists = await tx.get(reference);
        if (exists.exists) return { id, state: "ready" };
        tx.create(reference, row);
        tx.create(
          database().collection(collection("outbox")).doc(event.id),
          outboxDocument(event),
        );
        return { id, state: "ready" };
      }),
  );
  return row;
}
export async function mediaResponse(
  request: Request,
  id: string,
  variant: string,
  apiKey = false,
): Promise<Response> {
  if (apiKey)
    await (
      await import("./api-keys.ts")
    ).authorizeApiKey(request, "media:read");
  if (
    !/^[a-f0-9]{64}$/.test(id) ||
    ![
      "master.webp",
      "400.webp",
      "800.webp",
      "1600.webp",
      "source.mp4",
      "source.webm",
      "source.mp3",
      "source.m4a",
      "source.ogg",
    ].includes(variant)
  )
    throw new CmsError("NOT_FOUND", 404, "Image not found");
  const snap = await firebaseOperation(
    "get",
    "media",
    { id },
    () => database().collection(collection("media")).doc(id).get(),
    (value) =>
      value.exists ? { id, published: value.get("published") } : null,
  );
  if (!snap.exists) throw new CmsError("NOT_FOUND", 404, "Image not found");
  const row = snap.data() as MediaRecord;
  const restricted = isRestrictedSection(row.section ?? "");
  if (restricted) {
    if (apiKey)
      await (
        await import("./api-keys.ts")
      ).authorizeApiKey(request, "media:read", row.section);
    else {
      try {
        await authorize(request, true);
      } catch {
        try {
          await authorizeReader(request);
          const published = await firebaseOperation(
            "query",
            "published",
            { section: row.section, purpose: "media-access" },
            () =>
              database()
                .collection(collection("published"))
                .where("section", "==", row.section)
                .limit(1000)
                .get(),
            (value) => ({ count: value.size }),
          );
          if (
            !published.docs.some((doc) =>
              (doc.get("mediaIds") as string[] | undefined)?.includes(id),
            )
          )
            throw new Error("Not published");
        } catch {
          throw new CmsError("NOT_FOUND", 404, "Image not found");
        }
      }
    }
  }
  if (!row.published && !apiKey && !restricted) {
    try {
      await authorize(request, true);
    } catch {
      throw new CmsError("NOT_FOUND", 404, "Image not found");
    }
  }
  const playable = variant.startsWith("source.");
  if (playable && row.fileName !== variant)
    throw new CmsError("NOT_FOUND", 404, "Media not found");
  const path = row.paths[playable ? "source" : variant.replace(".webp", "")];
  if (!path || !path.startsWith(`journal/${namespace}/media/${id}/`))
    throw new CmsError("NOT_FOUND", 404, "Image not found");
  const bytes = await firebaseOperation(
    "download",
    "media",
    { id, variant },
    async () => {
      const [body] = await mediaBucket().file(path).download();
      return body;
    },
    (value) => ({ bytes: value.length }),
  );
  let range: { start: number; end: number } | null = null;
  try {
    range = playable
      ? mediaRange(request.headers.get("range"), bytes.length)
      : null;
  } catch {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${bytes.length}`,
        "Cache-Control": "private,no-store",
      },
    });
  }
  const body = range ? bytes.subarray(range.start, range.end + 1) : bytes;
  return new Response(new Uint8Array(body), {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": playable ? row.contentType! : "image/webp",
      "Content-Length": String(body.length),
      ...(playable ? { "Accept-Ranges": "bytes" } : {}),
      ...(range
        ? {
            "Content-Range": `bytes ${range.start}-${range.end}/${bytes.length}`,
          }
        : {}),
      "Cache-Control":
        row.published && !apiKey && !restricted
          ? "public,max-age=31536000,immutable"
          : "private,no-store",
      "X-Content-Type-Options": "nosniff",
      ...(restricted
        ? { "X-Robots-Tag": "noindex,nofollow", Vary: "Cookie, Authorization" }
        : {}),
    },
  });
}
