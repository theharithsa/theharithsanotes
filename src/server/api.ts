import { ZodError } from "zod";
import { collection, namespace, serviceVersion } from "./config.ts";
import { authorize, checkOrigin, createPreviewSession } from "./auth.ts";
import {
  CmsError,
  identifier,
  isSection,
  isRestrictedSection,
  type Section,
} from "./models.ts";
import { inviteMember, listMembers, revokeMember } from "./members.ts";
import {
  getEntry,
  listEntries,
  listRevisions,
  newEntryId,
  publishEntry,
  restoreRevision,
  saveEntry,
  unpublishEntry,
} from "./repository.ts";
import { uploadMedia, mediaResponse } from "./media.ts";
import {
  authorizeApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiScope,
} from "./api-keys.ts";
import { database } from "./firebase.ts";
import { auditHealth, drainAudit, retryBlocked } from "./outbox.ts";
import {
  auditEvent,
  enqueueAudit,
  errorCode,
  operationalLog,
  requestContext,
  firebaseOperation,
} from "./telemetry.ts";
import { authorizeCi, acceptCi } from "./ci.ts";
import { authorizeScheduler } from "./scheduler.ts";
import { workspaceSummary, reconcileWorkspace } from "./workspace.ts";

function json(
  value: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private,no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
}
async function boundedBody(
  request: Request,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length")) > limit)
    throw new CmsError(
      "INVALID_CONTENT",
      413,
      "This request exceeds the content limit",
    );
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new CmsError(
        "INVALID_CONTENT",
        413,
        "This request exceeds the content limit",
      );
    }
    chunks.push(part.value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new CmsError("INVALID_CONTENT", 415, "Send JSON content");
  const bytes = await boundedBody(request, 640 * 1024);
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw Error();
    return value as Record<string, unknown>;
  } catch {
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "This request contains invalid JSON",
    );
  }
}
function revision(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "A valid expected revision is required",
    );
  return Number(value);
}
const rate = new Map<string, { until: number; count: number }>();
function rateLimit(uid: string): void {
  const key = uid;
  const current = rate.get(key);
  if (!current || current.until < Date.now()) {
    if (rate.size > 200) rate.clear();
    rate.set(key, { until: Date.now() + 60000, count: 1 });
    return;
  }
  if (++current.count > 120)
    throw new CmsError(
      "RATE_LIMITED",
      429,
      "Please wait a moment before trying again",
    );
}

export async function handleCmsApi(
  request: Request,
  path: string,
  external = false,
): Promise<Response> {
  const parts = path.split("/").filter(Boolean);
  const method = request.method;
  try {
    if (external && !["entries", "media"].includes(parts[0] ?? ""))
      throw new CmsError("NOT_FOUND", 404, "Unknown content API operation");
    if (
      parts.length > 4 ||
      (parts[0] === "media" && parts.length > 3) ||
      (parts[0] === "keys" && parts.length > 2)
    )
      throw new CmsError("NOT_FOUND", 404, "Unknown API operation");
    if (parts[0] === "delivery" && method === "POST") {
      await authorizeScheduler(request);
      const result = await drainAudit(200, 20000);
      operationalLog("audit.scheduled_drain", result);
      return json(result, result.blocked ? 503 : 200);
    }
    if (parts[0] === "health" && method === "GET")
      return json({
        status: "ok",
        version: serviceVersion,
        environment: namespace,
      });
    if (parts[0] === "ci" && method === "POST") {
      const claims = await authorizeCi(request);
      return json(await acceptCi(await body(request), claims), 202);
    }
    checkOrigin(request);
    if (parts[0] === "session" && method === "DELETE")
      return json({ signedOut: true }, 200, {
        "Set-Cookie":
          "__session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      });
    let user: {
      uid: string;
      email?: string;
      name?: string;
      sections?: Section[];
    };
    if (external) {
      const section =
        parts[0] === "entries" && isSection(parts[1] ?? "")
          ? (parts[1] as import("./models.ts").Section)
          : undefined;
      const scope: ApiScope =
        parts[0] === "media"
          ? method === "GET"
            ? "media:read"
            : "media:write"
          : method === "GET"
            ? "content:read"
            : ["publish", "unpublish"].includes(parts[3] ?? "")
              ? "content:publish"
              : "content:write";
      user = await authorizeApiKey(request, scope, section);
    } else user = await authorize(request);
    rateLimit(user.uid);
    if (!external && parts[0] === "members") {
      if (parts.length === 1 && method === "GET")
        return json({ members: await listMembers() });
      if (parts.length === 1 && method === "POST")
        return json(await inviteMember(await body(request)), 201);
      if (parts.length === 2 && method === "DELETE")
        return json(await revokeMember(parts[1]!));
      throw new CmsError(
        "METHOD_NOT_ALLOWED",
        405,
        "Unsupported invitation operation",
      );
    }
    if (!external && parts[0] === "workspace" && parts.length === 1) {
      if (method === "GET") return json(await workspaceSummary());
      if (method === "POST") return json(await reconcileWorkspace());
    }
    if (!external && parts[0] === "keys") {
      if (parts.length === 1 && method === "GET")
        return json({ keys: await listApiKeys() });
      if (parts.length === 1 && method === "POST")
        return json(await createApiKey(await body(request)), 201);
      if (parts.length === 2 && method === "DELETE")
        return json(await revokeApiKey(parts[1]!));
      throw new CmsError(
        "METHOD_NOT_ALLOWED",
        405,
        "Unsupported key management operation",
      );
    }
    if (parts[0] === "session" && method === "POST") {
      const cookie = await createPreviewSession(request);
      return json({ ready: true }, 200, {
        "Set-Cookie": `__session=${cookie}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`,
      });
    }
    if (parts[0] === "me" && method === "GET")
      return json({
        email: user.email,
        uid: user.uid,
        name: user.name ?? "Vishruth",
        environment: namespace,
        version: serviceVersion,
      });
    if (parts[0] === "audit" && method === "GET")
      return json(await auditHealth());
    if (parts[0] === "audit" && method === "POST") {
      await retryBlocked();
      const result = await drainAudit(50, 20000);
      await enqueueAudit(
        auditEvent("audit.retry_requested", {
          "audit.sent": result.sent,
          "audit.failed": result.failed,
        }),
      );
      return json(result);
    }
    if (parts[0] === "media" && method === "GET") {
      if (external && parts.length === 3)
        return mediaResponse(request, parts[1]!, parts[2]!, true);
      if (parts.length !== 1)
        throw new CmsError("NOT_FOUND", 404, "Unknown media operation");
      const rows = await firebaseOperation(
        "query",
        "media",
        { limit: 80 },
        () =>
          database()
            .collection(collection("media"))
            .orderBy("createdAt", "desc")
            .limit(80)
            .get(),
        (snap) => ({ count: snap.size }),
      );
      return json({
        media: rows.docs
          .filter(
            (doc) =>
              !external ||
              !isRestrictedSection(String(doc.get("section"))) ||
              user.sections?.includes(doc.get("section") as Section),
          )
          .map((doc) => ({
            ...doc.data(),
            paths: undefined,
            url: `/media/${doc.id}/${doc.get("fileName") ?? "1600.webp"}`,
            apiUrl: `/api/v1/media/${doc.id}/${doc.get("fileName") ?? "1600.webp"}`,
          })),
      });
    }
    if (parts[0] === "media" && method === "POST") {
      if (
        !request.headers.get("content-type")?.startsWith("multipart/form-data;")
      )
        throw new CmsError(
          "INVALID_MEDIA",
          415,
          "Send a multipart/form-data media upload",
        );
      if (parts.length !== 1)
        throw new CmsError("NOT_FOUND", 404, "Unknown media operation");
      const length = Number(request.headers.get("content-length"));
      if (length > 25 * 1024 * 1024)
        throw new CmsError(
          "INVALID_MEDIA",
          413,
          "Choose an image under 8 MiB or video/audio under 24 MiB",
        );
      const bytes = await boundedBody(request, 25 * 1024 * 1024);
      const form = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": request.headers.get("content-type") ?? "" },
        body: bytes,
      }).formData();
      const file = form.get("file");
      if (!(file instanceof File))
        throw new CmsError(
          "INVALID_MEDIA",
          400,
          "Choose a supported media file",
        );
      const targetSection = String(form.get("section") ?? "");
      if (targetSection && !isSection(targetSection))
        throw new CmsError("INVALID_MEDIA", 400, "Choose a valid collection");
      if (external && isRestrictedSection(targetSection))
        await authorizeApiKey(request, "media:write", targetSection);
      const row = await uploadMedia(
        Buffer.from(await file.arrayBuffer()),
        String(form.get("title") ?? file.name),
        String(form.get("alt") ?? ""),
        isRestrictedSection(targetSection) ? targetSection : undefined,
      );
      return json(
        {
          ...row,
          paths: undefined,
          url: `/media/${row.id}/${row.fileName ?? "1600.webp"}`,
          apiUrl: `/api/v1/media/${row.id}/${row.fileName ?? "1600.webp"}`,
        },
        201,
      );
    }
    if (parts[0] !== "entries" || !parts[1] || !isSection(parts[1]))
      throw new CmsError("NOT_FOUND", 404, "Unknown workspace operation");
    const section = parts[1];
    const id = parts[2];
    const action = parts[3];
    if (!id && method === "GET")
      return json(
        await listEntries(
          section,
          new URL(request.url).searchParams.get("cursor") ?? undefined,
        ),
      );
    if (!id && method === "POST") {
      const input = await body(request);
      const generated = newEntryId();
      return json(await saveEntry(section, generated, input.data, 0), 201);
    }
    if (!id) throw new CmsError("NOT_FOUND", 404, "An entry is required");
    identifier.parse(id);
    if (!action && method === "GET") return json(await getEntry(section, id));
    if (!action && method === "PUT") {
      const input = await body(request);
      return json(
        await saveEntry(
          section,
          id,
          input.data,
          revision(input.expectedRevision),
        ),
      );
    }
    if (action === "revisions" && method === "GET")
      return json({ revisions: await listRevisions(section, id) });
    if (method !== "POST")
      throw new CmsError(
        "METHOD_NOT_ALLOWED",
        405,
        "This action uses a different request method",
      );
    if (!["publish", "unpublish", "restore"].includes(action ?? ""))
      throw new CmsError("NOT_FOUND", 404, "Unknown workspace action");
    const input = await body(request);
    const expected = revision(input.expectedRevision);
    if (action === "publish")
      return json(
        await publishEntry(
          section,
          id,
          expected,
          request.headers.get("idempotency-key") ?? "",
        ),
      );
    if (action === "unpublish")
      return json(await unpublishEntry(section, id, expected));
    if (action === "restore")
      return json(
        await restoreRevision(section, id, revision(input.revision), expected),
      );
    throw new CmsError("NOT_FOUND", 404, "Unknown workspace action");
  } catch (error) {
    const normalized =
      error instanceof CmsError
        ? error
        : error instanceof ZodError
          ? new CmsError(
              "INVALID_CONTENT",
              400,
              "A valid identifier is required",
            )
          : new CmsError(
              errorCode(error),
              500,
              "This operation could not be completed. Your previous saved content is safe",
            );
    operationalLog(
      "cms.request_rejected",
      {
        "error.type": normalized.code,
        "http.response.status_code": normalized.status,
      },
      error,
    );
    return json(
      {
        error: { code: normalized.code, message: normalized.message },
        requestId: requestContext.getStore()?.requestId,
      },
      normalized.status,
      { "X-App-Error": normalized.code },
    );
  }
}
