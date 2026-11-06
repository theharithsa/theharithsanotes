# Workspace and content API release

Issue [#30](https://github.com/theharithsa/theharithsanotes/issues/30); implementation [PR #31](https://github.com/theharithsa/theharithsanotes/pull/31), merged as `2fb7525c198d6d09aeb666d1c4840684bd5cdebc`. The [API guide](content-api.md) documents the writing and developer workflows. A final 1.13.1 CSS-only patch corrects sidebar overflow found during production visual review and retains the site icon on mobile; its provider receipts are recorded on the issue after deployment. The API/backend behavior below is unchanged by that patch.

## Deployed implementation evidence

The 1.13.0 implementation image was built from checked revision `d34213c1614dc15693427534fcf344d5a5cbd45f`, Cloud Build `04d88aeb-09e9-4739-8423-05b247769030`, digest `sha256:c3472b77cbc633bd119a832bbdbaf6c212b53807554754287081a926ec2c33f6`. Preview runtime `harithsa-journal-preview-00006-vv8` and live `harithsa-journal-00004-h5m` used this exact image. Hosting review `aa07a6134871eef6` and live `d6a147aad7050737` used the matching container-extracted client files. These are the pre-patch receipts, not the final 1.13.1 identities.

At both Hosting URLs all 500 client files matched SHA256. Production returned all 173 checked public routes and 263 migrated WebP images with zero failures. Immutable baseline body/date/source/Goodreads/project/reflection comparisons passed; original covers and frozen brand assets stayed unchanged. Rules, namespaces and owner UID pin were preserved. No DNS or new tenant changes were made.

Both one-off catalog jobs succeeded: `harithsa-catalog-preview-vc89n` and `harithsa-catalog-live-b8mxq`. All ten core pages are now present. Production published 23 catalog labels; the owner workspace showed 24 including a retained private label. Existing owner drafts were preserved. A sync does not overwrite an existing record or bulk-rename tags in old entries.

## Tests and real API check

The implementation head and merge passed Website/Foundation/GitGuardian checks. Locally, 26 Node checks and nine CMS/schema/emulator checks passed. The latter include scope/collection denial, hash-only key persistence, expiry/revocation, optimistic conflicts, publish retries, private media, direct SDK denial and repeatable catalog reconciliation. Static and server builds passed; Astro reported zero errors/warnings and two existing parser hints. The new dependency was pinned to Swagger UI Dist 5.34.1; npm audit reported zero vulnerabilities.

Cloud Run execution `harithsa-api-verification-4t669` succeeded with an ephemeral preview-only key. Real hosted requests passed: read 200, draft create 201, stale update 409, collection denial 403, publish-scope denial 403, multipart upload 201, authenticated private download 200, anonymous image denial 404 and revoked-key denial 401. The key was revoked and the unpublished synthetic draft/revision/image objects were removed in the job’s awaited cleanup. No permanent owner key was created; no raw key appears in the receipt or telemetry.

Chrome rendered Swagger’s nine collections and media schemas. The owner’s existing signed-in production session successfully loaded Write, all ten Pages, the 24-row Tags view, counts and Developer Settings without a new sign-in. Key generation/revocation behavior was verified by emulator and hosted API tests; the browser key-creation button was deliberately not submitted. Responsive review found the sidebar issue corrected in the 1.13.1 patch. These checks do not claim a physical mobile-device test or a full accessibility audit.

## Dynatrace

Bounded DQL in context `my-env` returned the actual preview key creation and revocation events for the same temporary key; IDs `71d80063-22c5-44c4-9dcb-725ab6c443a4` and `715d82c5-b453-44ad-adc0-65538eeca3d4`. A native SERVER span for `HTTP GET /api/v1/entries/:entry` carried trace `b5c46b4651f05f7404db360cce8e553a` and the exact implementation revision. The CLI query session was refreshed through existing SSO; the unrelated default `airtel` context was restored.

Build/Hosting receipts were read from their provider APIs before enqueueing stable SDLC events. Catalog and verification job outcomes were also read from actual successful executions. The existing worker handles these events along with source-owned GitHub observer records. All current privacy/coverage limits remain in [CMS observability](cms-observability.md); there is no new raw payload, credential, draft-body or browser analytics export. Empty queues were observed after the initial release; later verification naturally adds new records.

## Rollback and integration boundaries

Retain published content, drafts, revisions, media and API-key revocations during rollback. Hosting `0a9334b195d81c57` is the preceding 1.12.0 CMS release, but reverting to it removes versioned API availability. The static fallback `58336dbdc5de13be` is still documented for emergency public-site recovery. The final patch’s exact image/Hosting pin must be checked independently before use. No arbitrary frontend page routes or MCP server are added in this release; those are future work.
