# Release impact and verification plan

Version: 1.2.0. Scope: issue #5 (seven-section rebuild), plus [issue #1](https://github.com/theharithsa/theharithsanotes/issues/1) and [editorial refinement #3](https://github.com/theharithsa/theharithsanotes/issues/3). Source: feature branch `feat/1-personal-website`, reviewed through PR #2. The user approved a private repository and Firebase Hosting project the-harithsa-notes-94, then requested article formatting, classic typography, more projects, and selected Downloads photographs.

Refinement: locally served font packages/notices, original illustrations, article contents/formatting, eleven project entries and gallery/About photography. No article path changes, database writes, tenant changes, or production DNS cutover. Rebuild all static pages/assets and redeploy only the existing Firebase review channel. Code and preview acceptance remain separate from a production launch.

Changed: static editorial UI, article migration, browser search/filter/menu, consent and browser monitoring, metadata/feed/sitemap, Hosting headers/config, docs, service inventory and application CI. No database, server migrations, privileged secret bindings, Auth rules, or Functions.

Predeploy: `npm run check`, `npm run build`, `npm test`, `npm audit --audit-level=high`; inherited foundation validation, link checker and Python suite. Manual browser coverage: desktop home 1440×1000, mobile archive/navigation 390×844, search/empty/reset/filter and Escape/focus return. Preview deployment uses the validated dist directory. CI must pass for the current PR head. Merge is not yet authorized by a separate request; leave the concrete PR reviewable.

Launch: verify Firebase preview first. Production deployment and domain cutover are separate from a preview. Keep the current domain publication until the new release is accepted. Firebase supplies exact DNS values; do not invent or overwrite records. Roll back with the prior Hosting release and prior DNS if changed. No state migration is required.

Postdeploy: HTTP pages/assets, canonical URLs and preserved article slugs; correct 404; consent/no-consent script and beacon behavior; GA Realtime and exact Dynatrace application session. Tenant searchability remains unverified until observed. No backend native linkage exists for this static site. GitHub source facts and CI results are evidence; no SDLC tenant exporter is configured. See [observability](observability.md) and [execution evidence](../qa/evidence.json).


1.3.0 / issue #6: five static screen-note routes, revised Entertainment archive and client filter, navigation/sitemap updates. No database, dependency, monitoring or permissions changes. Deploy the validated dist to the existing Firebase review channel; compare archive/detail HTML to local build and verify browser filtering. Rollback is the preceding review version f1ef7989b3531a52. Production/domain/merge remain separate.


1.3.1 / issue #7: five local promotional posters, shared poster component, official links and media metadata; no dependency, database, monitoring or permissions changes. Review version 7c95643d040ce258 verified against artifact bytes; previous review version fc050dd9395f0644 is the rollback source. No production/domain transition.
