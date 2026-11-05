# Service inventory

The machine-readable inventory is [catalog.json](../skills/catalog.json) → `services`.

- `website`: Astro static pages and browser-only interactions/monitoring; owner theharithsa. Source `src`, static assets `public`, Firebase Hosting `dist`. See [service skill](../skills/service-website/SKILL.md).
- `foundation-tooling`: inherited Python template validation/registration tooling under `scripts`. The content import script is application authoring tooling, not a deployed backend.

There is no API, database, worker, or deployment-time service beyond static Firebase Hosting. Dependencies are Astro, Firebase client SDK, and build-time HTML sanitization. Versioned article JSON is the authoring store.

Planned evolution in [issue #23](https://github.com/theharithsa/theharithsanotes/issues/23): extend `website` to own server-rendered reading, the admin module and authenticated content/media APIs; introduce a bounded content-audit job for durable outbox retries. These are proposed boundaries in [cms-plan.md](cms-plan.md), not active services. Register the job and update website ownership through the service registration workflow before implementation; no catalog runtime entries are fabricated for this planning-only change.

Use the [service ownership and continuation contract](../.agents/skills/app-launchpad/references/services.md), [catalog schema](../schemas/catalog.schema.json) and [synthetic service example](../examples/web/SKILL.md). Review inventory completeness against actual source/runtime/deployment boundaries; automated validation covers declared mappings only.
