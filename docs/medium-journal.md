# Medium journal migration

Issue [#19](https://github.com/theharithsa/theharithsanotes/issues/19). The owner requested every published article visible in the signed-in Chrome Medium profile, with original writing and illustrations matching the existing journal.

## Source and completeness

The profile exposed 83 published stories after loading the full archive. Each story was opened and read through Chrome. Titles, subtitles, bylines, publication dates, reading times, semantic body blocks, full article DOM, source links and observed media URLs were captured locally. Three profile lists were excluded. All 83 bylines identify Vishruth Harithsa; no access-gated story was imported.

Eight stories duplicate existing articles, including two with different titles but matching bodies. Their existing canonical URLs and writing remain intact, with an additional Medium source link. The other 75 become local reading pages. The combined journal contains 88 articles, sorted by their original publication dates. `medium-import.json` accounts for every source story and records the imported body hashes. Original browser captures remain ignored under `qa/local`.

## Writing and media

The migration preserves original paragraphs, emphasis, lists, headings, quotations, code blocks, poem line breaks, links and image captions. Titles using mathematical bold Unicode are normalized for accessible typography. Imported markup is sanitized; scripts, Medium account controls and platform recommendations are excluded. Links between imported stories use their local canonical routes. No prose or ratings were invented.

The 151 body images are locally served copies of resources observed in the articles. `medium-media.json` records source URLs, captions' original alt text, file sizes and SHA-256 hashes. Five old podcast figures exposed captions but no playable media in the rendered source; those retain attribution and an explicit link to the original Medium media.

Each new story receives an independently generated topic-specific cover. One duplicate with a changed title receives a newly matched illustration; other duplicates retain their existing covers. Exact prompts and asset paths are in `medium-art-prompts.json`. PNG masters remain unmodified; Astro produces responsive WebP variants. The owner-approved warm paper, fine ink and muted colour direction takes precedence over generic template illustration defaults.

## Maintenance

`src/data/medium-articles.json` owns the new writing; `articles.json` retains the earlier archive. `blog-art.json` overlays display artwork; `medium-sources.json` links duplicate publications. The existing RSS refresh cannot erase the separate Medium collection. `scripts/import-medium.mjs` can rebuild from the ignored source captures, reusing verified local image receipts. It does not sign in to Medium or modify the source account.

The header and journal title use **Blog**. `/blogs` remains stable. Article contents, source links, archive search and topic filters, related cards, RSS and sitemap share the combined collection. No backend, credentials, consent or monitoring configuration changes are required.
