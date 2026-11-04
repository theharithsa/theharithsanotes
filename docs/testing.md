# Website and foundation checks

Node.js 24, npm, Python 3.11+. Run `npm ci`, `npm run check`, `npm run build`, then `npm test`. Eight Node tests cover complete article migration/path preservation, every internal built link/local asset (including gallery), preserved list counts/section anchors, RSS/sitemap completeness, LinkedIn attribution/content discovery and dt-mac-agent, secret exclusion, first-visit/denied-consent isolation, and localhost/blocked-storage isolation. They exercise built artifacts and the actual telemetry script in an isolated VM; they do not contact production telemetry.

Browser checks performed at 1440×1000 and 390×844: desktop hero, mobile archive, search to one result, no-results message, reset, topic filter, mobile menu, Escape dismissal and focus return. Mobile archive had zero broken loaded images and no horizontal overflow. Provider receipts/tenant sessions remain separate from these local checks. Tests do not claim Firebase writes, real GA ingestion, or Dynatrace receipt.

Refinement browser checks: editorial hero and gallery at 1440×1000; gallery and home at 390×844; About/projects/article at 320×740. Eleven project entries and zero broken loaded project images observed. Serif body font confirmed; the first three bullet paragraphs had 0px top/bottom margins. Gallery opens, ArrowRight changes photo, Escape closes, original button regains focus, and scroll lock is removed. Contents anchors scroll to real article headings. No overflow observed on the narrow pages.

`npm audit --audit-level=high` verifies the pinned dependency graph. An explicit grpc-js 1.14.7 override resolves the advisory in the unused Firestore branch of Firebase’s umbrella package. Only app/analytics are imported by the client.

## Inherited foundation checks

Windows results: 21 discovered, 20 passed, one POSIX-shell case skipped. Linux CI runs that case. Fixtures reset discovery decisions and exclude the app-specific service so template tests remain independent of the configured application. Registration scenarios cover Windows rooted-path rejection and lock cleanup.

Python 3.11+ and a POSIX shell; standard library only:

```sh
sh scripts/check.sh
python3 scripts/check_foundation.py --json
python3 scripts/check_foundation.py --ready --json
```

The shared entrypoint runs metadata/version/skill validation, local Markdown links and unit tests. README, catalog and CI use that same entrypoint. JSON output has `ok`, deterministic `errors`, and `ready` (whether discovery checks were requested); failures exit nonzero in either mode.

The [schemas](../schemas/README.md) own field shapes. The Python gate adds internal-path/reference/dependency checks and ready/active semantics. Tests cover multi-error diagnostics, malformed structures, schema/constant parity, SemVer, service generation and rollback, link failures, CI command agreement and ruleset dry-run behavior.

For actual application suites follow the [test contract](../.agents/skills/app-launchpad/references/testing.md) and [evidence rules](../.agents/skills/app-launchpad/references/evidence.md). Record real commands/prerequisites in the relevant service skill after stack selection. `examples/` is synthetic reference material and never execution proof or a cataloged service. Raw local artifacts remain ignored under `qa/local/` or `qa/raw/`.
