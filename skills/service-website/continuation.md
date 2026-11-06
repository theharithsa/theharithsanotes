# Workspace/API continuation

Issue #30: the 1.13.0 content API and refreshed workspace were merged in PR #31 and deployed. See docs/content-api.md for contracts and docs/workspace-api-release.md for actual source/provider/test/tenant receipts. The current 1.13.1 patch only fixes sidebar overflow, mobile icon visibility and sign-out wrapping found during browser review. Its final deployment evidence is recorded on the linked issue; inspect the current release/PR before further work.

Write contains all collection tables; Developer Settings manages scoped expiring/revocable keys shown once. `/api/v1` shares CMS validation/revisions/publishing/media code; `/admin/api` serves self-hosted Swagger and `/api/openapi.json` the real schema. Keys cannot manage keys. No permanent key was generated for the owner automatically. MCP remains deferred.

Catalog reconciliation succeeded in both namespaces and preserves owner edits: ten core pages, 23 published labels plus one retained private label. Existing owner drafts, article bodies, ratings, routes and art were preserved. Section metadata/intros now read published page records. Sync only adds missing rows and does not rename historical labels.

Validated 26 Node tests, nine CMS/schema/emulator checks, current-head/main CI, all 173 production routes, 263 owned images and 500 exact client hashes. A real preview-only job exercised draft/conflict/scopes/upload/private download/revocation and removed its synthetic content/image fixtures. Chrome’s existing owner session loaded Write, Pages, Tags and Developer Settings. No browser key was generated. Native Dynatrace API span, key events and provider/job receipts were verified; raw tokens and bodies are excluded. Preserve dtctl default airtel; query this app explicitly with my-env.

Apply any remaining final patch checks/deployment from its immutable checked artifact. Do not reset drafts, media, revocations or audit records when rolling back. Preserve Margin identity 1.0.0 and theharithsa.com. No DNS work or extra domain is authorized or needed here.
