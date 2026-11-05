# Books journal provenance

Issue #17 / application version 1.8.0. The owner requested importing their Goodreads books and personal ratings, then clarified that only the 50 entries on the Read shelf should be included. Source: https://www.goodreads.com/review/list/107015673-vishruth-harithsa?shelf=read&per_page=100, read through the signed-in Chrome UI on 5 November 2026.

`src/data/goodreads-books.json` contains the 50 title/author entries, personal rating values, original written reviews, recorded date-read strings and original book/review links. All 50 have ratings (19 five-star, 31 four-star); 46 have written reviews. Blank review fields remain blank. Community average ratings, private notes, drafts, account settings and unrelated shelves were not imported. No Goodreads account changes were performed.

The owner authorized these personal reviews for their public site. The review text is preserved verbatim as plain text with paragraph breaks, including original spelling. Astro escapes it; imported HTML is never executed. Display author names reverse Goodreads' surname-first format. Local route slugs normalize the source book URL into lowercase hyphenated paths. Read dates retain source precision rather than inventing a day.

`src/data/books.ts` owns the journal model and merges these completed entries with the remaining three Reading and two To read titles from the existing Notion shelf. Seven overlapping titles were replaced by their richer completed Goodreads entries, leaving 55 total shelf cards and exactly 50 completed journal routes. The short original Heart of Success label maps to the actual source edition, The Heart of Success - Exclusive Chapter.

The existing coloured typographic jackets remain original shelf labels, not publisher covers. No new media or external cover requests were introduced. Journal pages show personal ratings, existing written reviews when present and Goodreads source links; four entries without review text show their recorded rating and resources.

Validation: all 50 routes, unique slugs, source links, ratings and original review paragraphs are covered by the journal artifact test; existing site integrity tests cover local links and assets. Browser checks exercised Read (50), five stars (19), Hawking plus five stars (2), empty search, a full review and a rating-only entry. At 390px and desktop, no horizontal overflow, overflowing jackets or overlapping title/author text were observed. Local captures live in ignored qa/local.
