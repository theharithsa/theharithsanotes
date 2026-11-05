# Editorial design — 1.1.0

User direction: refine the initial Gates Notes-inspired site, improve article formatting/classic fonts, add verified projects, select a better Downloads portrait, and make space for personal photography.

## Typography and reading

The reference site was inspected in the browser on 5 November 2026: ABC Marist headings and Untitled Sans supporting text. No proprietary font files were copied. This project uses self-hosted Source Serif 4 Variable (5.3.1) and Public Sans Variable (5.3.0), with licensed font packages and notices in LICENSES. Headings have stronger weight and less fragile contrast; body articles use a reading serif, restrained measure and clear paragraph rhythm. Warm ivory, ink navy and terracotta support the paper/editorial direction.

Lists retain their original semantic HTML and content. Paragraphs inside bullets have compact margins; nested lists keep a separate rhythm, numbered markers remain visible, and code/table overflow stays within the reading column. Sanitized heading IDs and ordered-list attributes are preserved. Article contents link to actual headings; mobile contents starts collapsed, desktop opens it. No article prose was rewritten in this refinement.

## Artwork

Two original imagegen illustrations were generated for this site, inspected, and saved as WebP derivatives. No user portrait was submitted to imagegen or altered with generative editing.

- `public/images/curiosity-editorial.webp`: original open notebook unfolding into mountains, branching circuits, botanical leaves, telescope/observatory and an orbital sky. Tactile paper, engraving and gouache; ivory, navy, sage and ochre. Home hero and Budget Buddy editorial cover. No text or logos.
- `public/images/projects/planning-editorial.webp`: original finance metaphor: botanical tree growing over rupee coins, compass, paper boat and a river towards the sunrise. FinVision AI editorial cover. Illustration, not a product screenshot or promised financial result.
- `public/images/projects/salesdrone.jpg`: the public repository’s explicitly synthetic dashboard screenshot, from `theharithsa/SalesDrone/site/assets/screenshots/dashboard-demo.jpg`.
- `public/images/projects/aroha.webp`: actual public Aroha website hero photograph, from `ArohaRetreat/website/website/assets/retreat/hero-desktop.webp`.

## Personal photographs

The user explicitly requested selection from Downloads and inclusion on the site. Original files were left intact. Local WebP derivatives were resized for delivery and encoded without source metadata; no scene/face edits, inferred identities, precise GPS information, or invented event claims were added. Captions refer only to visible scenes; the Mumbai event label is visible in the event photographs.

| Original filename | Website use |
| --- | --- |
| DSCF1589.JPG | Seated studio portrait on About and home |
| DSCF1608.JPG | Article avatar and gallery studio portrait |
| IMG_20250829_135013.jpg | Gallery/home team event photograph |
| IMG_20250829_181109~2.jpg | Gallery event stage photograph |
| IMG_20241221_160201_1.jpg | About/home/gallery café moment |
| IMG_20241221_160023.jpg | Gallery café conversation |
| IMG_418.jpg | Gallery/home evening group photograph |

The gallery uses a native modal dialog, descriptive labels, previous/next controls, arrow keys, Escape, focus restoration and scroll-lock cleanup. Images remain on the same origin.

## Project sources

Descriptions were checked against actual public README files, without copying promotional superlatives, secrets, private code or unverified performance claims. FinVision AI uses the user-supplied live URL and its page description.

- [SalesDrone](https://github.com/theharithsa/SalesDrone)
- [Aroha website](https://github.com/ArohaRetreat/website)
- [FinVision AI](https://finvision-ai.web.app/)
- [Budget Buddy / FinBuddy](https://github.com/theharithsa/budget-buddy)
- [ChaiCart](https://github.com/theharithsa/chaicart-cloud-workshop)
- [InspiredLearning](https://github.com/theharithsa/inspiredlearning)
- [Copilot OTel](https://github.com/theharithsa/github_copilot_otel)
- [SalesDrone MCP](https://github.com/theharithsa/salesdrone-mcp)
- [Manahsmriti](https://github.com/theharithsa/manahsmriti)
- [App Launchpad](https://github.com/theharithsa/app-launchpad-template)

Original Dynatrace MCP entry was retained. Displaying a project describes work/contributions; it does not claim exclusive authorship or verified production health.

## Content addition — 1.1.1

Added [The War Room Is Dead](https://www.linkedin.com/pulse/war-room-dead-your-observability-tool-just-doesnt-know-harithsa-iicyc/) at `/the-war-room-is-dead`. The author explicitly requested republication. All 51 article text blocks were imported; LinkedIn recommendations, sign-in elements, comments and page chrome were excluded. Headings, bullets, numbered lists and quotations remain in semantic HTML and go through the same build sanitizer. The displayed original publication day is 27 March 2026; the source timestamp is retained separately in article metadata. The original cover is stored locally with the credit “Photo by Photos of Korea on Unsplash”. The original LinkedIn link is visible on the note. The site now has 13 notes; the original 12 paths remain unchanged.

Added [dt-mac-agent](https://github.com/theharithsa/dt-mac-agent) from its public README: a lightweight macOS agent collecting system/process/application health for Dynatrace. No installation or credential-handling commands are copied into the personal site. Twelve projects are listed. The three home-page project highlights remain SalesDrone, Aroha Retreat and FinVision AI.


## Seven-section rebuild — 1.2.0 / issue #5

The owner rejected the repeated content and requested seven distinct sections. Browser research visited the Gates Notes home, Meet Bill, Movies and TV, and Slow Horses article. Observed principles: photography and illustration set a section identity; large serif story titles, plain sans navigation, low card density, generous white space, restrained text panels. Gates Notes Books returned a temporary missing-article page during this visit; it was not treated as a design reference. No Gates Notes text, photographs, proprietary fonts or assets were copied.

`src/styles/site.css` now owns all styles; both legacy stylesheets were removed. Base renders Home plus six section links with wide descriptive menus. Pointer entry, keyboard focus, explicit buttons, Escape, outside-click and responsive menu reset are supported. Menus are plain navigation/disclosures, not application role=menu controls. No-script direct links remain usable. Home shows one lead article, two other stories, and one section glimpse each; repeated topic rails and closing slogans were removed.

Books uses original typographic shelf labels and status filtering. Podcasts uses a record illustration, a lead listening note and compact episode rows. Projects preserves twelve verified links and adds stable section anchors. Entertainment begins with the existing Senna reflection; no unwritten movie reviews were invented. Meet Vish uses the selected seated portrait and a three-photo journal; the separate six-photo gallery retains keyboard controls. Old /notes and /about routes remain compatible with the new pages.

The user explicitly directed personal-interest discovery to Notion. Only selected reading and podcast log fields were copied into `src/data/interests.ts`; duplicate episodes were removed, statuses distinguish finished from wishlist, and notes were condensed without importing private journals, work/customer records or unpublished scripts. Source collections: Reading Log 0d3d0568-910a-4a5f-adc0-4b0daab3799d and Podcasts be888b1b-3f84-454c-ab78-407db5ae330b, inspected 5 November 2026 IST. These are a static snapshot, not a live Notion connection. No ratings or read reviews were manufactured.


## Screen journal expansion — 1.3.0 / issue #6

Owner explicitly requested movie/series and lesson discovery in Notion on 5 November. Read only relevant viewing passages; do not export entire journals. Source dates: War Machine (8 March), Made in Korea (14 March), The Taj Story (20 March), Korean labour-attorney series (27 March), Subservience (28 March), all 2026. `src/data/screen-notes.ts` contains edited, condensed reflections in the owner's voice, not verbatim full diary entries. Source dates are labelled reflection-recorded dates, not release dates or proof of series completion. No ratings, streaming availability, or completion claims were added. Unrelated personal/third-party/work details and private source links are excluded from the build.

Title resolution: the journal calls the Korean series Oh My Ghost but describes a labour attorney aiding unjustly deceased workers. The broadcaster's [Oh My Ghost Clients synopsis](https://content.mbc.co.kr/program/drama/3898635_64285.html) matches this description; the Netflix title is also distinct from the chef story. This remains an explicitly disclosed editorial inference on the reading page. The Taj Story note concerns conversation and differing perspectives; no contested historical claims or relatives' beliefs are republished. The War Machine note keeps perseverance and self-belief without unrelated diary material.

The entertainment archive now has a featured AI reflection, four additional movie/series cards, and the existing Senna essay. Individual static reading pages use shared `ScreenArt`, date metadata, a lesson callout and next-reflection navigation. Artwork is original abstract CSS geometry and typography, not licensed posters. Archive filters affect the four cards below the featured reflection. The five short screen notes stay separate from long-form blog/RSS articles and appear once each in the sitemap.


## Posters and official title pages — 1.3.1 / issue #7

The owner requested recognizable posters and film/series links. `ScreenPoster` replaces abstract artwork on the screen archive and reading pages. Source-matched promotional key art: Netflix Media Center for the Tamil film Made in Korea (81754582) and 2026 War Machine (81768525); MBC for Oh My Ghost Clients; Apple TV title art for Subservience and The Taj Story. `docs/screen-media.json` records exact source/CDN URLs, dimensions and inspection date. Images were downloaded unchanged, validated as images and visually inspected. These are promotional images belonging to their respective rights holders; no original art ownership is claimed.

Local delivery avoids third-party image requests for this component. Portrait and landscape layouts preserve the full artwork using object-fit:contain. Posters open the corresponding official title page; source credits remain separate from reflection navigation. Labels say title page/details, without a regional streaming-availability promise. External links open in a new tab with noopener/noreferrer. Image failure reveals a readable title/fallback while retaining the official link. Reflection social previews use the title artwork. The original Senna essay remains an essay about the driver; no unconfirmed Senna adaptation poster was substituted.
