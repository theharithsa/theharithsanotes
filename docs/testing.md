# Website and foundation checks

## 1.2.0 integrated verification

`npm run check`: 31 files, zero diagnostics. Static build: 25 pages. Nine Node tests passed, including all new routes and section-anchor destinations, original article/list preservation, consent isolation and duplicate home heading regression. `npm audit --audit-level=high`: zero vulnerabilities. Foundation ready gate and Markdown links passed; Python suite: 21 discovered, 20 passed, one POSIX case skipped on Windows.

Browser observations: desktop Home, Books, Podcasts, Entertainment, Meet Vish and War Room essay; project disclosure click, keyboard focus opening and Escape closure; bookshelf Reading filter returned four visible books; gallery next/Escape/focus return; mobile home/menu/blog search/empty/reset and native bullet/decimal lists. All six section/journal routes were inspected at 390px, with no horizontal overflow. War Room body width was 720px on desktop. A dev-server restart interrupted one tab; a fresh tab recovered normally. This is local UI evidence, not an automated cross-browser accessibility audit.

The formatter now has the pinned Astro plugin; the earlier no-parser formatting failure was corrected. Saved local screenshot: qa/local/home-redesign.jpg (ignored, not deployed).

## Earlier verification history

Node.js 24, npm, Python 3.11+. Run `npm ci`, `npm run check`, `npm run build`, then `npm test`. Nine Node tests cover complete article migration/path preservation, every internal built link/local asset (including gallery), preserved list counts/section anchors, RSS/sitemap completeness, LinkedIn attribution/content discovery and dt-mac-agent, secret exclusion, first-visit/denied-consent isolation, and localhost/blocked-storage isolation. They exercise built artifacts and the actual telemetry script in an isolated VM; they do not contact production telemetry.

Browser checks performed at 1440×1000 and 390×844: desktop hero, mobile archive, search to one result, no-results message, reset, topic filter, mobile menu, Escape dismissal and focus return. Mobile archive had zero broken loaded images and no horizontal overflow. Provider receipts/tenant sessions remain separate from these local checks. Tests do not claim Firebase writes, real GA ingestion, or Dynatrace receipt.

Refinement browser checks: editorial hero and gallery at 1440×1000; gallery and home at 390×844; About/projects/article at 320×740. Eleven project entries and zero broken loaded project images observed. Serif body font confirmed; the first three bullet paragraphs had 0px top/bottom margins. Gallery opens, ArrowRight changes photo, Escape closes, original button regains focus, and scroll lock is removed. Contents anchors scroll to real article headings. No overflow observed on the narrow pages.

`npm audit --audit-level=high` verifies the pinned dependency graph. An explicit grpc-js 1.14.7 override resolves the advisory in the unused Firestore branch of Firebase’s umbrella package. Only app/analytics are imported by the client.

## Inherited foundation checks

Windows results: 21 discovered, 20 passed, one POSIX-shell case skipped. Linux CI runs that case. Fixtures reset discovery decisions and exclude the app-specific service so template tests remain independent of the configured application. Registration scenarios cover Windows rooted-path rejection and lock cleanup.

Python 3.11+ and a POSIX shell; standard library only:

```sh
sh scripts/check.sh
python3 scripts/check_foundation.py --json
python3 scripts/check_foundation.py --ready --json
```

The shared entrypoint runs metadata/version/skill validation, local Markdown links and unit tests. README, catalog and CI use that same entrypoint. JSON output has `ok`, deterministic `errors`, and `ready` (whether discovery checks were requested); failures exit nonzero in either mode.

The [schemas](../schemas/README.md) own field shapes. The Python gate adds internal-path/reference/dependency checks and ready/active semantics. Tests cover multi-error diagnostics, malformed structures, schema/constant parity, SemVer, service generation and rollback, link failures, CI command agreement and ruleset dry-run behavior.

For actual application suites follow the [test contract](../.agents/skills/app-launchpad/references/testing.md) and [evidence rules](../.agents/skills/app-launchpad/references/evidence.md). Record real commands/prerequisites in the relevant service skill after stack selection. `examples/` is synthetic reference material and never execution proof or a cataloged service. Raw local artifacts remain ignored under `qa/local/` or `qa/raw/`.

1.2.0 deployment evidence: implementation 97311f59ca6703f7cc9c1dbc524f4c6d4304f67e; Firebase review version f1ef7989b3531a52. All seven primary pages plus War Room returned 200 and matched local HTML bytes. Unknown path returned 404. Browser verified deployed menu and bookshelf after refresh; first open used a cached older home. Foundation, website and GitGuardian checks passed for implementation SHA. No analytics provider receipt or tenant searchability is asserted.

## 1.3.0 screen journal

Astro check: 34 files, zero errors/warnings/hints. Static build: 30 pages. Ten Node tests passed, including all five reflection body/lesson/canonical/sitemap routes and private-source URL exclusion. Internal link/anchor checks include each reading page; existing migration and consent tests remain green. Foundation ready and Markdown links passed.

Browser checked desktop archive, series filtering (one card), movies filtering (three cards), all reset, series detail and visible title-disambiguation note. All five detail pages were inspected at 390px: one h1, four body paragraphs, no horizontal overflow. Featured reflection stays above the filterable archive. Artwork is CSS; no external poster/streaming-player requests are introduced. Preview receipt and current revision checks are recorded separately in qa/evidence.json.

1.3.0 preview: fc050dd9395f0644 from implementation 842acb64b851432d7164c3dae449e41003326904. Archive and all five reading pages matched local HTML bytes over HTTP 200. Deployed series filter and detail lesson were verified in-browser. Implementation CI foundation/website/GitGuardian passed. Documentation-only follow-up head is checked separately.

## 1.3.1 poster verification

Astro check: 35 files, zero diagnostics. Build: 30 pages. Ten Node tests cover unchanged reflection bodies and now require actual JPEG poster bytes, local poster references and official/source links on the collection and each detail. All five promotional images were visually inspected against their titles. Browser archive: five loaded poster images, object-fit:contain, no horizontal overflow. Mobile Made in Korea detail: loaded poster, official Netflix title link and no overflow; Series filter still returns one card. Source metadata and full original dimensions are in docs/screen-media.json. Provider title-page content is verified; streaming availability by region is not asserted.

1.3.1 preview version 7c95643d040ce258 from eae5cc13e0f0e3c46b479b6646b541d057e048aa: six pages and five poster images returned 200 with exact artifact bytes. Deployed browser loaded all five posters and official links after refresh. Implementation CI foundation/website/GitGuardian passed; documentation-only follow-up head is checked separately.

## 1.4.0 cover and typography checks

Astro check: 36 files, zero diagnostics. Build: 30 pages. Ten Node tests passed, including the corrected regression that archive covers are illustrated and posters are confined to detail pages. Existing full-body/list/canonical/consent checks remain active. Browser observations: five illustrated covers and zero real posters on Entertainment; opened series page has one loaded real poster. Racing Sans One and JetBrains Mono were loaded and confirmed by computed styles. Technical MCP article heading/body use JetBrains Mono; screen-note body uses Source Serif. Desktop 1440px and phone 390px technical layouts had no overflow; screen detail at 320px also fit. Open-source workbench was inspected at 390px. Footer wordmark width is constrained separately to keep speed lines beside its lettering.

1.4.0 preview version 9cf264c03c868b32 from d9f7972c2e04c5078a98bc8ee99dd2e7f3935561: home, archive, screen detail, technical article and Projects all matched local HTML bytes over HTTP 200. Browser verified live cover/wordmark/technical font states. Implementation foundation/website/GitGuardian checks passed; final documentation head is checked separately.

## 1.5.0 project journey / issue #9

Local: Astro check (37 files, zero diagnostics), build (42 pages), eleven Node artifact/consent tests passed. New coverage follows all twelve project detail routes, sitemap entries, unique PNG covers (1536×1024), canonical resources, back anchors and internal assets. The unconfirmed FinVision repository is explicitly excluded from source-link assertions. Existing full article/list and Entertainment poster-placement coverage stays active.

Browser at 1440×1000: twelve cards in three equal 397px columns; every cover loaded, JetBrains Mono computed on project headings and reading paragraphs, zero horizontal overflow. Clicked SalesDrone’s Project notes, observed the local reading route, overview/capabilities and separate live/GitHub links; back link returns to the original card anchor. At 390×844: one column with twelve equal 335px cards, no overflow; detail resources and stack adapt to the narrow layout. Saved captures: ignored `qa/local/projects-grid.jpg`, `project-detail.jpg`, `projects-mobile.jpg`. Image source subjects/composition inspected individually before consumption. These are local browser observations, separate from deployment verification below.
