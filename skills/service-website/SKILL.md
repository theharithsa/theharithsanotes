---
name: service-website
description: Maintain the website service from actual source and operations context.
---

# website service

Status: active. Read [catalog](../catalog.json), [continuation](continuation.md) and the [service contract](../../.agents/skills/app-launchpad/references/services.md).

| Area | Actual service facts to complete |
| --- | --- |
| Purpose/owner | Public personal journal; accountable owner theharithsa |
| Source/entrypoints | src/pages/index.astro, src/pages/[slug].astro, src/scripts/telemetry.ts; static dist output |
| Design/contracts | src/styles/global.css owns tokens/breakpoints; src/data/articles.json owns notes; no API, permissions or data migrations; Astro + Firebase browser SDK |
| Code/invariants | src/lib/content.ts sanitizes imported HTML; original slugs stay stable; Base owns navigation/metadata; consent gates monitoring; never browser ingestion tokens |
| Editorial/media | src/data/projects.ts and gallery.ts own verified project/photo entries; GalleryGrid uses a native dialog with keyboard/focus cleanup; Source Serif 4/Public Sans are self-hosted; original media provenance in docs/editorial-design.md |
| Tests | Node 24/npm: npm run check, npm run build, npm test; tests/site.test.mjs exercises artifacts and consent; see docs/testing.md |
| Deployment/rollback | Firebase Hosting project the-harithsa-notes-94, dist directory; preview before production/DNS; prior Hosting release for rollback; no privileged secrets required |
| Dynatrace/recovery | Supplied RUM tag, opt-in anonymous capture; no replay enablement, identity, backend OTel, business events or native backend linkage; telemetry failure cannot block reading; docs/observability.md |

Use the task's shared workflow skill; keep this file about the actual service. Continuation owns the current work/evidence/next action.
