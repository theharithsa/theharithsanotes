# Service inventory

The machine-readable inventory is [catalog.json](../skills/catalog.json) → `services`.

- `website`: Astro SSR public journal, private publishing workspace and authenticated CMS API; owner theharithsa. Firebase Hosting serves immutable client assets and pins Cloud Run in us-east1. Firestore holds drafts/revisions/public projections; private Cloud Storage holds normalized media. See [service skill](../skills/service-website/SKILL.md).
- `content-audit`: shared durable outbox in `src/server/outbox.ts`, scheduled OIDC HTTP delivery and the longer on-demand `jobs/content-audit` repair job. See [service skill](../skills/service-content-audit/SKILL.md).
- `foundation-tooling`: inherited Python template validation/registration tooling under `scripts`. The content import script is application authoring tooling, not a deployed backend.

Brand authoring (`generate-brand.py`, `render-brand.mts`, `package-brand.py`) belongs to website maintenance, with pinned FontTools/Sharp and source provenance in docs/brand-system.md. It is not a separate runtime service.

Live authoring uses isolated preview/live Firestore collections and media prefixes. Versioned content snapshots remain migration/regression inputs. Runtime identities, dependencies, secrets, recovery and telemetry boundaries are documented in [CMS architecture](cms-architecture.md) and [CMS observability](cms-observability.md).

Use the [service ownership and continuation contract](../.agents/skills/app-launchpad/references/services.md), [catalog schema](../schemas/catalog.schema.json) and [synthetic service example](../examples/web/SKILL.md). Review inventory completeness against actual source/runtime/deployment boundaries; automated validation covers declared mappings only.
