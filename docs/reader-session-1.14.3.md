# Reader session restoration — 1.14.3

Issue #42; PR #43. The previous live page showed the sign-in gate while a valid Firebase identity was restoring, then again during session creation/post loading. Chrome reproduced the visible gate before all 51 journals loaded.

## Behavior and boundaries

Initial generic HTML now shows a neutral notebook placeholder with sign-in hidden. The client has explicit loading, ready, signed-out, denied and retryable error states. It waits for Firebase auth readiness, captures the current identity and loads the image session and posts concurrently. Content stays hidden until both authenticated requests finish. No private content is used as a loading placeholder or persisted in browser caches.

Navigation, identity changes and pagehide invalidate pending reads; stale responses cannot repopulate the DOM or restore the header access preference. Back/forward restoration revalidates access. Sign-out clears private content immediately, waits for already-started cookie creation before deleting the session and retries failed cleanup. A same-account Google sign-in can explicitly reload even if Firebase does not deliver a new identity notification. The separate public header access probe is skipped inside the reading room to avoid competing state updates.

Membership, revocation, token checks, HttpOnly cookie lifetime, private media and no-store API responses are unchanged. No API, database, permission, content, brand or template migration. Browser RUM/Analytics remain disabled on private routes; no personal notes or auth credentials enter release evidence. Rollback uses matching private-aware 1.14.2 image/client assets.

Firebase primary documentation: [Auth readiness](https://firebase.google.com/docs/reference/js/auth.auth#authauthstateready) and [auth state observers](https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user).

## Validation and release

Seven asynchronous tests execute the actual transpiled reader client with synthetic identity/network/DOM adapters: delayed session/content, signed-out visitor, stale completion after sign-out, denial versus transient failure/retry, pagehide/Back restoration, session-cookie sign-out ordering and pending Firebase initialization. All passed, alongside local Astro check/build. Built HTML starts with the gate hidden and the neutral loading view visible.

Application source: `e831e3b07ad58ca2beaabbe66d6f632c3293bc8f`. Cloud Build `6e66d016-705d-43d9-9b4b-55ddab5ff107` succeeded with image `sha256:3c59d438c9b944b87b923ff9ecb4f8f9ed7583489276a429e173d2eee6f3146c`. All application-head CI checks passed. Subsequent documentation changes do not change that artifact. The source-confirmed preview/live release receipts, final Chrome navigation samples and tenant verification are tracked in [PR #43](https://github.com/theharithsa/theharithsanotes/pull/43). This document records the implementation and local regression results; the PR owns final deployment status.
