import { createHash } from "node:crypto";
import { z } from "zod";
import type { DecodedIdToken } from "firebase-admin/auth";
import { authorize, checkOrigin } from "./auth.ts";
import { adminEmail, collection } from "./config.ts";
import { database, identity } from "./firebase.ts";
import { CmsError } from "./models.ts";
import {
  auditEvent,
  firebaseOperation,
  outboxDocument,
  requestContext,
} from "./telemetry.ts";

const emailSchema = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const memberId = (email: string) =>
  createHash("sha256").update(email).digest("hex");
export interface Member {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  uid: string | null;
}

export async function authorizeReader(
  request: Request,
): Promise<DecodedIdToken> {
  checkOrigin(request);
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]{20,8192})$/)?.[1];
  const cookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)__session=([^;]+)/)?.[1];
  if (!bearer && !cookie)
    throw new CmsError("UNAUTHENTICATED", 401, "Sign in to your invitation");
  let claims: DecodedIdToken;
  try {
    claims = await firebaseOperation(
      "verify",
      "authentication",
      { provider: "google", audience: "invited" },
      () =>
        bearer
          ? identity().verifyIdToken(bearer, true)
          : identity().verifySessionCookie(cookie!, true),
      () => ({ verified: true }),
    );
  } catch {
    throw new CmsError("UNAUTHENTICATED", 401, "Please sign in again");
  }
  if (
    !claims.email ||
    !claims.email_verified ||
    claims.firebase?.sign_in_provider !== "google.com"
  )
    throw new CmsError(
      "FORBIDDEN",
      403,
      "Use the verified Google account that was invited",
    );
  if (claims.email.toLowerCase() === adminEmail)
    return authorize(request, true);
  const id = memberId(claims.email.toLowerCase());
  await firebaseOperation(
    "verify",
    "members",
    { id },
    () =>
      database().runTransaction(async (tx) => {
        const ref = database().collection(collection("members")).doc(id);
        const row = await tx.get(ref);
        if (
          !row.exists ||
          row.get("revokedAt") ||
          Date.parse(String(row.get("expiresAt"))) <= Date.now() ||
          !Number.isFinite(Date.parse(String(row.get("expiresAt")))) ||
          (row.get("uid") && row.get("uid") !== claims.uid)
        )
          throw new CmsError(
            "FORBIDDEN",
            403,
            "This reading room is by invitation. Ask Vish for access",
          );
        if (!row.get("uid")) tx.update(ref, { uid: claims.uid });
      }),
    () => ({ invited: true }),
  );
  const state = requestContext.getStore();
  if (state) state.actor = memberId(claims.uid).slice(0, 24);
  return claims;
}
export async function readerSession(request: Request): Promise<string> {
  await authorizeReader(request);
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]{20,8192})$/)?.[1];
  if (!token) throw new CmsError("UNAUTHENTICATED", 401, "Sign in again");
  return firebaseOperation(
    "session",
    "authentication",
    { audience: "invited" },
    () =>
      identity().createSessionCookie(token, { expiresIn: 12 * 60 * 60 * 1000 }),
    () => ({ created: true }),
  );
}
export async function listMembers(): Promise<Member[]> {
  return firebaseOperation(
    "query",
    "members",
    { limit: 200 },
    async () => {
      const rows = await database()
        .collection(collection("members"))
        .where("revokedAt", "==", null)
        .limit(200)
        .get();
      return rows.docs.map((row) => row.data() as Member);
    },
    (rows) => ({ count: rows.length }),
  );
}
export async function inviteMember(input: unknown): Promise<Member> {
  const parsed = z
    .object({
      email: emailSchema,
      expiresInDays: z.number().int().min(1).max(365).default(90),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success)
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Enter a valid email and lifetime of 1–365 days",
    );
  if (parsed.data.email === adminEmail)
    throw new CmsError("INVALID_CONTENT", 400, "The owner already has access");
  const id = memberId(parsed.data.email);
  return firebaseOperation(
    "invite",
    "members",
    { id },
    () =>
      database().runTransaction(async (tx) => {
        const ref = database().collection(collection("members")).doc(id);
        const old = await tx.get(ref);
        const row: Member = {
          id,
          email: parsed.data.email,
          createdAt: old.get("createdAt") ?? new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + parsed.data.expiresInDays * 86400000,
          ).toISOString(),
          revokedAt: null,
          uid: old.get("uid") ?? null,
        };
        if (!old.exists) {
          const active = await tx.get(
            database()
              .collection(collection("members"))
              .where("revokedAt", "==", null)
              .limit(200),
          );
          if (active.size >= 200)
            throw new CmsError(
              "INVALID_CONTENT",
              409,
              "Revoke an existing invitation first",
            );
        }
        const event = auditEvent("membership.invited", {
          "member.id": id,
          "membership.lifetime_days": parsed.data.expiresInDays,
        });
        tx.set(ref, row);
        tx.create(
          database().collection(collection("outbox")).doc(event.id),
          outboxDocument(event),
        );
        return row;
      }),
    (row) => ({ id: row.id, active: true }),
  );
}
export async function revokeMember(id: string): Promise<{ revoked: true }> {
  if (!/^[a-f0-9]{64}$/.test(id))
    throw new CmsError("NOT_FOUND", 404, "Invitation not found");
  return firebaseOperation(
    "revoke",
    "members",
    { id },
    () =>
      database().runTransaction(async (tx) => {
        const ref = database().collection(collection("members")).doc(id);
        const row = await tx.get(ref);
        if (!row.exists)
          throw new CmsError("NOT_FOUND", 404, "Invitation not found");
        if (!row.get("revokedAt")) {
          const event = auditEvent("membership.revoked", { "member.id": id });
          tx.update(ref, { revokedAt: new Date().toISOString() });
          tx.create(
            database().collection(collection("outbox")).doc(event.id),
            outboxDocument(event),
          );
        }
        return { revoked: true as const };
      }),
    () => ({ revoked: true }),
  );
}
