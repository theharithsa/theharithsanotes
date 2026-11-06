# content-audit continuation

Issue #23 / merged PR #28, application 1.12.0. Source image revision `0e00af0155bf7844cce0da96d3766496cd452d5e`; image digest `sha256:44c2e0953d2e635e0e3199d6b95b5a9557b32f51533e2544af0640707ae9c5a2`.

Active shared durable outbox: four leased workers, stable IDs, 202-only acceptance, bounded retries/backoff, visible blocked state and delivered-only TTL. Scheduled OIDC HTTP drains have a 20-second budget every five minutes; the manual repair job has a 170-second budget and no recurring schedule. Bookkeeping and successful scheduled requests do not recursively enqueue events.

Preview/live web services and repair jobs run the same immutable image. Scheduler identity/audiences and narrow runtime secret/IAM are configured. Six emulator integration tests and independent binary protobuf checks passed. The actual tenant returned publication, Firebase operation, HTTP, workflow/job/step/test and deployment events, correlated logs, native SERVER spans and request metrics. Provider success and tenant searchability are separate evidence.

See [release evidence](../../docs/cms-release-1.12.0.md) for Hosting versions, queue observations and validation limits. Preserve pending/blocked records and delivery receipts on rollback. Browser control stopped before owner sign-in completed; do not claim an interactive editor pass.
