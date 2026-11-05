# Browsing, GoGs and colour modes

Issue [#21](https://github.com/theharithsa/theharithsanotes/issues/21), application 1.10.0.

## Reading and projects

Books contains only the 50 owner-confirmed Goodreads Read entries. Five unfinished Notion entries and status controls are removed. Original ratings, reviews, links and reading routes remain unchanged. `src/data/book-genres.json` assigns editorial browsing genres to stable review IDs; these are site classifications, not Goodreads metadata. Books can belong to several genres. Eight genre chips combine with title/author search and personal-rating filtering; All genres resets the genre. Live results and the empty state are accessible. All 50 books remain server-rendered without JavaScript.

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
