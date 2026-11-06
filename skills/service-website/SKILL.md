---
name: service-website
description: Maintain the website service from actual source and operations context.
---

# website service

Status: active. Read [catalog](../catalog.json), [continuation](continuation.md) and the [service contract](../../.agents/skills/app-launchpad/references/services.md).

| Area           | Current implementation                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose/owner  | Personal journal and private publishing workspace; owner theharithsa                                                                                                                      |
| Entrypoints    | src/pages, src/middleware.ts, src/scripts/cms.ts, src/server, runtime/instrumentation.mts; one-off jobs/content-migration                                                                 |
| Data/contracts | Firestore Standard Native us-east1; immutable revisions/public pointers; docs/cms-architecture.md, rules and indexes                                                                      |
| UI             | Nine Notion-style collection tables, rich editor, autosave/drafts/publish/history/preview; public timeline/tags and dated photo carousel                                                  |
| Security       | Verified Google owner plus UID pin, revoked token checks, private storage, no client DB access; preserve outlined Margin identity and original source bodies                              |
| Tests          | npm run check; npm run build; npm test; npm run test:cms (JDK21); npm run build:server                                                                                                    |
| Delivery       | Firebase Hosting dist/client rewrites to preview/live Cloud Run, immutable image digest; scripts/deploy-runtime.ts; previous static Hosting version 58336dbdc5de13be is rollback baseline |
| Dynatrace      | harithsa-notes-web; real OTel and safe payload summaries, durable transactional publication events, trusted OIDC CI observer; docs/observability.md                                       |

Medium archive: `medium-articles.json` owns 75 imported articles, alongside 13 earlier notes. `medium-sources.json` maps eight duplicate publications to existing canonical URLs; `blog-art.json` supplies all 88 display covers. `docs/medium-journal.md` owns migration provenance and maintenance guidance. Import tooling consumes ignored Chrome captures and never modifies the Medium account.

Presentation/browsing: books.ts exposes only the 50 confirmed read books; book-genres.json owns editorial genres. Projects filters existing categories. GoGs remains an empty journal with original menu art. page-meta.ts owns canonical aliases, section descriptions and browser colours; Base emits social and structured metadata. theme.ts owns system/default/manual preference and resilient local persistence; site.css owns both palettes. See docs/browsing-and-themes.md.

Use the task's shared workflow skill; keep this file about the actual service. Continuation owns the current work/evidence/next action.
