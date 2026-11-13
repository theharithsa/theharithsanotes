# The Harithsa Notes

The Harithsa Notes is Vishruth Harithsa’s personal editorial site for readers interested in technology, books, projects, and life outside work. [Read the live site](https://theharithsanotes.com/), follow the [public roadmap](docs/public/roadmap.md), or browse the [release history](docs/public/releases.md).

Template version: **1.9.0**. Repository-local app-launchpad guidance: **1.13.2**.

## Run locally

Requires Node.js 24 and npm. Dependencies are pinned in package.json and package-lock.json.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4321. Local monitoring is disabled unless `PUBLIC_ENABLE_LOCAL_TELEMETRY=true` is explicitly set. To verify:

```sh
npm run check
npm run build
npm test
python scripts/check_foundation.py
python scripts/check_links.py
python -m unittest discover -s tests -v
```

## Content and structure

Astro and TypeScript power the site. The local build uses content snapshots in `src/data/`. The live [publishing workspace](docs/cms-architecture.md) uses Firebase Auth and Firestore for drafts and published entries. Firebase Storage serves public artwork and holds protected media. The [Content API](docs/content-api.md) supports scoped publishing access, and [People and Journal](docs/people-journal.md) requires an invitation.

## Hosting

Firebase Hosting routes dynamic requests to the Firebase HTTP function in US East. The primary domain is [theharithsanotes.com](https://theharithsanotes.com/). See the [Firebase release procedure](docs/firebase-only-migration.md) for staging the reviewed commit and pinning Hosting to its runtime revision.

## Monitoring and delivery

See [observability](docs/observability.md), [decisions](docs/decisions.md), [testing](docs/testing.md), and [release plan](docs/release-plan.md). Firebase Analytics uses the supplied public config. Dynatrace credentials are supplied to the runtime through server-side secrets.

The repository was generated from `theharithsa/app-launchpad-template` v1.9.0, revision `f04c042a9e000f606982863518fa7bb9cfbb7d85`. The local skills were refreshed from template revision `87a9124c09e83d7d67db2de4a6469e708b37200a`. The inherited root LICENSE covers template material. Article content and new application assets remain the authorâ€™s; no additional open-source license is granted by this project.

Typography: Source Serif 4 and Public Sans for editorial pages, and JetBrains Mono for technical content. The approved Margin wordmark uses path artwork derived from Bodoni Moda with an original bookmark h; no logo font download is required. See the [brand system and export kit](docs/brand-system.md). Font licences remain in LICENSES. Promotional film/series images retain their respective rights-holder ownership; sources are in docs/screen-media.json.
