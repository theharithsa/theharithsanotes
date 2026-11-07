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
- Use Firebase services for new hosting and storage work. Cloud Run and Docker Hub describe the legacy live runtime below. A replacement must preserve publishing and invitation-only reading before retiring that runtime. Freeze image uploads to Hosting and pause new runtime deployments until the owner approves a Firebase-only design.

- Aim for zero incremental deployment cost. Treat included credits as a discount on usage. Verify the free allowance before choosing hosted build compute, storage, or transfer. Ask the owner before introducing a paid dependency or raising a resource limit.
- Build `linux/amd64` with local Docker from a clean Git archive. Inspect the final image for private content and credentials, push to `docker.io/theharithsa/harithsa-notes`, and deploy the verified `sha256` digest to Cloud Run. Reuse the same digest for preview and production. Keep Cloud Build disabled and Artifact Registry empty. Use an existing prebuilt image or stop for a decision if the local build path is unavailable.
- Keep Cloud Run at zero minimum instances. Preserve the private reading and publishing controls and verify the live Hosting pin after promotion. Keep a verified rollback image and matching client assets. Review cloud build artifacts and preview release retention for avoidable storage charges.
- Track Firebase Hosting downloads, Firestore, Cloud Storage, Cloud Run, and telemetry separately. Measure requests and bytes before changing media delivery. Budget alerts report spend without stopping it. See the [CMS architecture](../../docs/cms-architecture.md) for the current runtime and release steps.
- Treat Firebase Hosting totals as the billing source and Cloud Run logs as origin traffic only. Check whether Hosting request logs existed in the incident window before assigning bytes to a URL. Use local fixtures for image and repeated browser checks, then run a small live smoke test. Prefer existing CMS 400/800/1600 px variants and reserve full-size downloads for large displays or explicit gallery viewing. Cache public static artwork by path and preserve private media authorization and `no-store`.
