# Changelog

## 1.19.2 — 2026-11-06

- Move the signature directly beneath the Meet Vish biography’s closing quote, before the interest links and gallery.

## 1.19.1 — 2026-11-06

- Add Vish’s processed handwritten signature as a transparent, responsive sign-off at the end of Meet Vish, with dark-mode ink contrast.

## 1.19.0 — 2026-11-06

- Give Home its own editable ink-and-wash portrait, separate from the Meet Vish watercolor.
- Use an uncropped square portrait frame across desktop and mobile.

## 1.18.1 — 2026-11-06

- Read core page bodies from the complete published revision so rich biography formatting survives the public summary projection.

## 1.18.0 — 2026-11-06

- Preserve Meet Vish links, emphasis and closing quotations through sanitized, CMS-editable rich text.
- Share a smiling casual portrait illustration between Meet Vish and the home page’s personal section, with editable alt text.

## [1.17.0] — 2026-11-06

- Move Blog tags out of the masthead into a compact labeled selector beside article browsing (#60).
- Open global search in a blurred, animated dialog with live suggestions, section scope and keyboard navigation (#61).
- Clear query/private-result state on close or navigation and exclude open search from page snapshots and replay capture.

## [1.16.2] — 2026-11-06

- Present the Meet Vish biography as one continuous reading column with comfortable line length and paragraph spacing at every screen size (#57).
- Lead the biography section with a personal heading rather than the previous work-focused introduction.

## [1.16.1] — 2026-11-06

- Add public page fades, native-navigation shimmer and cancellable Blog/Books/Projects/Entertainment filter reveals (#54).
- Add a compact illustrated social footer with low-opacity brush strokes and the supplied monochrome WeDirectory badges from the footer and Meet Vish (#55).

## [1.15.3] — 2026-11-06

- Add Workspace table shimmer and smooth row reveals during authentication, collection switches and refreshes (#52).
- Clear stale collection rows, preserve pagination rows and respect dark/reduced-motion preferences.

## [1.15.2] — 2026-11-06

- Add animated card skeletons and a short content reveal to People and Journal, with dark and reduced-motion support (#50).
- Switch collections in place while retaining navigation, revalidating access and ignoring stale responses.

## [1.15.1] — 2026-11-06

- Correct Photos to a continuous vertical masonry grid with natural image heights, responsive columns, subtle frames and soft shadows (#48).
- Remove sideways carousel controls while keeping date links and accessible full-size viewing.

## [1.15.0] — 2026-11-06

- Restore Workspace and Invitations through explicit loading/access/error states, with stale-response guards and draft recovery preserved (#44).
- Use self-hosted Source Sans 3 for body and prose text, retaining the frozen logo, serif headings and code typography (#45).
- Replace the gallery slideshow with a dense, natural-proportion photo carousel and variable-width keyboard/scroll navigation (#46).

## [1.14.3] — 2026-11-06

- Restore People and Journal sessions through a neutral loading state instead of flashing sign-in; load session and posts concurrently and guard navigation/sign-out races (#42).
- Keep temporary reading failures retryable and preserve invitation checks and private caching boundaries.

## [1.14.2] — 2026-11-06

- Give homepage project cards responsive inner text margins while preserving full-bleed illustrations and the asymmetric grid (#40).

## [1.14.1] — 2026-11-06

- Reserve the private article cover area while its illustration loads, preventing the reading body from jumping (#36).
- Keep Entertainment artwork/cards and tablet bookshelf labels inside the page width (#38).

## [1.14.0] — 2026-11-06

- Adopt theharithsanotes.com as the primary domain, preserving old-domain paths through redirects.
- Add invitation-only People and Journal posts, owner-managed expiring invitations, private illustrated media, CMS editing and collection-scoped APIs.
- Keep private content out of public caches, public search, browser analytics, public taxonomy and build inputs; include private search matches only for active invited readers.
- Contain Blog tags, use mobile category dropdowns, and add one global search across published pages and posts (#35).
- Use the public Blog editorial layout for People and Journal.
- Fix API-reference button hover/focus contrast.

## [1.13.1] — 2026-11-06

- Prevent horizontal sidebar overflow, retain the real site icon on narrow screens, and keep Sign out on one line.

## [1.13.0] — 2026-11-06

- Refresh the workspace with the frozen site icon, ink sidebar, clearer Write navigation, collection counts and a separate Developer Settings area.
- Add scoped, expiring, revocable API keys and the versioned content/media API with a self-hosted Swagger explorer and OpenAPI 3.1 schemas.
- Reconcile existing labels and all ten core page records without replacing owner edits; section introductions now read published page content.
- Audit key creation/revocation and API operations through the existing transactional outbox and OpenTelemetry pipeline; exclude credentials from logs/events.

## [1.12.0] — 2026-11-06

- Add the owner-only Notion-style CMS with collection tables, rich editing, private autosave, publication, revision history, preview and metadata-stripped media uploads.
- Move public content reads to Firestore and private Cloud Storage behind Cloud Run/Firebase Hosting; preserve canonical URLs, original bodies, book ratings/reviews and Margin identity.
- Add blog date navigation/tag filtering and a dated, accessible photo carousel.
- Add server OpenTelemetry, transactional publication BizEvents, a scheduled durable audit outbox, safe Firebase payload summaries and trusted OIDC workflow/test reporting.
- Keep browser analytics disabled in the private workspace and previews; add INR500 budget alerts at 50/80/100%.

## [1.11.0] — 2026-11-06

- Freeze the owner-selected Margin identity with original bookmark h and outlined editorial lettering; replace header/footer wordmarks in both themes.
- Add full/vertical/monochrome logos, profile images, optical favicons, app/maskable/Apple icons, a social card, manifest and downloadable brand kit.
- Preserve reproducible vector sources, font licensing and asset hashes; remove Racing Sans One.

## [1.10.0] — 2026-11-06

- Simplified Books to the 50 confirmed read titles and eight genre groups, preserving original ratings/reviews and combined search/rating browsing.
- Added four Projects topic filters with adaptive layouts and live counts.
- Added Games and Gadget (GoGs), a seventh illustrated header disclosure and an empty future journal.
- Added an animated accessible dark-mode toggle, system defaults, local persistence and page-specific light/dark browser colours.
- Improved section descriptions, social previews, canonical aliases, sitemap/404 indexing and accurate article/book structured data.

## [1.9.0] — 2026-11-05

- Added 75 original Medium articles, preserving original dates, writing, code, poetry, captions and 151 body images; linked eight duplicate publications to existing canonical articles.
- Added distinct illustrated covers in the current editorial style, responsive image delivery and migration provenance.
- Renamed the header and journal title to Blog, retaining existing routes and integrating all articles into search, feeds and sitemap.

## [1.8.0] — 2026-11-05

- Imported the owner-confirmed 50-book Goodreads Read shelf with 50 personal ratings and 46 original reviews; preserved five non-overlapping books from the existing shelf.
- Added individual reading journal pages, original Goodreads links, recorded completion dates, accessible ratings, title/author search and combined shelf/rating filters.
- Preserved the typographic book-jacket design and adapted long titles for mobile screens.

## [1.7.1] — 2026-11-05

- Restored the original section-specific header menu colours and matching hover/open button highlights after the illustrated menu refinement unintentionally made all panels off-white.

## [1.7.0] — 2026-11-05

- Added thirteen original topic-specific blog covers with responsive delivery across articles, archive, related cards and home; source article bodies and prior media provenance remain unchanged.
- Added six section-specific portrait illustrations from the owner-authorized studio photo. Header menus now use full-label box highlights and animated disclosures without chevrons or decorative arrows.
- Added a project-style Listening mosaic and five local podcast-note pages, preserving notes/statuses and external episode links. Created has its own intentionally empty page.
- Reused approved project artwork in home features; Books and Entertainment artwork/treatments remain intact.
- Added artwork, podcast journey and navigation artifact coverage, plus responsive/keyboard browser verification.

## [1.6.0] — 2026-11-05

- Redesigned Projects as an asymmetric editorial mosaic: a large lead, stacked companions and alternating wide/narrow project tiles.
- Replaced green graph-paper surfaces and the detail sidebar with warm paper, ink, coral accents and split illustration/introduction layouts.
- Generated twelve original ink-and-paper editorial scenes, with human stories and project-specific subjects; kept responsive WebP delivery and exact prompts.
- Preserved technical mono typography, all twelve researched detail routes, project anchors and confirmed live/source links.

## [1.5.1] — 2026-11-05

- Added the owner-supplied spmsuhas/finvision-ai repository to FinVision’s detail page and updated its overview/stack from the repository README.
- Require a confirmed source link for all twelve projects and remove the unavailable-repository fallback.

## [1.5.0] — 2026-11-05

- Rebuilt Projects as one uniform twelve-card grid, with the technical journal’s JetBrains Mono typography, grid header and restrained hover treatment.
- Added twelve local project detail routes with researched overviews, four capabilities, stack labels, project/documentation links and confirmed repositories. FinVision’s source repository remains unconfirmed; its live site is linked.
- Generated twelve separate, subject-specific conceptual covers using the built-in image tool; preserved prompts and source research metadata.
- Updated navigation, sitemap and project journey regression coverage; preserved existing project anchors and all article paths.

## [1.4.0] — 2026-11-05

- Restored illustrated Entertainment covers; real posters remain inside opened reflections, with official links retained.
- Added the complete “the harithsa notes” wordmark with Racing Sans One, a cursive “the” and original speed-line accents.
- Added JetBrains Mono to technical article typography, technical cards, code blocks and open-source projects, with restrained grid, terminal and hover effects.
- Self-hosted exact font versions with preserved OFL notices and updated poster-placement regression coverage.

## [1.3.1] — 2026-11-05

- Added five verified promotional posters and official title-page links to Entertainment and every screen-note page.
- Preserved complete artwork with contain sizing, local image delivery, source credits, accessible external links and an image-load fallback.
- Added poster/source validation to existing screen-note artifact coverage and recorded media provenance.

## [1.3.0] — 2026-11-05

- Expanded Entertainment with five edited Notion-sourced screen reflections: Subservience, Made in Korea, War Machine, The Taj Story, and Oh My Ghost Clients.
- Added individual reading pages, lesson callouts, original abstract artwork, movie/series filters, menu links and sitemap entries. Kept the longer Senna essay.
- Preserved the shortened series title in a visible editorial note and linked the broadcaster synopsis used to identify it. Unrelated journal details and private Notion URLs are excluded.

## [1.2.0] — 2026-11-05

- Rebuilt Home, Blogs, Books, Podcasts, Projects, Entertainment and Meet Vish around a Gates Notes browser reference study.
- Replaced the legacy CSS cascade with one responsive design system, wide section menus, native lists, keyboard disclosures and a selective home page.
- Added a twelve-book shelf and five deduplicated listening entries from the owner-authorized Notion reading/podcast logs; statuses preserved and private links excluded.
- Kept all thirteen article bodies and original URLs, project links, gallery controls, consent-gated Firebase Analytics and Dynatrace RUM.
- Fixed the no-sidebar article grid column and pointer-enter/click menu interaction. Added pinned Astro formatting support.

## [1.1.1] — 2026-11-05

- Added the complete “The War Room Is Dead” article from the author’s supplied LinkedIn URL, including original displayed publication date, source link, cover and photo credit.
- Added dt-mac-agent to the project workbench from its verified public README.
- Preserved separately authored notes when refreshing the original Hashnode RSS import.

## [1.1.0] — 2026-11-05

- Refined the editorial identity with locally served Source Serif 4/Public Sans, original notebook and planning illustrations, and a warmer paper/navy/terracotta palette.
- Corrected article list rhythm, nested paragraphs, numbered lists, headings, code and tables; added section contents with preserved anchors.
- Added eleven repository/profile-verified projects including SalesDrone, Aroha Retreat, Budget Buddy/FinBuddy, FinVision AI, ChaiCart and InspiredLearning.
- Replaced the About portrait with a selected studio photograph and added a six-photo gallery with keyboard-operated enlargement, focus restoration and mobile layouts.

## [1.0.0] — 2026-11-05

- Built the Astro/TypeScript editorial site with responsive pages, archive search, topic filters and 12 migrated articles at their original paths.
- Added RSS, sitemap, metadata, sanitized article rendering, consent-aware Firebase Analytics and Dynatrace RUM.
- Prepared Firebase Hosting and application CI, service ownership, and operational documentation.
- Adapted foundation test fixtures for a configured app and corrected Windows path/lock handling.

Template version **1.9.0** and migration history are recorded in [docs/template-changelog.md](docs/template-changelog.md). Generated applications may use this root file for their own releases; keep template provenance separate.
