# Dynamic journal architecture — 1.12.0

Issue #23 implements the owner-approved Drafts + Publish CMS. It preserves Margin identity 1.0.0, original article URLs, imported bodies, personal book ratings/reviews and media provenance. Original source snapshots remain in Git as the migration baseline.

## Boundaries

Firebase Hosting serves `dist/client` assets and rewrites dynamic routes to Astro’s Node standalone adapter on Cloud Run in `us-east1`. `harithsa-journal` serves production and `harithsa-journal-preview` serves review. Both start at zero instances; maximum instances are two and one respectively. Each has one CPU, 512 MiB memory and a 60-second request timeout. No privileged credentials are bundled into browser assets.

Firestore is Standard Native in `us-east1`, with deletion protection. Collection names are server-selected `cms_live_*` and `cms_preview_*`; clients cannot select a namespace. Collections are entries, immutable revisions, public projections, slug reservations, media, operation receipts, settings and the audit outbox. Entry revisions are optimistic transaction versions. Publish idempotency keys and old slug reservations prevent duplicate publications and broken addresses. Core pages cannot be unpublished.

The public projection contains listing data and the immutable published revision pointer. A public detail read follows the pointer; it never reads the current draft. A per-request cache and a 15-second process cache bound repeated reads; public HTML uses a 15-second shared cache. Private responses and errors use no-store. An empty production collection stays empty; a database failure returns a bounded error rather than silently serving stale seed content. Snapshot builds are explicitly separate.

The bucket `the-harithsa-notes-94.firebasestorage.app` uses uniform bucket access and enforced public access prevention. Its contents were checked empty before that change. `journal/{live,preview}/media/{sha}/` holds content-addressed, metadata-stripped master/400/800/1600 derivatives. The media API checks Firestore visibility and serves public immutable or private no-store responses. Firebase client Firestore/Storage rules deny all access. Admin SDK access is governed by IAM instead.

## Authentication and trust

Google sign-in is enabled in the existing Firebase project. Every administrative operation verifies signature, issuer, expiry, revocation, Google provider, verified owner email and the pinned UID. Private previews and draft images may use the HttpOnly Secure SameSite=Strict `__session` cookie, valid for 12 hours. Mutations still require a bearer ID token. Origin and Fetch Metadata checks reject cross-site administration. Payload size, JSON nesting, schemas, finite field limits, HTML sanitization, image magic/dimensions and per-owner throttling are enforced server-side.

The runtime service account has Firestore data access, only the Firebase Auth user/session permissions needed by this service, media object access limited to the two journal prefixes and access to the one Dynatrace ingestion secret. The build account can read build archives and write the journal image repository. The scheduler account can call the protected delivery endpoint with an audience-scoped Google OIDC identity; it can also invoke the repair job when explicitly run. No service account private keys were created.

## Audit delivery

Each namespace has a protected Cloud Run HTTP drain scheduled every five minutes using a verified Google OIDC scheduler identity. A longer Cloud Run repair job is available on demand; it has no recurring schedule, avoiding the one-minute minimum job charge for empty drains. Publication and its event are one Firestore transaction. Other application Firebase boundaries emit safe request/response summaries and operational events. The worker uses leases, stable event IDs, bounded four-way delivery, a 20-second scheduled HTTP drain budget (170 seconds for manual repair), Retry-After/backoff and visible blocked states. Successful deliveries expire after 30 days; blocked/pending events do not expire. At-least-once delivery can duplicate an ingestion after a crash, so query by distinct event ID.

Outbox persistence, leases and delivery bookkeeping deliberately do not enqueue events about themselves. Google-managed transport retries, CDN-served static assets and internal Firebase infrastructure are outside application event coverage. Public HTML/application requests and semantic Firebase operations are covered. Logs/traces describe technical failures; durable BizEvents certify committed changes.

GitHub’s trusted-main observer uses short-lived OIDC. The gateway checks the exact repository, workflow ref, issuer, audience and event type. PR code receives no ingestion credential. It reports actual workflow/job/step outcomes and bounded JUnit artifacts; test names are hashed, free-text failures and logs are excluded, artifact members are allowlisted, and no downloaded artifact is executed. Case event time is the source workflow’s outcome-observation time, not an invented case timestamp; duration comes from the runner report.

## Migration and recovery

`scripts/migrate-cms.ts --apply` imports the original snapshots into preview using authenticated operator ADC. It is restartable and preserves order and source fields. `jobs/content-migration/manifest.json` identifies the 168 immutable baseline revisions. The one-off live migration verifies each hash, copies only referenced private media into the live prefix, and creates independent live revisions/publications. It never copies arbitrary preview drafts. Created podcasts and GoGs stay empty.

Deploy rules/indexes before the runtime. Use `npm run build:server`; a plain `npm run build` produces only the offline snapshot used by regression tests. Build the `linux/amd64` image from an immutable Git archive with the repository Dockerfile and pass the full commit SHA as `SOURCE_REVISION`. Inspect the final image for credentials, private content and untracked files before pushing it to the public `docker.io/theharithsa/harithsa-notes` repository with a unique release tag. Resolve the pushed digest and pass the full `docker.io/theharithsa/harithsa-notes@sha256:…` reference to `scripts/deploy-runtime.ts` with the namespace, source SHA and service version. The script deploys the web and audit job, configures the schedule and persists deployment outcomes. Publish the matching Hosting client artifact with `firebase.preview.json` or `firebase.json`, then independently verify pages, counts and telemetry.

Before the CMS cutover, the original static rollback Hosting version is `58336dbdc5de13be`. Roll back Hosting to that immutable version to restore the old public site without deleting database content. Runtime rollbacks must restore the matching image, secret reference and Hosting pin; keep new drafts/revisions intact. Never automatically roll back by deleting content or dropping a database.

The approved monthly project alert budget is INR 500 at 50%, 80% and 100%, using default billing recipients. It sends alerts and does not cap spending. Public caching, scale-to-zero, instance limits, bounded payloads and worker budgets limit routine resource use; provider billing and Dynatrace consumption remain usage-based.
