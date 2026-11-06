# People and Journal release — 1.14.0

Verified on 2026-11-06. Issues #33 and #35; PR #34. The deployed application source is `a3c5443ef1ecfd61d965acd1ca4f689839bb11ee`; later release-record commits change documentation/continuation only.

## Provider receipts

- Cloud Build `4a86a899-53e8-4a61-bad8-55cc42e34759`: SUCCESS for that exact source revision.
- Immutable image: `us-east1-docker.pkg.dev/the-harithsa-notes-94/harithsa-journal/web@sha256:b9150a82bb25269c5807f9ebc1154de691cc69c37e465417365e66f48d4b1c62`.
- The extracted client layer SHA and OCI source label were verified; all 503 served client files matched their exact hashes on preview and production.
- Preview: Cloud Run `harithsa-journal-preview-00010-hb8`, Hosting version `6dddd58ec7b6b197`.
- Production: Cloud Run `harithsa-journal-00008-dds`, Hosting version `93135c80a14b5cd9`, released at `2026-11-06T05:56:27.891Z`.
- All four apex/www domains have active certificates. Nine live redirect checks confirmed that the old apex/www and new www return 301 to the primary apex, preserving deep paths and query strings. Primary HTTPS serves the site directly.

## Data and access verification

The protected live API imported all 54 complete Notion source records: 51 Journal and 3 People posts, each with a distinct generated illustration. All 54 source Markdown hashes and stored source bodies matched their private inputs. Published projections contain no source metadata. All 54 image records retain their private classification and `published=false`; anonymous image requests returned 404. Anonymous post HTML stayed generic, no-store and noindex. The temporary import key was revoked in `finally`. No reader was invited automatically.

The real preview verification execution `harithsa-private-verification33-hlk26` succeeded. It checked draft/publication, section-scoped image access, public-key denials, anonymous reader denials, public HTML/feed/taxonomy exclusion, anonymous/invalid/public-key search exclusion and key revocation. Its isolated synthetic posts/images were removed; revocations and audit history remain.

Original public content checks passed for 173 pages, 263 images and all 88 original article bodies. The 50 read books and their personal ratings/reviews remain intact. Swagger validates 68 paths and 91 unique operations, with protected-route anonymous denials verified independently.

## Browser and test evidence

Chrome completed a fresh owner Google sign-in on the primary domain. The Journal archive displayed all 51 cards; People displayed all 3 cards. Journal and People detail pages loaded their private illustrations and complete prose with the same serif reading typography as Blog, without workspace controls. Mobile People detail retained the correct collection selection, loaded its illustration, and had no horizontal overflow at 390px. Dark mode changed both the palette and theme-colour. Sign-out cleared all private cards/body text, restored the gate and removed private search access.

Local/hosted browser checks also exercised Blog tag/topic dropdowns, book genres, project topics, Entertainment types, Podcast collections, desktop tag containment, cross-collection global search and authenticated private search. The 320px sign-in wall was contained. Viewport overrides and the previous colour preference were restored. The saved release screenshot shows only the generic public sign-in wall; private notes and images were not captured in evidence artifacts. Emulation does not certify physical Android/iOS browser rendering.

Validation: 26 site/brand/content/OTLP tests and 11 CMS/schema/emulator tests passed; Astro check had zero errors/warnings (two existing deprecated-helper hints); static and server builds passed. Required GitHub checks passed on the deployed source. The final release-record head must also pass current-head checks before merge.

## Dynatrace evidence and recovery

Tenant queries confirmed 51 distinct live Journal publication events and 3 distinct live People publication events for 1.14.0. Database/HTTP events, provider-confirmed deployment/build events and native SERVER API/media spans were also searchable. Native spans carry the actual deployed source revision. Request/response observation uses bounded sizes, hashes and field names; raw notes, query text, credentials and emails are excluded. Browser analytics/RUM is disabled on the reading room and search page.

Private input files, illustrations and per-record receipts remain outside the repository. Only safe aggregate verification/provider receipts are retained under ignored `qa/local`. This was a snapshot import; ongoing editing/publishing uses the CMS/API, not automatic Notion synchronization.

After this import, rollback must use private-aware 1.14+ code. Preserve private media classifications, source entries, immutable revisions, memberships, revoked keys and outbox state. Older global media-key handlers do not enforce the new collection classification. See [People and Journal](people-journal.md) and [browsing/search contracts](browsing-and-themes.md).
