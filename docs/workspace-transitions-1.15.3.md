# Workspace transitions — 1.15.3

Issue #52 applies the reader's 1.65s diagonal shimmer and 240ms content reveal to the publishing workspace. Initial sign-in restoration animates the existing generic placeholder. Collection switches/refreshes immediately clear stale rows and display six generic table placeholders while the heading, sidebar and filters remain available. Success reveals the table; failure stops the animation, retains the Refresh recovery path and does not show the old collection. Pagination retains existing rows, places the shimmer below them and disables duplicate load-more clicks.

The collection region reports aria-busy and the existing live row-count announces progress. Decorative animations respect reduced-motion CSS and dark mode uses a softer glint. No artificial minimum delay or private snapshots/cache are added. Generation checks and owner-ready guards reject late results after switching, signing out or entering Developer Settings. Editor, autosave, draft recovery and publishing paths are unchanged.

Validation covers the actual transpiled collection loader: stale switch responses, pagination/cursor preservation, error/retry and access/view invalidation. Existing workspace/session tests remain intact. Final check/build/site suite, Chrome generic fixtures, hosted signed-in collection checks, immutable image/client provider receipts and Dynatrace verification are tracked on the linked PR. Private collection content is excluded from screenshots and telemetry bodies. Reduced-motion behavior is implemented in CSS; no runtime emulation claim.

Rollback uses matching private-aware 1.15.2 runtime/client assets, preserving content, drafts, media and audit records. Fonts, masonry, frozen Margin 1.0.0 identity and template 1.9.0 remain unchanged.
