# Website observability

Service: `the-harithsa-notes-web`; namespace `theharithsa`; release 1.0.0. This is a static site. There is no application server, database, worker, or durable business transaction to instrument. Backend OTel exporters, canonical business events, and RUM-to-server trace linkage are inapplicable until a real backend exists.

## Browser coverage

| Journey | Actor/outcome | Signals | Evidence |
| --- | --- | --- | --- |
| Read a note or navigate | Anonymous reader; static page response | Approved Dynatrace agent, performance/error auto-capture; GA page_view | Local pages and navigation verified; tenant receipt pending |
| Search/filter | Anonymous reader; locally filtered cards | Local interaction only; search text never exported by custom code | Search, empty state, reset, topic filter checked in browser |
| Consent | Anonymous reader; stored preference or page-only fallback | No analytics request before choice; default-denied advertising | Automated first-visit/denial/local isolation tests |
| Runtime failure | Browser; bounded error class | Feature-detected dtrum.reportCustomError | No raw exception text or input included; tenant record pending |
| Outbound mentoring/project link | Browser navigation to external service | Normal link; no booking or project-use success claimed | External services own their results |

The exact supplied RUM tag is loaded once after consent by the head-loaded `src/scripts/telemetry.ts`. It loads on subsequent pages when a granted choice is restored. Automatic RUM capture is retained; no duplicate manual click actions or custom properties are added. Session Replay is not enabled by code; `disableSessionReplay` is called if the installed agent exposes it. **Keep Replay disabled in the Dynatrace application configuration before launch.** No identifyUser calls, generated persistent identity, fingerprints, or email tagging are introduced.

Firebase initializes only in a supported browser after consent. Analytics measurement ID: `G-VZF9P08XB9`. Advertising storage, advertising user data, personalization and Google signals are disabled by this application. One explicit page_view uses the origin/path without query or fragment. Firebase SDK capability checks and initialization errors never block reading. Google Analytics property settings and Firebase project linkage have not been changed or independently verified.

Preference key: `harithsa.analytics.v1`, values `granted` or `denied`, browser scope. Cookie settings reopens the choice. Withdrawing disables the agent where supported, updates Google consent, and reloads to unload monitoring. Provider cookies and previously ingested data are not deleted. Blocked storage falls back to the current page. Localhost and loopback telemetry remain disabled by default even after consent; opt-in requires an explicit local environment setting.

## Tenant and secrets

The provided tenant host strings are incomplete or appear misspelled. Do not derive an OTLP endpoint or send the platform token to a guessed hostname. The RUM CDN URL is used exactly as supplied; its beacon destination is owned by the agent configuration. A privileged token was supplied in chat but is not saved, used in the build, or committed. Rotate it before future use. Future server-side names would be `DYNATRACE_OTLP_ENDPOINT` and `DYNATRACE_API_TOKEN`; there is no exporter or secret binding in this release.

## SDLC and CI evidence

Issue #1 and the linked feature PR own intake and delivery. App CI runs type checks, a static build, and real Node tests without production credentials. Foundation CI runs the inherited tooling suite. There is no trusted webhook observer or tenant-side SDLC/CI exporter configured; event delivery/searchability is explicitly pending. A green check proves its runner result, not deployment or tenant ingestion. Do not infer backend traces, host metrics, ingestion success, or source-to-runtime correlation from the RUM tag.

## Production verification and recovery

After the approved Hosting release, verify scripts and beacon requests after consent, no requests on denial, route changes, one GA page_view per navigation, unsupported/blocked analytics behavior, and a safe bounded error in an isolated session. Check GA Realtime/DebugView and the exact Dynatrace application/session. Record native signal receipts separately from searchable tenant records. Do not turn on local production export to manufacture test evidence.

Rollback: restore the previous Firebase Hosting release; restore prior DNS only if cutover occurred. Telemetry failure must never block reading. The site has no data migration or database rollback. Retention, sampling, and provider configuration remain owned by their consoles and need review before public launch.
