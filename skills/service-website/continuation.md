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
