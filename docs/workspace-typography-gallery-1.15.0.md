# Workspace, body type and photo carousel — 1.15.0

Tracks issues #44, #45 and #46. Final release, provider, runtime and browser receipts are recorded on those issues and their linked PR; this document describes the implementation and verification scope.

## Workspace restoration

Workspace and Invited readers start with a neutral pending view; the sign-in gate appears only after Firebase confirms a signed-out/denied identity. The shared restoration controller waits for owner verification and initial catalog/collection data, distinguishes retryable failures and invalidates obsolete completions. Owner/session validation and initial table/label loading run concurrently where independent. Existing API responses are checked against both the active identity and restoration version before consumers receive them. Back/forward restores revalidate access. Pagehide closes private views, clears transient DOM and preserves unsaved editor recovery copies under the original owner UID. Sign-out waits for already-started cookie creation before deleting the session. Owner checks, token revocation, drafts and publish semantics remain unchanged.

Eight targeted regressions cover pending auth, signed-out state, late completions, account changes, denied versus temporary failures, delayed catalog initialization and variable-width carousel offsets. The previous production workspace gate flash was reproduced in Chrome before release. Local responsive checks passed seven routes at 1280/768/320px with no horizontal overflow.

## Typography

Source Sans 3 Variable 5.3.1 is pinned and self-hosted, including true italics. It replaces Public Sans for body/controls and Source Serif for prose paragraphs, including the writing editor. Technical prose uses the same sans body (21px desktop, 19px mobile); headings, code/preformatted content, project technical treatments and the frozen Margin logo retain their deliberate serif/monospace identity. No remote font service or consent change.

## Photo browsing

All original photos remain in order with natural proportions. A dense horizontal strip shows multiple photos, with 8px gaps (6px on phones), responsive 200–330px photo height and variable widths. Captions appear as unobtrusive overlays; the duplicate thumbnail strip and full-width slide framing are removed. Arrow controls, touch/trackpad scrolling, left/right and Home/End keys, chronological rail/mobile date dropdown and click-to-enlarge remain. Navigation uses real tile offsets and the actual scroll bound, including the last photo; resizing keeps the current selection. Full-size lightbox retains captions and Escape/focus handling. The gallery remains functional through native scrolling without JavaScript. No autoplay, rewritten photographs or fabricated dates.

## Release impact

Presentation/client changes and one pinned font package swap only. No backend API/schema/index/rule/data/secret/permission migrations. Existing private media classification, RUM consent, private-route analytics exclusions and durable provider/runtime telemetry are retained. Rollback uses the matching private-aware 1.14.3 image/client pair; do not restore pre-1.14 handlers. Template 1.9.0 and Margin brand 1.0.0 stay frozen.
