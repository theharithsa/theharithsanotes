# CMS validation — 1.12.0

Run npm ci, npm run check, npm run build, npm test, npm run test:cms, npm run build:server and npm audit --audit-level=high. CMS emulators require JDK21 or newer. npm run test:cms owns an isolated demo-harithsa-cms project and test namespace; it never needs production credentials. Node site/OTLP/JUnit checks and CMS checks write separate JUnit files under ignored artifacts. The foundation runner also preserves measured JUnit outcomes. Trusted CI exports only hashed case identities/status/duration, never failure text.

Working-tree checks: 24 Node tests passed; six real emulator integration tests passed; foundation discovered 21 tests, 20 passed and the POSIX-only case was skipped on Windows. Astro type check has zero errors/warnings and two pre-existing parser deprecation hints. The offline snapshot builds 175 pages; the deployed application is SSR, so those static artifacts are regression fixtures rather than the production output. CI must verify the final committed head independently.

CMS tests cover malicious HTML/URLs/nesting, reserved slugs, payload exclusion, concurrent revision conflicts, draft/public separation, idempotent publication events, old address lookup, restore/unpublish, anonymous/wrong/unverified/expired/provider/origin denial, accepted owner identity, private/public images, duplicate uploads, image type rejection, real outbox retries/leases and direct client rule denials. The independent protobuf receiver validates concurrency/parentage, correlated logs, resource identity, metric units/DELTA and secret exclusion. Snapshot tests preserve original article bodies, book ratings/reviews, brand hashes, routes/media and public consent; private pages never load browser analytics.

Hosted preview health, anonymous denial, private no-store/noindex shell, public SSR archive, responsive media and the image endpoint returned expected responses. Independent tenant DQL found a real preview HTTP root and its Firestore children. Google owner selection could not complete because Windows browser control stopped; this is an explicit UI verification gap, not a passed login test. Final source/production/tenant receipts belong in the release evidence and continuations.

## Earlier validation history

# Website and foundation checks

Issue #25 / 1.11.0: brand tests check every declared hash, self-contained logo paths, page icon references, manifest sizes, transparent inverse PNGs, all ICO entries and maskable safe circle. Browser checks cover light/dark identity, desktop disclosure, keyboard mobile menu/Escape and 320/390px home layout. Book-decoration overflow and header sizing found at 320px were corrected. PR #26 owns checked-head and deployment receipts. No registrar mutation; the additional domain was cancelled and its newly created pending Firebase resources removed.

## 1.10.0 browsing and theme coverage

Nineteen Node tests cover the 50 read-only books, editorial genre integrity and real browser-script filtering (Science=6; Hawking=4; five-star Hawking=2), project topic/reset/lead states, theme default/manual/system/cross-tab/storage-failure behavior, metadata/canonical/sitemap/404 rules and accurate original article/book structured fields. Existing source-body/media, reading review, navigation, project, feed, secrets and analytics-consent regressions remain covered. Astro builds 174 pages. Final current-head CI and deployment receipts are recorded separately in issue #21.

Browser: combined genre/search/rating returns two books; Creativity returns three. Observability shows its three projects and an adapted lead tile; Money & planning shows FinVision AI and Budget Buddy. Saved dark preference survives reload/navigation. Main sections and representative article/book/project/podcast detail surfaces were inspected in night mode; a low-contrast article deck was corrected. GoGs header disclosure loads the portrait illustration, and mobile navigation includes the section. At 390px, route/theme tint matches the mobile header; at 320px, Books/Projects/GoGs/a code article have no document overflow and header controls remain 44px targets. Narrow decorative bookshelf overflow was corrected. Viewport override reset. These are desktop browser responsive/metadata checks, not a physical Android toolbar or full accessibility audit. SEO evidence covers generated artifacts, not indexing/ranking outcomes.

## 1.9.0 Medium archive verification

All 83 Medium stories were opened and read in Chrome. Offline comparison found every captured non-figure body block in the 75 imported articles. Sixteen artifact tests passed, including 83-source accounting, 75 body hashes/original dates, eight duplicate publication links, all 151 copied media hashes, all 88 unique responsive covers, internal links/anchors and existing journal/consent regressions. Astro builds 173 pages; type checking reports zero errors/warnings and two deprecated parser-helper hints. Dependency audit found zero vulnerabilities. Foundation/Markdown checks passed; Python suite: 20 passed, one POSIX-only Windows skip. The shell entrypoint is unavailable locally; its three equivalent Python commands ran directly, with UTF-8 mode for Windows Markdown decoding.

Browser checks: archive shows 88 entries; JavaScript search returns one imported article; unmatched search shows the empty state and keyboard reset restores 88. Blog disclosure opens with the preserved blue surface and portrait. The JavaScript frameworks article contains ten code blocks, real heading destinations, Medium attribution and the original figure credit; JetBrains Mono confirmed. At 390px, wide code scrolls inside its block without document overflow. A Poem of Family retains 17 line breaks and Source Serif 4. Desktop/mobile pages had no overflow; loaded archive images had no failures. Browser/artifact/deployment evidence are distinct; monitoring ingestion is not claimed.

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

Project media delivery uses Astro’s bundled image pipeline to emit responsive WebP derivatives (400/600/800px cards, 600/900/1200px details) while preserving the unmodified generated PNG originals and prompt manifest. No extra package was added. Detail artifact tests require srcset, WebP and a default image below 100kB. This build-time optimization follows [Astro’s image guide](https://docs.astro.build/en/guides/images/).

Deployed review verification: implementation b078727cd497ca240521fcb8ca29fe78f7372392 passed all three GitHub checks. Firebase review version ebda4f918210a33c returned byte-identical local output for 13 project HTML routes and all 60 responsive WebP assets. Browser confirmed JetBrains Mono, three-column archive and SalesDrone detail/back links with loaded WebP artwork. Below-fold cards use lazy loading. Default twelve-card image sources total 262092 bytes. Preview expires 12 November 2026; production remains unchanged.

1.5.1 removes the FinVision exception: project coverage now requires every one of the twelve detail pages to render its confirmed GitHub repository and rejects the unavailable-source fallback. The supplied repository README was reviewed before updating the stack and overview.

## 1.6.0 editorial mosaic / issue #10

Astro check: 37 files, zero diagnostics. Build: 42 pages, 48 responsive WebP variants for twelve new illustrations. All eleven artifact/consent tests pass, preserving source/live links, article routes, poster placement, sitemap and project media coverage. PNG masters remain 1536×1024; texture-rich default WebP images must remain below 300kB (up to 277kB observed), with smaller responsive widths for tiles.

Browser: at 1440×1200 the lead is approximately 782×728, companions 379×352, later wide/narrow pairs approximately 681/480px wide and 540px tall. Read-only rectangle checks found zero overlapping cards and no horizontal overflow; the header has no background image. Keyboard Enter on SalesDrone opens its detail, which shows the complete illustration, live/GitHub links and JetBrains Mono heading on warm white. At 900px the lead spans both columns; no collapsed image region or overflow. At 390×844, twelve cards remain in order, first artwork heights vary (252/335/224px), detail stacks in one column, both external links fit and no horizontal overflow occurs. Captures: ignored qa/local/projects-mosaic-desktop.jpg, projects-mosaic-mobile.jpg and project-editorial-detail.jpg. These are local checks, separate from deployed receipts.

1.6.0 deployed verification: d75dd131945e458ce844fb19d7a8dc80ad09fa3c passed foundation, website and GitGuardian checks. Firebase review b7e0d36376a63193: all thirteen project HTML routes and forty-eight responsive illustrations returned 200 and matched local bytes. Remote browser confirmed differing lead/companion widths, warm-white background, no masthead pattern, loaded editorial artwork and split SalesDrone detail with confirmed source link and no old sidebar. Preview expires 12 November 2026.

## 1.7.0 site artwork and podcasts / issue #11

Type check: 42 source files, zero diagnostics. Static build: 48 pages. Fourteen Node tests pass, including new thirteen-cover uniqueness/PNG/credit/responsive coverage, all five listening routes/resources/statuses and intentionally empty Created page, six full-label portrait menus with no decorative header arrows, and home project artwork. Existing article/list preservation, canonical/sitemap/internal assets, Entertainment poster placement, secret exclusion and consent isolation pass.

Local browser at 1440×1000: first mouse click opens the Blogs panel and loads the recognizable portrait illustration; a second click closes. Arrow Down on Podcasts opens/focuses Listening; Escape closes and returns focus to Explore Podcasts. Header has no chevrons/arrows and no horizontal overflow. Blog archive shows distinct generated covers, and home uses updated article/project imagery. Podcast mosaic renders five cards, with a large lead and stacked companions; corrected compact cover sizing keeps the vinyl label visible. The local strong-friendships route preserves the note, show, status and exact Spotify resource. Created reports zero episode cards.

At 390×844: mobile Menu/Close opens, Escape closes/restores focus; Listening has five sequential cards and no horizontal overflow. The requested Hypermodal article uses its new responsive cover, correct original-art credit and no graph-paper header, without overflow. Captures: ignored qa/local/illustrated-menu.jpg, blog-editorial-covers.jpg and podcast-mosaic.jpg. These local observations remain separate from deployment evidence below.

1.7.0 deployed verification: 43c386cf7717849945e6a1887cf9440af98be79e passed all three GitHub checks. Firebase review 3c655055dc9ec2fa returned byte-identical tested artifacts for all 47 non-404 HTML documents and 57 new responsive blog/menu images. Remote browser confirmed loaded portrait illustration, expanded menu state, no header arrows/overflow, five Listening cards and Created with zero cards. Preview expires 12 November 2026. Original article bodies/Books/Entertainment source files remain preserved.
