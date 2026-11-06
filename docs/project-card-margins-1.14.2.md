# Homepage project card margins — 1.14.2

Issue #40; PR #41. The category, title and description previously touched the beige card edges. A dedicated copy panel now provides matching responsive insets: 20px minimum, 2.5vw fluid spacing, 36px maximum. The final paragraph has no extra trailing margin. Illustrations remain full bleed, the 1.4:1 desktop grid stays asymmetric, and cards still stack on phones.

## Impact and validation

Only homepage markup/styles and application version metadata change. No API, content, database, storage, permissions, secrets, brand or template changes are required. Existing dark-mode surface/text colours are preserved. Rollback uses the previous private-aware 1.14.1 image and its matching Hosting client assets; do not restore pre-1.14 handlers.

Local Astro check and build passed. Chrome checks at 2360, 1280, 768, 390 and 320px found matching left/right insets and no horizontal page overflow. Phone paragraphs fit their content widths; dark-mode colours and spacing were checked. These are browser viewport checks, not physical-device certification.

Application source: `c58526f0bd01d8b3f727c3fae8287001771a685e`. Provider verification completed on 2026-11-06:

- Cloud Build `68ab2da5-aaca-4950-9576-17542a00cbb2`: SUCCESS.
- Image `sha256:f2215472ba18ed803a61a108afbcdc4ef178f72ac073d09632b5ff655d26d786`.
- Preview revision `harithsa-journal-preview-00013-j8s`, Hosting `7288ebe33c3b2579`.
- Live revision `harithsa-journal-00010-s85`, Hosting `f49c21afab90885a`.
- All 503 client file hashes match the immutable image on both channels; health reports 1.14.2. Anonymous/invalid-auth requests retain 401/no-store and the Google auth iframe remains available.
- Live Chrome desktop screenshot and 320/390px checks confirm the insets and contained text. Existing public artwork and navigation remain intact.
- Source-confirmed build, runtime and Hosting events were queued through the existing durable audit path. Dynatrace SERVER spans from this exact source/version are searchable, including homepage and auth-denial routes. Browser analytics consent/privacy behavior is unchanged.

Application code was frozen at the source above; subsequent release-record changes are documentation only.
