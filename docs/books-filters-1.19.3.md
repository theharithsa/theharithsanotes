# Books browsing controls — 1.19.3

Issue #70 replaces the large genre cards and separate rating row with one compact control group beneath the bookshelf heading. Genre includes the existing full-shelf counts; My rating combines with it as before. Both use Blog's paper/ink/line palette, rounded shape, small labels and Source Sans 3. Desktop controls sit together; mobile controls stack at full width. The book grid, all read titles, original ratings and notes stay intact.

The genre selector uses the existing synchronous filtering path and result count/empty state. Its change event triggers the same smooth result reveal as rating and Blog changes, respecting reduced motion. Native selectors preserve keyboard and touch interaction. No new page search or backend request is introduced.

Verification covers combined genre/rating filtering and reset through the existing behavioral suite, Astro check/build, current-head CI, and desktop/mobile/dark browser checks. Provider receipts and live evidence belong in the linked PR. No data, schema, permissions, dependencies, brand or template changes. Rollback uses matching private-aware 1.19.2 runtime/client assets without reverting published CMS content.
