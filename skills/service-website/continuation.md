# Hosting storage cap and local archives / issue #90

The owner capped total Hosting storage at 1 GB and asked for archive files to stay in the local `archives/` directory. The live channel keeps the current release. Retire preview channels and obsolete Hosting versions after checking the live version ID and a local rollback bundle. Provider storage usage can lag the deletion. `archives/` is excluded from Git, container builds and Hosting deployment. The legacy dynamic site still depends on Cloud Run and site artwork. Keep the live release available during the Firebase-only migration and review its replacement before changing runtime or artwork routing.

# Hosting download optimization / 1.22.2 / issue #88

The 6 November Hosting total was 13.5 GB. There were no Hosting request logs for the window. Cloud Run recorded about 1.02 GB across both services, including about 669 MB from the 1600 px CMS image route. That is origin evidence only. Responsive CMS artwork now selects the existing variants by rendered size, with gallery enlargement retaining the original URL. The public and private readers generate safe responsive markup without modifying stored content or media access. Hosting caches public artwork for one day. See the [deployment cost policy](../project-deployment/SKILL.md) for attribution and low-bandwidth verification.

# Deployment cost controls / issues #84 and #86

Release 1.22.1 moved to Docker Hub by the original digest. The production and preview Cloud Run services and all seven jobs use that image. The old Artifact Registry repository was removed after the site and access checks passed. The Cloud Build API is disabled. Six legacy source archives were removed from active storage and follow the staging bucket’s seven-day soft-delete retention. Use the [project deployment cost policy](../project-deployment/SKILL.md) for future releases. Firebase Hosting download attribution and optimization are separate work.

# Workspace and editorial design / 1.22.1 / issue #82

The writing surface brings the story above collapsible entry details. Icon groups reuse the existing editor commands and expose pressed states and accessible names. The public site shares a terracotta link accent and uses native customizable select styling when supported. Notebook navigation uses the reading face, Meet Vish cards carry faint editorial art, and each hover menu uses a different supplied portrait as its reference. The review preview uses synthetic content. The owner approved production promotion. PR #83 records release verification.

# Multimedia posts 1.22.0 / issue #80

Shared post-media mapper/sanitizer and Tiptap PostMediaBlock own YouTube/Vimeo/Spotify/native players. Workspace media composer supports replacement; standalone URLs paste as blocks. All post collections expose optional rich stories, preserving structured content. Uploads add MP4/WebM/MP3/M4A/Ogg under 24 MiB, original bytes, same private/published reference checks and range support. Images remain unchanged. Read docs/multimedia-posts.md and the linked PR for limits, tests, rollout and rollback. Invite ready filler removed; status notices have consistent containment. No content migration, new dependency or permission expansion.

# Site-wide classic typography 1.21.1 / issue #78

Owner requested 15% smaller reading text and consistent classic typography on every page. `post-reading.css` owns rem-based 16.15px desktop / 14.45px phone reading and 15.3px desktop notes, based on a 16px browser default; headings stay large. `site-typography.css` applies the classic face to page narratives, collections and navigation while preserving UI/code roles. Meet Vish and Privacy now share post-body styling; private People/Journal and Workspace editor use the same tokens. Source Serif imports are removed; frozen logo/artwork, covers, photo grouping, content and access stay unchanged. See docs/site-typography-1.21.1.md and the linked PR for release evidence.

# Classic post reading 1.21.0 / issue #76

Owner approved design D with E callouts. `post-reading.css` and self-hosted Libre Baskerville own shared post prose; source-sans metadata and mono code/technical labels remain. Blog/GoGs/private detail use full uncropped covers before title. Preserve private three/two-column photo grouping and invitation/session/motion guards. CMS custom wrappers live in `post-blocks.ts`; `post-html.ts` is the shared import/CMS/API sanitizer. No content republish or data migration. See docs/classic-post-reading-1.21.0.md; final provider and tenant evidence belongs on the linked PR.

# Compact private reader 1.20.1 / issue #74

Invitation-only reading uses compact title/cover/prose sizing. Consecutive top-level figures share three desktop or two phone columns, preserving natural proportions and alt text; prose interrupts each run. Public Blog styles, content contracts and access stay unchanged. See docs/compact-private-reader-1.20.1.md and the linked PR for evidence. Private content edits remain outside source and release archives; rollback uses matching 1.20.0 assets.

# Editorial layout polish 1.20.0 / issue #72

FilterPanel wraps public Blog/Books/Projects/Entertainment/Podcast browsing; filter-panels.ts keeps desktop open and mobile initially collapsed, with native disclosure semantics. Blog archive dates now live inside this panel. Controls use the shared 8px shape. Meet Vish uses a 24px heading gap, 200px signature with printed name and no Life in between teaser; preserve the biography and gallery route. Blog-only opening prose drop caps are CSS presentation, not content writes. See docs/editorial-layout-1.20.0.md and issue/PR provider evidence. Rollback uses matching 1.19.3 runtime/client assets.

# Books browsing controls 1.19.3 / issue #70

Replace the genre button cards with #book-genre-filter beside My rating in a compact desktop row and stacked mobile layout, using Blog's control styling. Preserve genre/rating combinations, counts and empty state; page-motion reveals the book grid for both selectors. See docs/books-filters-1.19.3.md and the linked PR for validation and provider receipts. No content or backend changes; preserve the 1.19.2 biography/signature work.

# Signature placement correction 1.19.2 / issue #67

The signature belongs directly beneath the biography text/closing quote inside personal-statement, before interest links. Remove the former page-end placement. Reuse the same transparent asset and dark-mode treatment; no CMS/API/data or dependency changes. Check adjacency, single instance, desktop/mobile layout and unchanged alpha. Roll back to the prior runtime/Hosting if required.

# Meet Vish signature

Issue #67 / 1.19.1 adds the transparent signature below all Meet Vish content, before the shared footer. Original paper photograph is not committed. The 1200 x 478 lossless WebP has genuine alpha, max rendered width 340px, and a dark-mode ink-only filter. No CMS revision changes.

# Independent personal portraits

Issue #63 / 1.19.0 adds optional Home portraitImage/portraitImageAlt and a square, uncropped frame. Home falls back to Meet Vish’s image for existing entries. Do not change Home.image to update its personal portrait: that field owns the illustrated main hero. Meet Vish approved watercolor was published at revision 6; its rich biography needs the full-detail loader shipped in 1.18.1.

# Full page body correction

Issue #63 / 1.18.1: public list projections intentionally remove html. getJournalPage must use publishedDetail to read the immutable body; do not return getPages summaries for full page rendering. CMS revision 5 already contains the approved formatted story and portrait; no second publication is needed.

# Profile presentation continuation

Issue #63 / app 1.18.0 adds optional sanitized pages.html and imageAlt. Only Meet Vish exposes the rich editor; edits synchronize legacy paragraphs. Both personal portraits read Meet Vish image/alt. CMS publication remains a separate guarded step after deployment. See docs/profile-illustration.md for provenance.

# Workspace/API continuation

## Search overlay and Blog controls 1.17.0 — issues #60–61

The header opens one native search dialog on the current page. SearchSession owns debounced/abortable/latest-only requests, and the controller owns focus, close/cleanup, private-result masking and snapshot opt-out. /search is a compatibility entry that opens the same dialog. Blog tags are a native selector below the masthead, combining with topics and the timeline. See docs/search-overlay-1.17.0.md and the linked PR for final provider/browser/tenant evidence. Preserve invitation checks, draft/editor state, footer/brand and unrelated owner files.

## Meet Vish readability 1.16.2 — issue #57

Meet Vish uses one continuous 68ch reading column, consistent paragraph spacing and responsive 17–18px body text. A personal heading replaces the old work-led section heading. Published CMS biography, image, gallery, navigation and access remain unchanged. See docs/meet-vish-readability-1.16.2.md for scope and verification; final release receipts belong on the linked PR.

## Public motion and social footer 1.16.1 — issues #54–55

Public documents opt into native page fades with a pending shimmer and immediate cancellable filter reveals. Private, preview and mixed search destinations remain excluded from snapshots; reader/workspace motion stays intact. Footer profiles live in src/data/social.ts; DirectoryBadge uses the unchanged owner-provided black/white SVGs from assets/smm/wedirectory. See docs/site-motion-footer-1.16.1.md and the linked PR for final provider/browser/tenant evidence. Preserve unrelated owner assets/output.

## Workspace transitions 1.15.3 — issue #52

Initial restoration and collection fetches use generic table shimmer; current results reveal smoothly. Non-append fetches clear stale rows; pagination preserves existing rows and shows its skeleton below the table. Generation and owner-ready guards prevent stale/private results from reappearing. See docs/workspace-transitions-1.15.3.md and the linked PR for release evidence. No editor/draft, API, data, access or brand changes.

## Reader transitions 1.15.2 — issue #50

People/Journal use generic animated skeletons and a short reveal, with in-place collection navigation and URL-only history. Every switch reauthorizes data; sign-out and denial clear private content. See docs/reader-transitions-1.15.2.md and the linked PR for final provider, browser and tenant receipts. Preserve invitation checks, private media, natural masonry, fonts and frozen identity/template.

## Natural masonry gallery 1.15.1 — issue #48

Photos now use a continuous vertical masonry grid, matching the owner’s supplied screenshot. Three/two/one columns preserve natural image heights, with thin frames and soft shadows. Horizontal strip controls/geometry are removed; date jumps and optional accessible full-size viewing remain. See docs/gallery-masonry-1.15.1.md and the linked issue/PR for final build/provider/Chrome/tenant receipts. Source Sans 3, workspace/session behavior, original photos, data and frozen brand/template remain unchanged.

## Workspace/type/gallery 1.15.0 — issues #44–46

Workspace and Invitations now use explicit auth restoration states and stale-response guards; body/prose use self-hosted Source Sans 3; Gallery is a tightly packed natural-proportion carousel with real tile-offset navigation. See docs/workspace-typography-gallery-1.15.0.md and the linked PR/issues for final release/provider/Chrome/tenant receipts. Preserve owner draft recovery, original photographs, invitation checks, private-aware rollback, Margin 1.0.0 and template 1.9.0.

## Reader session restoration 1.14.3 — issue #42

PR #43 fixes the signed-in gate flash using explicit pending/ready/signed-out/denied/error states, parallel session/post requests and stale-response guards. Seven asynchronous client regressions and local Astro checks/build pass; application source e831e3b07ad58ca2beaabbe66d6f632c3293bc8f has passing CI and a successful immutable build. See docs/reader-session-1.14.3.md for the contract and PR #43 for final preview/live/provider/browser/tenant evidence and release status. Invitation checks, no-store, private media, content and brand remain unchanged; rollback must remain private-aware.

## Homepage margins patch 1.14.2 — issue #40

PR #41 gives homepage project copy responsive 20–36px insets, preserving full-bleed illustrations and the asymmetric grid. Source c58526f0bd01d8b3f727c3fae8287001771a685e is live on both channels; 503 client hashes match per channel, Chrome desktop/mobile checks and current code-head CI passed. See docs/project-card-margins-1.14.2.md for provider/runtime evidence. No content, API, data, invitations, brand or template changes. Preserve private-aware rollback targets.

## Reader audit patch 1.14.1 — issues #36, #38 and #39

All 51 current Notion journals and 3 People posts remain published. Every post/body/illustration was opened in Chrome; source hashes and anonymous image denials were reconfirmed. The 1.14.1 patch reserves private cover space (measured shift reduced from 223.616px to 0), constrains Entertainment artwork/grids and fits tablet Books labels. The live 30-case responsive sweep passed. Application source is 1c5a7a4ebc4075a29d5ce8d04ff6c9ca95b9eaad; see docs/reader-ui-audit-1.14.1.md and PR #37 for immutable image/provider/UI/tenant evidence. Seven obsolete pre-1.14 zero-traffic tags were retired after verifying both active Hosting channels; current and private-aware rollback routes/revision history were preserved. Never recreate unsupported pre-private routes. Data, invitations, original art and ratings were preserved.

## Release 1.14.0 — issues #33 and #35

The owner has now explicitly authorized theharithsanotes.com as primary and theharithsa.com redirects. This supersedes the historical no-extra-domain restriction below. Preserve the frozen Margin identity and existing owner content. Journal and People are invitation-only posts; only the owner can whitelist readers. Read docs/people-journal.md before modifying access, media, API scopes or import behavior. Private Notion inputs and all 54 cover assets are outside the repository in the local private import directory; never include them in Git, public build assets or telemetry. Update final provider/runtime evidence after release; implementation, local tests and production verification are separate states.

Issue #30: the 1.13.0 content API and refreshed workspace were merged in PR #31 and deployed. See docs/content-api.md for contracts and docs/workspace-api-release.md for actual source/provider/test/tenant receipts. The current 1.13.1 patch only fixes sidebar overflow, mobile icon visibility and sign-out wrapping found during browser review. Its final deployment evidence is recorded on the linked issue; inspect the current release/PR before further work.

Write contains all collection tables; Developer Settings manages scoped expiring/revocable keys shown once. `/api/v1` shares CMS validation/revisions/publishing/media code; `/admin/api` serves self-hosted Swagger and `/api/openapi.json` the real schema. Keys cannot manage keys. No permanent key was generated for the owner automatically. MCP remains deferred.

Catalog reconciliation succeeded in both namespaces and preserves owner edits: ten core pages, 23 published labels plus one retained private label. Existing owner drafts, article bodies, ratings, routes and art were preserved. Section metadata/intros now read published page records. Sync only adds missing rows and does not rename historical labels.

Validated 26 Node tests, nine CMS/schema/emulator checks, current-head/main CI, all 173 production routes, 263 owned images and 500 exact client hashes. A real preview-only job exercised draft/conflict/scopes/upload/private download/revocation and removed its synthetic content/image fixtures. Chrome’s existing owner session loaded Write, Pages, Tags and Developer Settings. No browser key was generated. Native Dynatrace API span, key events and provider/job receipts were verified; raw tokens and bodies are excluded. Preserve dtctl default airtel; query this app explicitly with my-env.

Apply any remaining final patch checks/deployment from its immutable checked artifact. Do not reset drafts, media, revocations or audit records when rolling back. Preserve Margin identity 1.0.0 and theharithsa.com. No DNS work or extra domain is authorized or needed here.

Issue #35 adds contained Blog tags, shared mobile category dropdowns and `/search` backed by `/api/search/query`. Read docs/browsing-and-themes.md before changing search. Restricted indexes are request-local, reauthorize each search, and never enter public caches. The reading room uses Blog masthead/cards/archive/prose. Local Chrome checks verified 320px containment, desktop tag alignment, working category selections and cross-section search. Update final hosted evidence after release.

Production 1.14.0 is deployed from a3c5443ef1ecfd61d965acd1ca4f689839bb11ee. All 51 Journal and 3 People records, source hashes and 54 distinct private illustrations were verified; all private image requests deny anonymous access. Fresh primary-domain Google sign-in, both reading collections/details, mobile selection, dark mode, search and sign-out were verified in Chrome. Old-domain/www redirects preserve paths and queries. See docs/people-journal-release.md for exact image, Hosting/Run/build and tenant evidence. This supersedes the historical old-domain/extra-domain restrictions below. Preserve invitation-only access; no reader was automatically invited.
