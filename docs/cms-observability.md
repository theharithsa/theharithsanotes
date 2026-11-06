# CMS and delivery observability

Application 1.12.0 adds real server-side telemetry. This replaces the earlier static-only observability boundary. Use [architecture](cms-architecture.md) for deployment/IAM, [the workspace guide](cms-guide.md) for publishing and [testing](testing.md) for evidence.

## Identity and signals

| Runtime                  | Service                        | Environment                     |
| ------------------------ | ------------------------------ | ------------------------------- |
| Astro, CMS API and media | `harithsa-notes-web`           | live / preview                  |
| Scheduled outbox         | `harithsa-notes-content-audit` | live / preview                  |
| Trusted GitHub reports   | `harithsa-notes-ci`            | live gateway, actual source SHA |

All use namespace `harithsa-notes`. Node OTel resource attributes carry service version, source revision and actual Cloud Run service/job/revision where available. Local checks do not claim Cloud Run resource identity. The preload runs before application imports. The manual incoming root avoids duplicate HTTP server spans; HTTP/gRPC and Firestore SDK spans represent actual dependencies.

Binary OTLP endpoints are `https://indiacs.live.dynatrace.com/api/v2/otlp/v1/{traces,logs,metrics}`. BizEvents use `https://indiacs.live.dynatrace.com/api/v2/bizevents/ingest`. The approved credential is Secret Manager `harithsa-dynatrace-ingest`, version 1, referenced only by the runtime/job. It is absent from browser bundles, GitHub checks and build arguments. Do not use unrelated dtctl credentials or a demo tenant. Task queries must explicitly select dtctl context `my-env`; the user's default `airtel` context is preserved.

The browser retains the supplied RUM tag and Firebase GA configuration, gated by public consent. The workspace and authenticated draft previews disable both browser products to protect draft DOM content. Server monitoring does not depend on browser consent. There is no custom identified RUM user, email tagging, replay enablement, or claimed native RUM-to-backend linkage. Server W3C trace propagation is implemented independently; incoming trace context is not an authentication credential.

## Coverage

| Boundary                       | Committed outcome / event                                                                           | Failure and recovery                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Draft save / restore           | Immutable revision plus `content.draft_saved` / `content.revision_restored` in the same transaction | Conflict rejects without overwrite; recovery copy in the editor                                            |
| Publish / unpublish            | Public pointer plus `content.published` / `content.unpublished` atomically                          | Validation, revision, slug or missing media reject before commit; stable publish operation key             |
| Media upload                   | Private normalized derivatives, media record and `media.ready`                                      | Size/magic/decode limits; content-addressed retries preserve existing object generations                   |
| Firebase semantic operation    | `firebase.operation` with model, operation, outcome, duration and safe request/response summaries   | Finite error type in span/log/metric/event; ordinary monitoring failure does not reverse a saved operation |
| Application HTTP request       | `http.request` with normalized route, known method, status, request ID and duration                 | Bounded safe error response; no query strings, bearer headers or cookies exported                          |
| Outbox delivery                | Linked `audit.ingest` spans and delivery/backlog/oldest-age metrics; event retains producer IDs     | Leases, bounded retries, Retry-After, permanent blocked state and owner retry                              |
| CI                             | `sdlc.workflow`, `sdlc.job`, `sdlc.step`, `sdlc.test`; issue and PR transitions                     | Observer fails visibly on rejection; short-lived OIDC, idempotent receipt IDs                              |
| Runtime deployment             | `sdlc.deployment` started, provider-ready or failed with actual SHA/digest/revision                 | Provider operation is polled; previous immutable Hosting/image retained                                    |
| Initial live content migration | `migration.completed` with verified entry/image counts                                              | Immutable manifest hashes, restartable content-addressed copies and publications                           |

Auth verification, owner UID pin checks and session creation have their own safe Firebase operation summaries. Exported summaries contain serialized byte length, SHA256 and bounded top-level property names. They contain no raw request/response content, ID tokens, session cookies, email addresses, image bytes, draft prose or search terms. JSON hashes are correlation/checksum metadata, not a recoverable content backup.

This is application-level coverage: successful scheduled delivery HTTP audit writes and outbox writes/leases/receipts are excluded from event recursion; Google-internal transport retries and infrastructure are not represented as invented application BizEvents. CDN cache hits and static assets served by Hosting do not reach the application middleware. Logs/traces can be dropped during abrupt termination, backpressure or ingestion outages. Business audit delivery is durable and at least once, not exactly once.

## Correlation and bounded dimensions

Actual request IDs identify attempts. Stable content/revision/operation/event IDs correlate committed outcomes and retries. The producer's real OTel trace ID, span ID and flags accompany an event; the worker creates a native span link when valid context exists. It does not fabricate IDs for imports or pretend asynchronous work is a synchronous child. Imported/CI records without execution context use source IDs and explicitly stated authority.

Metrics are `journal.http.requests`, `journal.http.duration` (seconds), `journal.firebase.duration` (seconds), `journal.audit.capture_failures`, `journal.audit.deliveries`, `journal.audit.delivery_lag` (seconds), `journal.audit.backlog` and `journal.audit.oldest_age` (seconds). OTel metric export is DELTA. Routes, methods, operation/model/outcome/error classes are bounded labels; article titles, content IDs, user IDs and CI run IDs are not metric dimensions. Latency histograms use explicit seconds buckets.

Outbox delivery accepts only HTTP 202. A crash after acceptance and before receipt can replay the same event ID. Use distinct `event.id` when counting business outcomes. Pending/blocked rows retain their data; only delivered rows receive a 30-day TTL. Inspect queue health and actual tenant queries separately from a successful Cloud Run execution.

## Trusted CI reports

`.github/workflows/observability.yml` runs trusted main. Its exact workflow ref, repository, issuer, audience and event type are validated server-side. PR-triggered reporting never checks out or executes PR code. Actual GitHub API statuses and runner JUnit reports supply outcomes. Downloaded artifacts are bounded and allowlisted XML members; neither artifacts nor their contents are executed. Free-text test failures/logs are discarded. Test identities are hashed; measured case duration is retained. The event time is the workflow's observed completion time when the runner does not provide an individual case timestamp.

Stable source IDs include repository, execution attempt, job/step/case identity. Report-only retries retain original execution attempt and add the reporting run/attempt. Operational gateway telemetry remains server-observed; execution outcomes are `ci-reported`. These are not synthesized runtime business successes.

## Verification and limits

Local checks independently decode emitted OTLP protobuf and verify two concurrent traces, correct parents, correlated log trace/span IDs, resource identity, metric units/DELTA temporality and private payload exclusion. Emulator tests exercise real draft/publication transactions, conflicts, duplicate publishes, aliases/history, auth denials, media visibility, security rules and worker leases/retries.

The first real development milestone was ingested with 202 and independently queried in the tenant. A preview request root and its Firestore child spans were independently returned from `fetch spans` in context `my-env`. Empty protobuf acceptance probes for all three endpoints returned 200; that alone is not proof of searchable logs or metrics. Final deployment receipts must separately record searchable live logs, metrics, BizEvents and source workflow records. Do not turn a local test, provider success or HTTP acceptance into a tenant-searchability claim.

Browser inspection reached the hosted Google account chooser but Windows browser control stopped before the owner selection completed. The interactive owner sign-in/editor flow remains explicitly unverified until a browser check completes; emulator authorization tests are separate evidence.
