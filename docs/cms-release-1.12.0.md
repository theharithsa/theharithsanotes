# CMS release 1.12.0

Released to [theharithsa.com](https://theharithsa.com) on 6 November 2026. The [workspace](https://theharithsa.com/admin) admits only the verified Google owner, `theharithsa@gmail.com`, with a server-pinned UID. [Publishing guide](cms-guide.md).

## Source and provider receipts

- Issue [#23](https://github.com/theharithsa/theharithsanotes/issues/23), implementation [PR #28](https://github.com/theharithsa/theharithsanotes/pull/28), merged normally as `79717dd59fe549ad234e923e001c0c6b4fa47667`.
- Tested image source: `0e00af0155bf7844cce0da96d3766496cd452d5e`. Website, Foundation and GitGuardian checks passed at this head; Website/Foundation also passed on the merge commit.
- Cloud Build `7d4ee1b3-8cb6-47ae-9f59-9073febf0699`: SUCCESS. Image digest `sha256:44c2e0953d2e635e0e3199d6b95b5a9557b32f51533e2544af0640707ae9c5a2` in `us-east1/harithsa-journal/web`.
- Live Cloud Run revision `harithsa-journal-00003-vqd`; preview `harithsa-journal-preview-00005-j4m`. Web and manual audit jobs share the same immutable image. Hosting pins are preserved by subsequent runtime deployments.
- Live Hosting version `0a9334b195d81c57`; review `52dd1d6848f690f1`. Client files were extracted from that exact Linux image, not rebuilt independently on Windows.
- Baseline live migration `harithsa-baseline-migration-znkpl` succeeded after checking the 168 immutable source revision hashes. Only referenced media was copied into the live namespace.
- Original static Hosting version `58336dbdc5de13be` remains the rollback baseline. Rollback must preserve all CMS data and delivery receipts.

## Verified outcomes

Both namespaces contain 88 articles, 50 read books, 12 projects, five listening notes, five entertainment notes, six photos and two core pages. Created podcasts and GoGs remain empty. All original article body text/dates/source links, Goodreads ratings/reviews and project/reflection details were compared with the source snapshots. There are 263 distinct locally owned media objects per namespace, with responsive derivatives; 20 original external body-image references remain external.

At both final Hosting URLs, 173 public routes and 263 migrated WebP responses passed with zero failures. All 498 client files matched the image-derived SHA256 manifest byte for byte. The live health endpoint returned version 1.12.0 / environment live. Admin/private responses were no-store/noindex; anonymous administration and invalid credentials were rejected. Hosting forwarded Authorization and the private `__session` cookie correctly. The reserved Firebase Auth iframe returned 200 without a frame-denial header. HTTPS www returned 301 to the apex. No registrar changes were made.

Checks passed: 26 Node tests, six real emulator integration tests, all 21 Linux Foundation tests, Astro checks/static regression build/server build and dependency audit. A real headless Tiptap regression test verifies that changing editor availability does not rewrite an opened article. The independent protobuf receiver checks actual concurrent parentage, SERVER/CLIENT kinds, producer links, correlated logs and DELTA metric payloads.

## Dynatrace evidence

Queries explicitly used tenant context `my-env` and bounded time ranges. The user's unrelated default context was preserved. The tenant returned real publication/draft/Firebase/HTTP events, runtime server spans, correlated logs and request metrics. One request metric observation returned 1,255 requests in its one-hour window; this is an observation, not a fixed baseline or SLO.

Source-verified final Cloud Build and live Hosting records were independently returned by DQL. Live Hosting event ID: `54a96811fe05aff6fbe5d53e10e8d4d98a07e371f9ddc026be723b0ad87fd9e6`; build event ID: `3d7478bd563bce6ac4994f2ea9328be72a2b2bd58c24be4f774c0a55a9ea7ba0`. Native server spans were observed for version 1.12.0. A live scheduled-drain log carried trace `57ead305e6fae44462afb8c43d7038fa` and span `1f3afc12076cd0d1` in Dynatrace's log fields `trace_id` / `span_id`.

The trusted GitHub observer initially failed with actual 404s before the live gateway existed. Runs 42135827581, 42135880999, 42136149251 and 42136160103 passed their report-only reruns after cutover. DQL returned the merged PR transition and merge-commit test records with source `github-actions`. Initial pre-observer CI was separately backfilled from actual GitHub API/report records and labelled server-observed; it was not represented as native runner execution context.

Audit delivery is durable and at least once. Application requests and semantic Firebase operations carry safe byte sizes/property names/hashes, not raw content or credentials. CDN hits, Google-internal retries and outbox bookkeeping are excluded; see [coverage and limits](cms-observability.md). RUM-to-backend native linkage is not claimed.

After verification traffic and source reports settled, direct Firestore counts found zero pending/processing and zero blocked events in both namespaces. This is a point-in-time observation; subsequent traffic creates new records normally. The five-minute schedules remain active.

## Verification limit and operations

Browser control stopped at the Google account chooser before owner selection completed. Interactive owner sign-in, rich-editor use and mobile CMS layout therefore remain unverified in a real browser. Emulator authentication/editor tests and hosted denial/forwarding checks are separate evidence, not substitutes for an interactive pass.

Firestore Standard Native, Cloud Run, private Storage and scheduling use us-east1 in the existing Blaze project. The INR500 monthly budget alerts at 50%, 80% and 100% were configured/read back; alerts do not cap charges. Runtime scale-to-zero and bounded instances remain enabled. Secrets are accessed through narrow runtime identities; no service-account keys or browser ingestion credentials were created.
