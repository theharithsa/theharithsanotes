# Service inventory

The machine-readable inventory is [catalog.json](../skills/catalog.json) → `services`.

- `website`: Astro static pages and browser-only interactions/monitoring; owner theharithsa. Source `src`, static assets `public`, Firebase Hosting `dist`. See [service skill](../skills/service-website/SKILL.md).
- `foundation-tooling`: inherited Python template validation/registration tooling under `scripts`. The content import script is application authoring tooling, not a deployed backend.

Brand authoring (`generate-brand.py`, `render-brand.mts`, `package-brand.py`) belongs to website maintenance, with pinned FontTools/Sharp and source provenance in docs/brand-system.md. It is not a separate runtime service.

There is no API, database, worker, or deployment-time service beyond static Firebase Hosting. Dependencies are Astro, Firebase client SDK, and build-time HTML sanitization. Versioned article JSON is the authoring store.

Use the [service ownership and continuation contract](../.agents/skills/app-launchpad/references/services.md), [catalog schema](../schemas/catalog.schema.json) and [synthetic service example](../examples/web/SKILL.md). Review inventory completeness against actual source/runtime/deployment boundaries; automated validation covers declared mappings only.
