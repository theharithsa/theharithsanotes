# People and Journal

Issue #33 adds two post collections, `journal` and `people`, behind the invitation-only reading room at `/people-and-journal`. The owner chose **people explicitly invited**, not every Google user. The public HTML contains only a generic sign-in view. Post titles, summaries, bodies, dates, tags and illustrations load through authenticated, non-cacheable requests. Nothing from these collections is included in public feeds, sitemaps, taxonomy reconciliation or build snapshots. Browser RUM/Analytics stay disabled throughout the private reading room and workspace.

## Editing and invitations

Write → Journal / People uses the same draft, rich-text editor, cover upload, immutable history, conflict handling, owner preview and explicit Publish workflow. Publishing shares the post with active invited readers. It never changes the audience to public. Private cover uploads must be assigned to their collection; the public blog cannot publish a private image reference.

Workspace → Invited readers (`/admin/invitations`) lets the owner whitelist a verified Google email for 1–365 days (90 by default), renew it or revoke it. No email is sent automatically. Share the reading-room link separately. The owner remains the only editor. Membership is checked on every read and image request, pinned to the first verified Google UID and immediately denied after revocation/expiry. A Google account alone grants no access. The existing owner UID pin is preserved.

## API contract

The existing scoped API now includes `/api/v1/entries/journal` and `/api/v1/entries/people`, with the same item GET/PUT, revisions, restore, Publish and unpublish operations documented in Swagger. Keys require explicit permission for these collections. Existing keys do not acquire access; new-key private collection checkboxes start unchecked. Owner-issued automation keys can access drafts and source metadata according to their selected scopes. Invited readers cannot use the editing API or manage invitations/keys.

Private media uses multipart `POST /api/v1/media` with `section=journal` or `section=people`, `file`, `title` and `alt`. A key needs `media:write` plus that collection. Downloads need `media:read` plus the matching collection; old global media permission alone cannot read private images. Identity hashes include classification, preventing a public upload from colliding with a private copy. Restricted images retain `private,no-store` and `noindex` even after publication. Reader image access additionally requires a current published reference; draft or unpublished images remain owner/API-key-only.

`/api/reading/{journal|people}` and `/{slug}` serve only published summaries/body projections to active invited readers. Raw Notion source metadata is excluded. `/api/reading/session` creates/deletes the secure HttpOnly session used by image requests. Existing owner editing still requires a Bearer token. `/api/cms/members` (GET/POST) and `/{id}` (DELETE) are owner-only and intentionally unavailable to API keys. Invitation changes commit stable audit outbox events atomically; all database/storage/auth operations use the existing OTel and safe payload-summary pipeline. Names, emails, notes and credentials are not exported to telemetry.

## Import and recovery

`scripts/import-private-notion.mts` consumes a private operator directory containing the complete Notion export and a manifest of 54 separately generated illustrations. Neither inputs nor generated private assets belong in Git or build archives. The one-off Markdown tool is pinned to `marked@18.1.3` in that private directory; HTML then passes the application's sanitizer. Source Markdown/properties and hashes stay in owner-only Firestore entry/revision data. Original People image blocks are replaced by the new illustrated covers; source markup is retained for recovery.

The importer requires an explicit approved endpoint/namespace, uses a temporary collection-scoped key, creates deterministic Notion IDs, preserves existing records and revokes its key in `finally`. It records source/body hashes and per-record receipts only in the private directory. Preview uses synthetic fixtures; real personal notes are imported only into live. This is a snapshot import, not automatic ongoing Notion synchronization.

Rollback must preserve memberships, key revocations, source records, immutable revisions, media classifications and pending outbox events. After private imports, roll forward or use a private-aware 1.14+ image. Older images do not enforce private collection permissions on their global media API. Restricted media always retains `published=false`, including after publication, preventing old anonymous image handlers from serving it; never promote it into the public media flag. The Firestore and Storage browser rules remain deny-by-default.

## Editorial presentation

The reading room uses the public Blog masthead, article cards, dated archive, illustration treatment and prose typography. It is a reading page, not the editing workspace. Its collection selector becomes a mobile dropdown. Generic HTML contains no private titles, covers or source metadata; posts load only after invitation validation. Published details use their artistic cover above the same article-body typography as the public blog. Global search includes these posts only for active invited readers.
