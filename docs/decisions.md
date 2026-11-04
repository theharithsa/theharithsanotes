# Decisions and unresolved questions

## The Harithsa Notes — 5 November 2026

| Area | Decision | Authority / consequence |
| --- | --- | --- |
| Product/design | Personal journal inspired by Gates Notes; original Harithsa branding, green/cream palette, forest feature, serif headlines | User request; retain 12 owned articles and their original slugs |
| Stack | Astro 7.4.5, TypeScript 5.9.3, static generation | Implementation choice for article SEO and simple hosting; no backend needed |
| Repository | theharithsa/theharithsanotes, private, generated from App Launchpad 1.9.0 | Explicit user answer; source revision in project.json |
| Hosting | Firebase Hosting project the-harithsa-notes-94, eventual domain theharithsa.com | Explicit user choice; preview first, existing domain intact until cutover |
| Privacy | Supplied Firebase GA4/Dynatrace RUM behind opt-in, ads denied, no identity/replay, local export off | Conservative implementation within requested analytics; tenant receipts pending |
| Data/auth | Local article JSON; no account, database, newsletter storage or forms | No requested durable writes; external profiles own transactions |
| License | Inherited MIT notice preserved; no additional source license granted | Private source requested |
| Release | Feature branch and issue-linked PR; preview before production cutover | No direct main push, merge or DNS change performed |

Windows adoption exposed inherited lock-cleanup and rooted-path loop bugs. Registration now closes its handle before deleting the lock, and the path guard rejects Unix/Windows anchors. Inherited tests create unconfigured synthetic fixtures independently of the actual app. The POSIX-shell entrypoint case runs in Linux CI and is skipped locally on Windows.

For each consequential decision record: question; proposed options/tradeoff; status (proposed/approved/needs-user-input); chosen value; approval source; consequences.

Decision areas: product rules, stack/runtime versions, deployment/cloud/project/region, auth/roles/tenancy, storage/jobs/integrations, design/brand, repository owner/visibility/main, Dynatrace tenant/RUM consent/identity, costs/retention, release/merge permissions.

None are pre-approved by this template. Ask the user directly when the answer is missing. Never paste secret values here.

## Template maintenance decisions — not consumer defaults

| Question | Decision/status | Alternatives and reason | Approval source | Consequence |
| --- | --- | --- | --- | --- |
| Template license | MIT / approved | Apache-2.0 considered; owner explicitly selected MIT | Human answer in this chat, 2026-10-29; issue #14 | Root LICENSE covers inherited template material; each generated application's license stays needs-user-input |
| Template version | 1.9.0 / approved | Replace custom 1.09.0 with valid SemVer for interoperable tooling | Issue #18 and human authorization to resolve all issues | No leading-zero numeric identifiers; tag v1.9.0 matches metadata |
| Partial bootstrap | Remove / approved implementation choice | Synchronizing partial assets still leaves missing catalog/tool references; full GitHub template is the default | Issue #17 alternative and human authorization to resolve all issues | No bundled asset duplicates; unavailable GitHub means adoption pending |
| Main protection | PR + foundation check; no force-push/deletion / approved | Sole-owner workflow uses zero mandatory approvals; actual checks remain required | Issue #13 and human authorization to resolve all issues | Apply opt-in settings procedure; no bypass actors |
