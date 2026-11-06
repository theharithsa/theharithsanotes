# CMS execution-report maintenance

Issue #23 adds scripts/run_foundation_tests.py to run the existing unittest discovery suite with real JUnit outcomes/durations. check.sh delegates to it; Foundation checks uploads only the bounded XML report. The trusted observer hashes case identities and drops error text. No template version bump: this is application-specific reporting. Existing foundation policy/schema behavior remains covered by the original suite.

# Foundation tooling continuation

## Website adoption — 5 November 2026

The upstream notes below are historical template context, not settings or evidence for this new repository. Current application work is issue #1 / PR #2. Implementation revision dceb62c9966602c36bcffa35faad858abd21f36b fixes Windows rooted-path rejection and lock handle cleanup. Synthetic tests are independent of the app’s approved decisions/catalog. Local suite: 21 discovered, 20 passed, one POSIX-shell case skipped. Linux PR CI runs the complete suite. Foundation/discovery and local Markdown link checks passed. No repository ruleset was created in the new repository; no tenant observer was configured.

- Scope: resolve template issues #9–#18: instruction owners, schemas/tooling, examples, agent intake, license, protection, bootstrap removal and SemVer.
- Reviewed implementation revision: 953717c787dd37d1500c04767f818f4e0a0faffd. The continuation/catalog pointer was updated afterward; verify current-head CI separately.
- Original source baseline inspected: f3d497930c732c557b2cbbd12c04450584fa0813. Subsequent reviewed action upgrades are PRs #3 and #4 (merged); the maintenance PR is linked from issues #9–#18.
- Implemented locally: canonical policy routing; schemas and accumulated diagnostics; shared check command/JSON mode/link checker; synthetic fixtures; MIT license; agent pointers/forms; safe ruleset preview/apply; valid template version 1.9.0.
- Local execution: `sh scripts/check.sh` passed all 21 tests and local Markdown links during implementation; all bundled skills and installed app-launchpad validate. These are working-tree results, not an assertion about a later head. Inspect the maintenance PR's live current-head CI before relying on a committed revision.
- Repository settings: active main ruleset 26130401 verified via GitHub read-back (PR, foundation check/up-to-date base, no force push/deletion, no bypass actors). Procedure: [repository ruleset](../../docs/repository-ruleset.md).
- Source delivery: inspect live issue/PR and remote merge state; tag v1.9.0 must point to the verified maintenance merge. Application/provider deployment is inapplicable to these local tools.
- Dynatrace: chosen platform for consumers; no live observer/tenant integration or signal verification is configured here.
- Remaining review responsibility: enumerate actual services and keep instructions semantically fresh. Validation cannot infer undeclared architecture. After interrupted generation, inspect locks/catalog/files before recovery.
- Next consumer action: generate the full template, record version/revision, decide the app's license and architecture, register actual services, and replace pending service facts with inspected implementation details. The removed partial bootstrap is not a supported adoption path.
