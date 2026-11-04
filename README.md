# The Harithsa Notes

Template version: **1.9.0**.

Vishruth Harithsa’s personal journal for **theharithsa.com**, built with Astro and TypeScript. Gates Notes-inspired editorial design with classic locally served typography, original illustrations, twelve projects, a personal photo gallery, and 13 notes including 12 migrated articles at their original URLs. See the [design and media provenance](docs/editorial-design.md).

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

- `src/data/articles.json`: locally stored article text, dates, categories, original source URLs, and image references. Edit this file to publish or revise notes; rebuilding creates every static route.
- `src/pages`: home, archive, About, projects, privacy, 404, generated article routes, RSS and sitemap.
- `src/layouts` and `src/components`: shared shell and cards.
- `src/scripts`: browser navigation/search and consent-aware monitoring.
- `src/styles/global.css`: design tokens, responsive layouts, keyboard focus, reduced-motion support.
- `public/images`: local covers, profile photo, forest photograph, and original SVG fallback artwork.
- `skills/service-website`: service ownership and continuation, registered in the App Launchpad catalog.

The initial import came from the author’s public RSS feed on 5 November 2026. `npm run content:import` refreshes from that original feed **only while the old publication is still serving the domain**; after migration, author locally instead. Imported HTML is sanitized at build time. No live Hashnode dependency is required to build or serve the migrated text. Some inline article images still use original providers. Review image rights before public launch. The forest photograph is from [Unsplash](https://images.unsplash.com/photo-1441974231531-c6227db76b6e); covers were retained from the author’s publication, and the profile photo came from the author’s GitHub profile.

## Hosting

Firebase Hosting project alias: `the-harithsa-notes-94`. Only static Hosting is configured; no Auth, database, rules, paid backend, or Cloud Functions are created.

```sh
npm run check
npm run build
npm test
npx --yes firebase-tools@15.34.2 hosting:channel:deploy review --project the-harithsa-notes-94
```

After reviewing the preview, publish the tested `dist` with `npx --yes firebase-tools@15.34.2 deploy --only hosting --project the-harithsa-notes-94`. Attach `theharithsa.com` in Firebase Hosting and apply the exact DNS records supplied there. The domain already hosts the old blog; keep it until the new Hosting release is verified. No DNS change occurs from merely deploying a Hosting preview.

## Monitoring and delivery

See [observability](docs/observability.md), [decisions](docs/decisions.md), [testing](docs/testing.md), and [release plan](docs/release-plan.md). Firebase Analytics uses the supplied public config. Privileged Dynatrace credentials are never needed in this static client. Do not add them to browser variables, build files, or GitHub PR jobs.

The repository was generated from `theharithsa/app-launchpad-template` v1.9.0, revision `f04c042a9e000f606982863518fa7bb9cfbb7d85`. The inherited root LICENSE covers template material. Article content and new application assets remain the author’s; no additional open-source license is granted by this project.
