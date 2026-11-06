# Reader UI audit and patch release — 1.14.1

Issues #36, #38 and #39; PR #37. Verified on 2026-11-06 in Chrome. Private content was not changed or republished.

## Complete journal and reader audit

Notion's current Journal data source contains 51 active entries. All 51 are published in production, alongside all 3 People posts. A fresh integrity pass matched all 54 source bodies/hashes and confirmed all 54 private illustrations deny anonymous requests. The browser opened every one of those 54 posts at 390px: full text and illustrations loaded, with no unsafe links or workspace/editor controls. The three longest journals also passed desktop reading checks; Back returned the full 51-card archive.

The live patch still displays 51 Journal and 3 People cards. Collection switching, Google sign-in, dark/light mode and page theme-colour worked. Sign-out cleared private cards/body text, restored the gate, removed private search results and gated a direct private-post URL. The browser's test viewports and previous light theme were restored. Screenshot evidence contains only the generic sign-in wall, not personal notes or illustrations. These are Chrome viewport tests, not physical-device certification.

## Issues corrected

- Private cover loading moved the reading body by `223.616px` at 390px. The cover now reserves its `3 / 2` area with the current section colour. Live before/after-loading samples measured `0px` movement, with the illustration loaded successfully.
- Entertainment's artwork and automatic grid minimums overflowed at phone/tablet widths. Grid tracks/items and artwork are now constrained to their available width.
- A decorative Books label extended a 753px tablet layout to 758px. The intermediate-width label size now fits while preserving phone and desktop treatments.

The final production sweep passed all ten main public routes at 320/768/1280px: 30 checks, zero horizontal overflow against `documentElement.clientWidth` (excluding the vertical scrollbar gutter, with 1px rounding tolerance). Entertainment and Books also passed the deployed-preview checks at 320/390/768/1280px; the local Books hero passed eight breakpoint widths.

Functional checks passed for book genre/rating/reset (6 science books, 2 five-star matches, reset to 50), Project topics (3 AI/tools projects), Blog tags (14 Observability articles), Podcast Created navigation, all seven keyboard-operated header menus, and gallery next/keyboard/lightbox/Escape interactions. All existing content, ratings, artwork, posters and routes remain intact.

## Release and route retirement

Application source: `1c5a7a4ebc4075a29d5ce8d04ff6c9ca95b9eaad`. Subsequent release-record changes affect documentation/metadata only.

- Cloud Build `7ec286b6-b1e0-427c-beaf-adafe5b39160`: SUCCESS.
- Image: `us-east1-docker.pkg.dev/the-harithsa-notes-94/harithsa-journal/web@sha256:ae5799f2c6216ca5c76c26b73fe3b9aa27a048f180073bf75f8fe06b674769ee`.
- Verified OCI source label/client-layer digest and all 503 served client file hashes on preview and production.
- Preview: Run `harithsa-journal-preview-00012-rw5`, Hosting `4471d7c33850e764`.
- Production: Run `harithsa-journal-00009-vhf`, Hosting `8639523c2a9c0a96`.
- Current-head code CI passed; Swagger still validates 68 paths/91 operations and anonymous/invalid-cookie denials.

Release verification also found seven zero-traffic pre-1.14 tagged routes still serving older handlers. Both active Hosting channels were confirmed to use private-aware releases before removing those tags. All seven retired URLs now return 404; both current channel health endpoints still report 1.14.1. Revision history, current traffic, private-aware rollback tags, content and memberships were preserved. Do not recreate pre-1.14 routes or roll back to those unsupported handlers after the private import.

Provider-confirmed build/Hosting/Run/route-retirement outcomes and the observed browser audit have durable Dynatrace events. Native SERVER spans from the exact application source, 1.14.1 logs and HTTP metrics were queried separately. The delivery queue is drained and checked as part of release closure; queue state is time-specific, not a promise that a live site never creates new events. Raw content, search terms, tokens and emails are excluded from telemetry and evidence. Safe aggregate/provider receipts remain in ignored `qa/local`.

See [the original private import release](people-journal-release.md) and [reader/API/privacy contracts](people-journal.md). Roll back only to private-aware 1.14+ releases and preserve all data, classifications, invitations, key revocations and outbox history.
