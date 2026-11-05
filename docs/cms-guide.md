# Your publishing workspace

Open [the workspace](https://theharithsa.com/admin) and continue with Google using `theharithsa@gmail.com`. The server checks the verified Google identity and pins its Firebase UID; signing in with another account does not grant access.

Choose Blog, Books, Projects, Podcasts, Entertainment, Photos, GoGs, Pages or Tags in the sidebar. Each collection has a searchable table and publication status. Open a row to edit its properties. Blog and GoGs include a rich text editor with headings, lists, quotes, code, links, images and tables. Existing article HTML is preserved until the body is edited.

Changes autosave as private revisions. **Publish** explicitly updates the public version. **Preview** opens the saved private draft in another tab. Public caches expire within 30 seconds. **History** restores a previous revision into a new draft; publish it when ready. **Unpublish** removes an entry from public pages while keeping its draft and revisions. Home and Meet Vish remain published and can be revised through Pages.

The status filter separates Drafts, Published, Draft changes and Unpublished. A conflicting edit never silently overwrites a newer revision. Download your unsaved copy before choosing Reload. A recovery copy remains in the current browser tab’s session storage after a network interruption; it is removed on successful save or sign-out. Keep the tab open if browser storage is unavailable.

Upload JPEG, PNG or WebP images up to 8 MiB. The server strips metadata and creates responsive WebP derivatives. Add descriptive alternative text. New images remain private until referenced by a publication. An image that has already been public remains addressable and may remain cached after unpublishing; this is not a mechanism for recalling a previously published photograph.

Books keeps only Read entries and personal ratings. Zero means unrated, never a displayed score. Genres are comma-separated. Projects has topic and technology properties, its own story/features and separate live/GitHub links. Podcasts distinguishes Listening and Created; Created starts empty. Entertainment retains the illustrated archive style and real posters inside notes. Photos accepts an actual year, month or date; leave unknown dates blank. Original photos remain Undated. GoGs starts empty.

The public blog combines search, topic and tags, with a year/month rail and a compact date picker on small screens. Photos uses a swipeable carousel, thumbnails, date navigation, keyboard arrows and a full-size dialog.

Preview and production are separate database namespaces. Edits on a review URL do not change the live journal. The workspace is hosted on this site; it does not synchronize with your Notion account.

## Operations and privacy

The table footer shows queued or blocked audit delivery. Retry requests are bounded; a blocked queue needs an operator to inspect the ingestion configuration. Publishing commits its audit event atomically with the publication. Dynatrace receives operation names, outcomes, revisions, timings, safe identifiers and payload sizes/field names/SHA256 hashes. Draft bodies, tokens, cookies, email addresses and image bytes are not copied into telemetry.

Browser RUM and Google Analytics remain opt-in on public pages. Both are disabled inside the workspace and private previews. Server reliability telemetry operates independently of browser consent and excludes raw content. See [the CMS architecture](cms-architecture.md) and [observability](observability.md).
