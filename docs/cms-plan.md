# Dynamic journal and publishing workspace

Planning record for [issue #23](https://github.com/theharithsa/theharithsanotes/issues/23), 6 November 2026. This document proposes the next implementation; it does not describe an already deployed backend.

## Confirmed direction

Build a Notion-style workspace at `/admin` inside The Harithsa Notes. Firebase is the content source of truth; this is an editor inspired by Notion, rather than a second copy synchronized with Notion. Each section has a table, a focused editor and a preview. Public reading keeps the existing artwork, serif and programmer typography, asymmetric project mosaics, coloured menu panels, dark mode and consent controls.

Owner decisions in this chat:

- Google sign-in, restricted to verified `theharithsa@gmail.com`.
- Autosave private drafts; explicit Publish changes the public site.
- Article content and metadata in Firestore; media in Cloud Storage.
- US East (`us-east1`), alongside the existing image bucket.
- Pay-as-you-go planning with a ₹500 monthly alert budget: ₹250, ₹400 and ₹500 thresholds. This is an alert threshold, not an estimated bill or a spending cap.
- Blaze is already enabled, confirmed by the owner after inventory; Cloud Storage is already enabled and its bucket was independently verified. No plan upgrade is needed.
- Blog date navigation and tags; photo carousel and date navigation.

## Verified starting point

Read-only checks on 6 November 2026 found:

| Item           | Observation                                                                | Consequence                                                                                                  |
| -------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Public app     | Astro static output, Firebase Hosting, local versioned content             | New database content currently requires a build; introduce server rendering before switching authoring       |
| Firestore      | Listing returned 403: API disabled or never used                           | Database existence and edition are not established; enable API and repeat inventory before creating anything |
| Storage        | `the-harithsa-notes-94.firebasestorage.app` exists, `US-EAST1`, regional   | Retain bucket; inspect its existing objects, permissions and rules before changing them                      |
| Authentication | Authorized domains include Firebase/preview hosts, not the custom apex/www | Add custom domains during auth setup; Google provider enablement remains unverified                          |
| Billing        | Owner confirms Blaze is active; billing-info request returned 403          | Plan status is owner-confirmed; billing account/currency and alert setup remain to be verified               |
| Gallery        | Six curated entries have no capture-date fields                            | Show an Undated group until trustworthy dates are supplied; never infer dates from filenames                 |

Project: `the-harithsa-notes-94`. No API enablement, database creation, billing change, auth change, bucket rule change or deployment occurred during this planning inventory. Local captures under ignored `qa/local` are diagnostic evidence, not public configuration.

## Runtime and repository structure

Keep Astro and TypeScript. Add the supported Node adapter and serve dynamic HTML from Cloud Run through Firebase Hosting. Hosting continues serving immutable build assets. A single web runtime owns public rendering, `/admin`, content APIs and authenticated media processing. A small scheduled Cloud Run job owns retryable audit/outbox delivery; no permanent queue server is needed.

```text
src/
  pages/                  public pages, admin shell, API route entrypoints
  components/admin/       tables, editor, revision history, publish dialog
  components/             existing reading UI, timeline, carousel
  lib/content-models/     versioned JSON contracts and validation
  server/
    auth/                 verified Google identity and authorization
    repositories/         Firestore access, pagination, revisions
    publishing/           validation, publication, unpublish, restore
    media/                private ingestion, variants, approval
    telemetry/            OTel initialization and safe signal contracts
jobs/content-audit/       bounded outbox retry runner
firebase/                 rules, indexes and provider configuration
scripts/content-migration/ dry-run import and reconciliation
skills/service-website/   expanded existing web service contract
skills/service-content-audit/ job ownership and continuation
```

Paths for new modules are proposed, not existing files. Before implementing each runtime, register its real boundaries through `scripts/add_service_skill.py`, update `skills/catalog.json`, `docs/services.md` and continuation records. Admin is a module of the web service, not an invented independent deployment. Foundation tooling keeps its current owner.

Use App Launchpad issue-linked branches and PRs, current-head checks, immutable preview artifacts, explicit migration evidence and rollback receipts. Keep the current static version recoverable. Pin dependency versions only after verifying current adapter, Firebase Admin, Node and OTel compatibility. Do not change frameworks or duplicate the existing RUM agent.

[Astro supports Firebase deployments](https://docs.astro.build/en/guides/deploy/firebase/), and [Firebase Hosting supports Cloud Run rewrites with revision pinning](https://firebase.google.com/docs/hosting/cloud-run). Verify the selected region and `pinTag` deployment behavior in the implementation preview.

## Content tables and document contracts

Use one Firestore database with collections per section, rather than a separate database for each table. Recommend Standard edition / Native mode for this small editorial CRUD workload. Enterprise offers additional query capabilities that are not required by this plan; this recommendation is pending the post-enablement edition inventory. The [edition comparison](https://firebase.google.com/docs/firestore/editions) owns the provider capabilities.

| Admin table    | Section fields beyond shared metadata                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Blog           | original publication time, topic, tags, reading time, source/alternate source links, article blocks    |
| Books          | title, author, genres, personal rating, original review, date read and source ID; completed books only |
| Projects       | topic, stack, overview, problem, approach, features, lessons, live link, GitHub link, illustration     |
| Podcasts       | Listening or Created, show/episode, creator, listening notes, links; Created stays empty initially     |
| Entertainment  | movie/series, lessons, official links, archive art, real detail poster and credits                     |
| GoGs           | game or gadget, experience date, notes, media and links; empty until authored                          |
| Photos         | title, caption, alt text, dimensions, capture date/date precision, album, order, media ID              |
| Pages          | Meet Vish and homepage section selections, intro text and featured references                          |
| Tags and media | reusable topic/genre labels, assets, provenance, focal point and processing state                      |

Shared fields: stable ID, `schemaVersion`, slug, title, description, cover media ID, tags, editorial order, creation/update timestamps, draft revision and published revision. A published item can also have unpublished edits: display “Published · draft changes” rather than forcing one ambiguous status.

Private records live in `drafts/{section}/entries/{id}` with immutable revision subcollections. Public projections live in `published/{section}/entries/{id}` and reference immutable published revision/body documents. Server-owned `slugs`, `media`, `publishOperations`, `auditOutbox` and settings collections have distinct validation and permissions. Never duplicate draft-only fields into the public projection.

Article bodies are versioned JSON blocks: paragraphs, headings with stable anchors, lists, quotes, code with language, figures/captions, tables and embeds from an allowlist. Preserve source HTML during migration as sanitized legacy blocks where conversion would lose code, poetry, tables or formatting. Do not invent reviews, ratings, dates or personal lessons. Split oversized bodies into ordered revision chunks; enforce a conservative 600 KiB serialized chunk limit and bounded total body size. Firestore's [document limits](https://firebase.google.com/docs/firestore/quotas) require size checks before a write. Exclude body text and large media metadata from automatic indexing.

## Editing and publication

1. Open a table, filter/sort its rows, then open an editor beside it. Common properties stay visible; long-form content has an uncluttered writing pane. Mobile uses a full-page editor.
2. Debounced autosave sends validated changes with the expected draft revision. Show Saving, Saved draft, Offline or Conflict truthfully. A stale browser tab cannot overwrite a newer revision; offer reload or a deliberate copy of unsaved text. Never silently drop an offline edit.
3. Preview renders the same templates as public pages using the private draft. Preview and admin responses use `private, no-store`, `noindex` and no shared caching.
4. Publish validates required fields, links, media readiness, slug uniqueness and body safety. The server prepares an immutable sanitized revision, then atomically switches the published pointer and writes the publication operation plus audit outbox entry. Request idempotency prevents a retry from publishing twice.
5. A publish request returns the committed revision. Initial public HTML cache policy: browser revalidation and at most 30 seconds of shared freshness. The UI says publication committed and explains the cache window; it does not claim every visitor changed instantly. Do not enable stale-while-revalidate for unpublish-sensitive pages in this first version.
6. Unpublish removes the public pointer and updates listing/sitemap state. Revision history remains private. Restore creates a new draft from an old revision and requires Publish. Previously published media may remain cached; unpublishing is not a promise to erase copies already delivered.

API commands: list/get drafts, save with expected revision, preview, publish, unpublish, restore, upload/finalize media. Use typed request/response contracts, finite error codes, size/time limits, pagination and idempotency keys for durable actions. No generic arbitrary Firestore proxy.

## Authorization and media

Google sign-in establishes identity; the server verifies Firebase ID-token signature, issuer, project audience, expiration/revocation, verified email and Google provider. Allow only the configured owner email, then pin the authorized UID during setup. Every admin API independently enforces authorization. Deny all direct browser Firestore access initially; Admin SDK bypasses rules, so backend checks and least-privilege service accounts are mandatory. Visitors need no account.

Use short-lived bearer tokens in the authenticated API flow; never accept actor/role fields supplied by the browser. Restrict origins, reject cross-origin mutations, validate method/content type and apply request rate limits. `/admin` and API errors must not leak private content. Test another valid Google user's rejection, not only logged-out access.

Upload through the protected API into private staging paths. Start with raster images up to 8 MiB, verify file signatures and decoded dimension limits, reject executable/SVG payloads, strip sensitive EXIF and generate bounded WebP sizes. Store provenance, copyright credits, alt text, dimensions and focal point in media documents. Keep draft originals inaccessible through public download tokens.

Approved public variants use immutable versioned paths and deliberate public delivery. Scope access to those paths only; inspect bucket IAM and Firebase Rules together. Do not make the whole existing bucket public. A media pipeline failure leaves the draft saved and publication blocked with a useful retry action. No automatic deletion of shared or existing objects; garbage collection starts as a dry-run report with a retention policy.

## Blog timeline and photo carousel

Blog uses a restrained left rail grouped by year. Hover or keyboard focus reveals months and article counts; selecting a month/year jumps to its group. The active marker follows the visible group. Labels use the site's date typography and section palette; avoid a crowded tick for every article. Tags combine with existing search/topic/date filters, reset coherently, show an accessible count and preserve selection in URL parameters. With no matches, show a useful reset instead of a dead timeline.

On narrow screens, replace the fixed rail with a compact date chooser. Keyboard operation, focus visibility, reduced motion and touch must work without hover. Scroll position follows filtered groups; progressive enhancement keeps article links usable without JavaScript. Dates come from original publication time, never migration time.

Photos use one spacious carousel with a caption, manual previous/next controls, swipe, keyboard support and a thumbnail strip. No autoplay. Date groups provide a matching rail with a selected-photo marker. Unknown dates sit in Undated; year-only dates are not expanded into fictional months. Keep full-screen viewing, Escape and focus return, stable image dimensions and adjacent-image preloading. Mobile gets the same compact date chooser. Editing a caption or date in admin updates this view after publication.

## SEO and freshness

Render published article text, metadata, covers and links on the server; never replace indexable content with a client-only Firestore loading screen. New slugs work without a build. Keep all current canonical paths, source links, anchors and aliases; reserve slugs transactionally and require an explicit redirect when changing a published slug.

Generate sitemap, RSS and structured metadata from published revisions. A publication updates article, archive, homepage selections and feed inputs. Unpublished content returns 404; renamed content redirects to its canonical URL. Sitemap omits drafts/admin/filter variants. Filter parameters canonicalize to the archive; arbitrary combinations do not create a crawl trap. Preserve section-specific theme-colour, dark-mode behavior and responsive images. Date-modified reflects editorial publication, not a routine page request.

Avoid public realtime database listeners: server pagination, bounded caches and published metadata queries keep reads predictable. Cache keys must never contain private drafts or admin identity. Test publication propagation and unpublish expiry on both Cloud Run and Hosting; do not assume a successful database commit proves CDN freshness.

## Migration and rollback

Inventory baseline: 88 blog articles, 50 completed books, 12 projects, five listening entries, five entertainment entries and six gallery entries. Created podcasts and GoGs remain empty. Recompute counts from source during implementation rather than treating this document as an import manifest.

First produce a dry-run manifest with stable IDs, canonical paths, source hashes, body/asset sizes, media origins and warnings. Preserve Goodreads ratings and original reviews, Medium duplicate mappings, article dates, technical formatting, illustrated covers, entertainment posters and credits. External media requires a provenance/licensing check; do not silently replace or scrape blocked assets.

Import into a non-production namespace under denied public rules, with idempotent checkpoints and no destructive overwrite. Compare counts, hashes, dates, routes, ratings, body samples and asset availability. Exercise publication against emulators and isolated preview data. Preview credentials and revisions must not grant production draft access or write production records.

Switch public reads only after reconciliation and security checks. Retain the checked static release and import manifest as the rollback baseline. Use backward-compatible document versions so rollback does not require deleting user edits. Roll back the Hosting/Cloud Run revision separately from content-pointer restoration; save newer drafts before any content reversal. Never automatically rerun imports on each deployment.

## Cost and setup dependencies

Use the existing Blaze project and enabled bucket; no billing upgrade or replacement bucket is required. The owner confirmed the plan after the billing-info lookup returned 403. Verify the billing account and currency for alert configuration; that API result is not evidence that billing is disabled. Configure a project-scoped monthly ₹500-equivalent alert budget at 50%, 80% and 100%, with delivery to the owner's selected billing notification channel. Confirm recipient delivery and account-currency conversion rather than labelling an unverified setting ₹500.

Alerts do not enforce a spending cap; [Google's budget documentation](https://docs.cloud.google.com/billing/docs/how-to/budgets) distinguishes alerts from service-specific spend-cap budgets. Keep Cloud Run minimum instances at zero, initially at most two web instances and one audit job task, bounded request sizes and image variants, narrow indexes, limited telemetry volume and no visitor listeners. These controls reduce exposure but do not guarantee a ₹500 bill. Account for storage/downloads, Firestore operations, compute, Scheduler, build artifacts, telemetry and optional backups; price the actual region and measured inventory before enabling paid options.

Before cloud implementation: repeat Firestore inventory after API enablement; verify Standard/Native location availability, billing access, Google provider configuration, custom auth domains, bucket rules/IAM and runtime service-account grants. Backend Dynatrace ingestion destination/scopes and secret access also need verification; the existing UI/RUM configuration alone does not establish them. Never copy a token from chat into repository files or browser configuration.

## dt-obs coverage

Preserve existing opt-in anonymous browser RUM and Firebase Analytics. Do not introduce identity tagging, replay or duplicate agents. Backend operational telemetry uses server-side secret references, bounded retention and an explicit privacy contract; exclude article bodies, private drafts, search strings, emails, tokens and raw request URLs.

Resource namespace: `harithsa-notes`; proposed service names `harithsa-notes-web` and `harithsa-notes-content-audit`, with release version and deployment environment. Initialize OTel before server dependencies. Use real active trace context and first-party propagation only. Do not invent a browser-to-database trace link.

| Journey              | Trace/commit authority                    | Signal and meaningful failure                                                                                         |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Read published page  | web server and Firestore read             | normalized route latency/error metrics, render/read spans; missing revision or dependency timeout                     |
| Sign in/access admin | server token verification                 | bounded authorization outcomes; wrong user, invalid/revoked token; no email in telemetry                              |
| Save draft           | committed draft transaction               | `content.draft_saved`, revision conflict/refused attempt; preserve previous content                                   |
| Process media        | verified upload and stored variants       | `media.ready` or finite processing failure; never infer readiness from browser upload completion                      |
| Publish/unpublish    | published pointer plus outbox transaction | `content.published` / `content.unpublished`, revision and stable event ID; duplicate request and conflicting revision |
| Restore revision     | new committed draft                       | `content.revision_restored`; does not imply public publication                                                        |
| Audit retry          | leased outbox record                      | delivery latency, oldest pending age, backlog and rejected/drop metrics; recovery after timeout/429/401               |

Canonical events derive from committed state; emit only after commit via a durable outbox. Retry with leases, bounded backoff, stable IDs and deduplication. Keep ingest calls outside retried database transactions. Audit-delivery failure must not undo a successful save/publish. Metrics use finite section/operation/outcome/error dimensions; IDs belong only in bounded logs/spans/event records, not metric labels.

Use application error codes including `UNAUTHENTICATED`, `FORBIDDEN`, `REVISION_CONFLICT`, `INVALID_CONTENT`, `MEDIA_NOT_READY`, `DEPENDENCY_TIMEOUT` and `INTERNAL`. Record them consistently on request spans, structured OTel logs and outcome counters. Measure request duration, publish duration, media duration and outbox lag with explicit units. Exclude exporter endpoints from instrumentation and bound flush/queue sizes.

For delivery, map issue → PR → checked head → merge → artifact → provider revision → runtime version using source-owned GitHub/runner/provider records. Record explicit development milestones; no inference from commit timestamps. Source SDLC and test outcomes through a trusted reporting path isolated from PR secrets. Current lifecycle exporter/tenant receipt coverage must be inventoried; this plan does not claim it exists.

Verification states remain separate: local receiver/emulator passed, deployed configuration, HTTP accepted, tenant searchable and verified cross-signal linkage. Keep pending stages visible in `docs/observability.md` and service continuation. Query permissions are separate from ingestion permissions. Monitoring failure never blocks reading or a committed editorial action.

## Implementation sequence and exit criteria

1. **Contracts and browse UI:** register affected service boundaries; implement typed models, blog timeline/tags and carousel against current data. Exit: combined filters, keyboard/touch/reduced-motion behavior and desktop/mobile visual review pass without losing existing content.
2. **Private editing slice:** emulated Firestore/Auth/Storage, Google owner authorization, Blog table/editor, autosave conflicts and draft preview. Exit: unauthorized access denied, drafts absent from public HTML/API/cache, offline/conflict recovery exercised.
3. **Publishing and dynamic HTML:** transactional publication, new slugs, metadata/feed generation, media pipeline and cache window. Exit: publish/retry/unpublish/restore tests and no-JavaScript SEO checks pass; OTel local receiver verifies success and failures.
4. **All sections and migration:** remaining tables, full import manifest, original media and reconciliation. Exit: exact source counts/IDs/ratings/routes and selected body hashes match; owner can edit representative content in every table.
5. **Cloud preview and release:** verify billing/auth/region/IAM, deploy isolated preview, test real owner login and another-user denial, verify CDN propagation, cost alerts and actual Dynatrace evidence. Exit: tested immutable revision, security/rules checks, migration backup, release/rollback rehearsal and production verification receipts.

Do not claim the CMS complete after adding an admin shell or connecting only Blog. Do not cut over production until all currently published sections render from validated published data, and owner publication, media privacy, sitemap freshness and rollback have passed their respective gates.
