# Browsing, GoGs and colour modes

Issue [#21](https://github.com/theharithsa/theharithsanotes/issues/21), application 1.10.0.

## Reading and projects

Books contains only the 50 owner-confirmed Goodreads Read entries. Five unfinished Notion entries and status controls are removed. Original ratings, reviews, links and reading routes remain unchanged. `src/data/book-genres.json` assigns editorial browsing genres to stable review IDs; these are site classifications, not Goodreads metadata. Books can belong to several genres. Eight genre chips combine with personal-rating filtering; All genres resets the genre. Live results and the empty state are accessible. All 50 books remain server-rendered without JavaScript.

Projects uses four existing categories as topics, with pressed states and live counts. The full collection retains its original mosaic. Filtered groups with at least three projects use a lead illustration and companions without gaps from hidden source positions; All projects restores the original mosaic. Existing anchors and detail routes remain stable.

## Games and Gadget

`/gogs` is the Games and Gadget (GoGs) landing page. Its seventh header disclosure has the established coloured panel and an original portrait-reference illustration. Games and Gadgets anchors introduce journals that remain empty until the owner supplies experiences. No ownership, game history, scores or articles are invented. GoGs appears in mobile navigation and the sitemap. See `gogs-art.json` for the prompt and owner-authorized reference.

## Colour mode and browser chrome

The top-right day/night orbit is a keyboard-accessible button with state/action labels and animated sun/moon transitions. Reduced motion disables animation. A head script selects the mode before paint; the TypeScript controller handles switching, system changes and cross-tab preferences.

Default: follow `prefers-color-scheme`. An explicit light/dark choice is saved under `harithsa.theme.v1` in this browser's local storage, effective immediately across pages. Clearing that key restores the system default. This functional preference requires no account or permission and does not enable analytics. Blocked storage allows current-page switching. Original image files remain intact; surfaces, navigation, controls, code and jackets receive a night palette.

`src/lib/page-meta.ts` owns section colours and descriptions. Theme-colour follows the route and effective mode; mobile headers use the same palette. [MDN documents theme-color](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color) as a suggested browser-interface colour. Responsive desktop checks verify metadata and header styles; physical Android toolbar rendering remains browser-controlled.

## Search metadata

Static routes have titles, descriptions, canonicals, Open Graph and Twitter metadata. Main sections have distinct descriptions. BlogPosting data uses original dates, headline, cover and author; Book data includes the visible personal review/rating. Person, WebSite and WebPage nodes identify publisher and canonical page. JSON-LD escapes markup characters.

Legacy `/notes` and `/about` canonicalize to `/blogs` and `/meet-vish`; only preferred destinations enter the sitemap. The 404 is noindex. Article URLs, RSS and robots discovery remain. Implementation follows Google's [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) and [article structured-data documentation](https://developers.google.com/search/docs/appearance/structured-data/article). This provides crawlable metadata without claiming indexing, rankings or guaranteed rich results.

No backend, dependency, DNS, secret or monitoring configuration changes. Analytics consent remains independent from presentation preferences.

## Global search and mobile categories (1.14.0, issue #35)

The header magnifier opens `/search`, the only public search field. It searches current published titles, descriptions, tags, authors and display bodies across Blog, Books, Projects, Podcasts, Entertainment, Photos, GoGs and Pages. All query words must match; title matches rank first. Results paginate in groups of 20. Drafts, source URLs and Notion import metadata are excluded.

The browser sends query text in a bounded JSON POST to `/api/search/query`, never in a URL or analytics event. The search page disables optional analytics/RUM and is noindex; responses are private/no-store. Public index data can live in server memory for 15 seconds. Each collection is bounded at 1,000 published entries; exceeding that limit returns an explicit capacity error rather than silently dropping content. A dedicated external search index can replace this bounded implementation if the archive grows beyond that size. Requests are debounced/cancelled, input is limited to 160 characters, bodies to 1KiB, and each instance admits at most 300 valid requests per minute.

People and Journal matches require a current verified, active invitation on every search. Restricted indexes are request-local, never enter the shared public cache, and return display summaries only. Invalid, expired or revoked sessions receive public results only. Search clears its DOM when navigating away and does not persist search terms/results in browser storage.

Below 768px, every existing category control (Blog tags/topics, book genres, project topics, Entertainment types and Podcast collections) becomes a labelled native dropdown. Desktop controls and dropdown selection stay synchronized. Genre/topic counts remain visible in option labels; book ratings remain a separate dropdown. Without JavaScript the original wrapped links/buttons remain available. Blog tags share the masthead's content measure and wrap within it. Workspace table search remains an administrative tool.
