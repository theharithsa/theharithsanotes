import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { database } from "./firebase.ts";
import { collection, namespace } from "./config.ts";
import { CmsError, sections, type Section } from "./models.ts";
import {
  auditEvent,
  firebaseOperation,
  outboxDocument,
  requestContext,
} from "./telemetry.ts";

export const apiScopes = [
  "content:read",
  "content:write",
  "content:publish",
  "media:read",
  "media:write",
] as const;
export type ApiScope = (typeof apiScopes)[number];
export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  scopes: ApiScope[];
  sections: Section[];
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
}
interface StoredKey extends ApiKeyInfo {
  digest: string;
}
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const keyRef = (id: string) =>
  database().collection(collection("apiKeys")).doc(id);
const safe = ({ digest: _digest, ...info }: StoredKey): ApiKeyInfo => info;
const options = z
  .object({
    name: z.string().trim().min(1).max(80),
    scopes: z.array(z.enum(apiScopes)).min(1).max(5),
    sections: z.array(z.enum(sections)).min(1).max(sections.length),
    expiresInDays: z.number().int().min(1).max(365),
  })
  .strict();

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  return firebaseOperation(
    "query",
    "apiKeys",
    { limit: 100 },
    async () => {
      const rows = await database()
        .collection(collection("apiKeys"))
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
      return rows.docs.map((row) => safe(row.data() as StoredKey));
    },
    (rows) => ({ count: rows.length }),
  );
}
export async function createApiKey(
  input: unknown,
): Promise<{ key: ApiKeyInfo; token: string }> {
  const parsed = options.safeParse(input);
  if (!parsed.success)
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Choose a name, permissions, collections and a lifetime of 1–365 days",
    );
  const id = randomBytes(8).toString("hex");
  const token = `hn_${namespace}_${id}_${randomBytes(32).toString("base64url")}`;
  const row: StoredKey = {
    id,
    name: parsed.data.name,
    prefix: `hn_${namespace}_${id}`,
    scopes: [...new Set(parsed.data.scopes)],
    sections: [...new Set(parsed.data.sections)],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(
      Date.now() + parsed.data.expiresInDays * 86400000,
    ).toISOString(),
    revokedAt: null,
    lastUsedAt: null,
    digest: hash(token),
  };
  await firebaseOperation(
    "create",
    "apiKeys",
    { id, scopes: row.scopes, sections: row.sections },
    () =>
      database().runTransaction(async (tx) => {
        const existing = await tx.get(
          database()
            .collection(collection("apiKeys"))
            .where("revokedAt", "==", null),
        );
        if (
          existing.docs.filter(
            (doc) => Date.parse(String(doc.get("expiresAt"))) > Date.now(),
          ).length >= 20
        )
          throw new CmsError(
            "KEY_LIMIT",
            409,
            "Revoke an unused key before creating another. Up to 20 active keys are allowed",
          );
        const event = auditEvent("developer.key_created", {
          "developer.key.id": id,
          "developer.key.scope_count": row.scopes.length,
          "developer.key.collection_count": row.sections.length,
        });
        tx.create(keyRef(id), row);
        tx.create(
          database().collection(collection("outbox")).doc(event.id),
          outboxDocument(event),
        );
      }),
    () => ({ created: true, id }),
  );
  return { key: safe(row), token };
}
export async function revokeApiKey(id: string): Promise<{ revoked: true }> {
  if (!/^[a-f0-9]{16}$/.test(id))
    throw new CmsError("NOT_FOUND", 404, "API key not found");
  await firebaseOperation(
    "revoke",
    "apiKeys",
    { id },
    () =>
      database().runTransaction(async (tx) => {
        const reference = keyRef(id);
        const row = await tx.get(reference);
        if (!row.exists)
          throw new CmsError("NOT_FOUND", 404, "API key not found");
        if (row.get("revokedAt")) return;
        const event = auditEvent("developer.key_revoked", {
          "developer.key.id": id,
        });
        tx.update(reference, { revokedAt: new Date().toISOString() });
        tx.create(
          database().collection(collection("outbox")).doc(event.id),
          outboxDocument(event),
        );
      }),
    () => ({ revoked: true }),
  );
  return { revoked: true };
}
export async function authorizeApiKey(
  request: Request,
  scope: ApiScope,
  section?: Section,
): Promise<{ uid: string; sections: Section[] }> {
  const token = request.headers
    .get("authorization")
    ?.match(
      /^Bearer (hn_(?:live|preview|test)_([a-f0-9]{16})_[a-zA-Z0-9_-]{43})$/,
    );
  if (!token || !token[1]!.startsWith(`hn_${namespace}_`))
    throw new CmsError(
      "UNAUTHENTICATED",
      401,
      "A valid API key for this environment is required",
    );
  const id = token[2]!;
  const permittedSections = await firebaseOperation(
    "verify",
    "apiKeys",
    { id, scope, section: section ?? null },
    () =>
      database().runTransaction(async (tx) => {
        const reference = keyRef(id);
        const snap = await tx.get(reference);
        const row = snap.exists ? (snap.data() as StoredKey) : null;
        const actual = Buffer.from(hash(token[1]!), "hex");
        const expected = Buffer.from(row?.digest ?? "0".repeat(64), "hex");
        if (
          !timingSafeEqual(actual, expected) ||
          !row ||
          row.revokedAt ||
          Date.parse(row.expiresAt) <= Date.now()
        )
          throw new CmsError(
            "UNAUTHENTICATED",
            401,
            "This API key is invalid, expired or revoked",
          );
        if (
          !row.scopes.includes(scope) ||
          (section && !row.sections.includes(section))
        )
          throw new CmsError(
            "INSUFFICIENT_SCOPE",
            403,
            "This API key does not allow that permission or collection",
          );
        if (
          !row.lastUsedAt ||
          Date.parse(row.lastUsedAt) < Date.now() - 3600000
        )
          tx.update(reference, { lastUsedAt: new Date().toISOString() });
        return row.sections;
      }),
    () => ({ authorized: true }),
  );
  const state = requestContext.getStore();
  if (state) state.actor = `key:${id}`;
  return { uid: `key:${id}`, sections: permittedSections };
}
