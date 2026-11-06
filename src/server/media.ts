import { createHash } from "node:crypto";
import sharp from "sharp";
import { database, mediaBucket } from "./firebase.ts";
import { collection, namespace } from "./config.ts";
import { authorize } from "./auth.ts";
import { CmsError } from "./models.ts";
import { auditEvent, firebaseOperation, outboxDocument } from "./telemetry.ts";

export interface MediaRecord {
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
): Promise<MediaRecord> {
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
    .update("journal-media-v1")
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
    !["master.webp", "400.webp", "800.webp", "1600.webp"].includes(variant)
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
  if (!row.published && !apiKey) {
    try {
      await authorize(request, true);
    } catch {
      throw new CmsError("NOT_FOUND", 404, "Image not found");
    }
  }
  const path = row.paths[variant.replace(".webp", "")];
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
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control":
        row.published && !apiKey
          ? "public,max-age=31536000,immutable"
          : "private,no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
