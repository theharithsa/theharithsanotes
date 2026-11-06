import { createHash } from "node:crypto";
import { identity, database } from "./firebase.ts";
import { adminEmail, collection, isEmulator } from "./config.ts";
import { CmsError } from "./models.ts";
import { requestContext, observe, firebaseOperation } from "./telemetry.ts";
import type { DecodedIdToken } from "firebase-admin/auth";

const allowedOrigins = new Set([
  "https://theharithsanotes.com",
  "https://www.theharithsanotes.com",
  "https://theharithsa.com",
  "https://www.theharithsa.com",
  "https://the-harithsa-notes-94--review-tzxuxkbf.web.app",
  "https://the-harithsa-notes-94.web.app",
]);
export function checkOrigin(request: Request): void {
  const header = request.headers.get("origin");
  const current = new URL(request.url).origin;
  if (
    header &&
    header !== current &&
    !allowedOrigins.has(header) &&
    !(
      isEmulator() &&
      /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(header)
    )
  )
    throw new CmsError("FORBIDDEN", 403, "This request origin is not allowed");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new CmsError(
      "FORBIDDEN",
      403,
      "Cross-site administration is not allowed",
    );
}
function permitted(claims: DecodedIdToken): boolean {
  return (
    claims.email?.toLowerCase() === adminEmail &&
    claims.email_verified === true &&
    claims.firebase?.sign_in_provider === "google.com"
  );
}
export async function authorize(
  request: Request,
  allowCookie = false,
): Promise<DecodedIdToken> {
  checkOrigin(request);
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]{20,8192})$/)?.[1];
  const session = allowCookie
    ? request.headers.get("cookie")?.match(/(?:^|;\s*)__session=([^;]+)/)?.[1]
    : undefined;
  if (!bearer && !session)
    throw new CmsError(
      "UNAUTHENTICATED",
      401,
      "Sign in with your Google account",
    );
  return observe("cms.authorize", { "auth.provider": "google" }, async () => {
    let claims: DecodedIdToken;
    try {
      claims = bearer
        ? await identity().verifyIdToken(bearer)
        : await identity().verifySessionCookie(session!);
    } catch {
      throw new CmsError(
        "UNAUTHENTICATED",
        401,
        "Your sign-in has expired. Sign in again",
      );
    }
    if (!permitted(claims))
      throw new CmsError("FORBIDDEN", 403, "This workspace is private");
    try {
      claims = await firebaseOperation(
        "verify",
        "authentication",
        { provider: "google", session: !bearer },
        () =>
          bearer
            ? identity().verifyIdToken(bearer, true)
            : identity().verifySessionCookie(session!, true),
        () => ({ verified: true }),
      );
    } catch {
      throw new CmsError(
        "UNAUTHENTICATED",
        401,
        "Your sign-in is no longer valid",
      );
    }
    const reference = database()
      .collection(collection("settings"))
      .doc("administrator");
    await firebaseOperation(
      "verify",
      "settings",
      { setting: "administrator" },
      () =>
        database().runTransaction(async (tx) => {
          const snap = await tx.get(reference);
          if (snap.exists && snap.get("uid") !== claims.uid)
            throw new CmsError(
              "FORBIDDEN",
              403,
              "This Google identity is not the workspace owner",
            );
          if (!snap.exists)
            tx.create(reference, {
              uid: claims.uid,
              createdAt: new Date().toISOString(),
            });
        }),
      () => ({ owner: true }),
    );
    const state = requestContext.getStore();
    if (state)
      state.actor = createHash("sha256")
        .update(claims.uid)
        .digest("hex")
        .slice(0, 24);
    return claims;
  });
}
export async function createPreviewSession(request: Request): Promise<string> {
  await authorize(request);
  const token = request.headers.get("authorization")!.slice(7);
  return firebaseOperation(
    "session",
    "authentication",
    { expiresIn: 43200000 },
    () =>
      identity().createSessionCookie(token, { expiresIn: 12 * 60 * 60 * 1000 }),
    () => ({ created: true }),
  );
}
