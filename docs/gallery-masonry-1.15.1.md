# Natural masonry gallery — 1.15.1

Issue #48 corrects the photo presentation to match the owner's supplied reference: a continuous vertically browsed masonry grid, with images at their natural proportions. The 1.15.0 horizontal strip was a misinterpretation of that request.

## Presentation and interaction

CSS columns provide three columns above 1100px, two above 600px and one on phones. Tiles keep original image dimensions through width:100% / height:auto and their reserved intrinsic ratio. There are no fixed-height image crops, horizontal scrolling surfaces, strip arrows or duplicate thumbnails. The original six photos, source order, descriptions, alt text, dates and dynamic Firestore publishing path remain unchanged. Varied natural heights supply the informal staggered arrangement; records are not randomly shuffled.

Thin frames, 4px mats, restrained shadows, rounded corners and a small hover index add the journal's own visual treatment. Captions appear over the image on hover/focus and remain visible on phones. Reduced-motion preferences disable decorative transitions. Date links and the mobile date selector jump vertically to the first matching photo. Natural page/keyboard scrolling works without JavaScript.

Click-to-enlarge remains optional. Its separate modal supports previous/next, left/right, Home/End, Escape, captions, image alt text, boundary-disabled controls and focus return. The obsolete carousel offset helper and its test were removed; workspace session regressions remain intact under tests/workspace-session.test.mjs.

## Validation and release impact

Local Chrome checks at 1564/900/640/390/320px show the expected 3/2/2/1/1 columns, all six tiles, no horizontal overflow and zero image-ratio mismatches (1px rounding tolerance). Full-size boundary navigation, Escape/focus return and both palettes pass. Astro check/build and the 40-case site suite pass. Final current-head CI, immutable image/provider receipts, live screenshots and Dynatrace verification are tracked on the issue and linked PR.

This is presentation/client code only: no content, backend API, schema, rules, permissions, secrets, font, brand or template changes. Rollback uses matching private-aware 1.15.0 image/client assets; preserve all content and audit records.
