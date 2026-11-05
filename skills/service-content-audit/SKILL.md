---
name: service-content-audit
description: Maintain the scheduled durable CMS audit delivery job.
---

# Content audit

Owner: theharithsa. Active implementation in `jobs/content-audit/main.mts` and shared `src/server/outbox.ts`. Read [continuation](continuation.md), [architecture](../../docs/cms-architecture.md) and [observability](../../docs/observability.md).

The shared outbox code drains each environment every five minutes through the web service’s OIDC-protected delivery endpoint. The longer Cloud Run job is available on demand for repair; it is not scheduled, avoiding recurring minimum job charges. Four bounded workers acquire transaction leases, preserve event IDs and original producer context, emit linked ingestion spans and safe metrics/logs, and persist delivery state. A run stops claiming work after 170 seconds. HTTP 202 marks accepted delivery; pending failures back off and permanent 4xx/max attempts become visible blocked entries. Delivered entries have a 30-day TTL; pending/blocked entries never expire. Bookkeeping does not recursively enqueue itself.

Runtime identity is `harithsa-notes-content-audit` in namespace `harithsa-notes`, with explicit release/environment/source revision. The runtime SA reads only the existing ingest secret reference, never a browser credential. The scheduler uses an audience-scoped Google OIDC identity checked against the exact scheduler service account; manual job invocation uses IAM. API retry is owner-only and has a shorter drain budget.

Run `npm run test:cms` for real emulator transaction/lease/retry behavior and `node --test tests/telemetry.test.mjs` for independent binary OTLP correlation/temporality checks. Deploy web and worker from the same immutable image through `scripts/deploy-runtime.ts`. Roll back to a compatible image without deleting outbox rows or resetting receipts. Inspect backlog, oldest age, failures and actual tenant records separately from provider execution success.
