---
name: project-deployment
description: Prepare, execute and verify authorized releases and rollback.
---

# Project Deployment

- Read the service operations context and release impact plan. [Service context](../../.agents/skills/app-launchpad/references/services.md).
- Resolve provider/environment/identity and authorization. [Boundaries](../../.agents/skills/app-launchpad/references/safety.md).
- Follow current-head checks, immutable delivery and rollback steps. [Release procedure](../../.agents/skills/app-launchpad/references/github-release.md).
- Record source/deployment/runtime states separately. [Evidence](../../.agents/skills/app-launchpad/references/evidence.md).

## Cost policy for The Harithsa Notes

- Keep total Firebase Hosting storage below 1 GB, including live, preview, and retained releases. Verify the existing total and the proposed upload before releasing. Keep artwork masters, ZIPs, and rollback bundles only in the Git-ignored `archives/` directory. Exclude that directory from container contexts and Hosting deploys.
- Use Firebase Functions and Firebase Storage for new hosting and storage work. Follow the [Firebase-only migration plan](../../docs/firebase-only-migration.md) before changing the runtime. Preserve web publishing and invitation-only reading. Exclude artwork from Hosting releases, verify Storage transfer costs, and keep a one-day cleanup policy on Firebase Functions build artifacts.

- Aim for zero incremental deployment cost. Treat included credits as a discount on usage. Verify the free allowance before choosing hosted build compute, storage, or transfer. Ask the owner before introducing a paid dependency or raising a resource limit.
- The former Docker Hub image and Hosting artifact are recovery inputs for the legacy Cloud Run service. Firebase Functions uses Cloud Build and Artifact Registry to create its deployment artifact. Keep the staged source small and confirm cleanup after each release.
- Keep Cloud Run at zero minimum instances. Preserve the private reading and publishing controls and verify the live Hosting pin after promotion. Keep a verified rollback image and matching client assets. Review cloud build artifacts and preview release retention for avoidable storage charges.
- Track Firebase Hosting downloads, Firestore, Cloud Storage, Cloud Run, and telemetry separately. Measure requests and bytes before changing media delivery. Budget alerts report spend without stopping it. See the [CMS architecture](../../docs/cms-architecture.md) for the current runtime and release steps.
- Treat Firebase Hosting totals as the billing source and Cloud Run logs as origin traffic only. Check whether Hosting request logs existed in the incident window before assigning bytes to a URL. Use local fixtures for image and repeated browser checks, then run a small live smoke test. Prefer existing CMS 400/800/1600 px variants and reserve full-size downloads for large displays or explicit gallery viewing. Cache public static artwork by path and preserve private media authorization and `no-store`.
