# CMS implementation continuation

Application 1.12.0 is implemented, merged and deployed to theharithsa.com. Issue #23 / PR #28; source image 0e00af0155bf7844cce0da96d3766496cd452d5e, merge 79717dd59fe549ad234e923e001c0c6b4fa47667. The original planning PR24 is closed as superseded. Keep theharithsa.com canonical and Margin identity 1.0.0.

Nine private collection tables support rich editing, autosaved drafts, explicit publication, owner Google auth/UID pin, secure private previews, revision conflicts/history/restore/unpublish, normalized media and public Firestore projections. Public archives/details/feed/sitemap read those projections. Blog date/tags and photo carousel are implemented. See cms-guide.md, cms-architecture.md and cms-release-1.12.0.md.

Both live/preview migrations and final Hosting checks passed: 168 entries, 263 owned media, 173 public routes, 498 byte-matching client assets. Original article bodies/dates and Goodreads ratings/reviews were compared. Created podcasts and GoGs remain empty. Preserve snapshot inputs; they are no longer the live authoring store.

Infrastructure is active in us-east1: Standard Native Firestore with deletion protection, deny-all client rules/indexes, private bucket, narrow runtime/build/scheduler identities, pinned Cloud Run/Hosting, OIDC schedules and Secret Manager binding. INR500 monthly alerts at 50/80/100 percent were configured/read back. No additional DNS changes. Do not print secrets; temporary operator ADC lives outside the repo and must be removed after use.

All implementation/main checks passed. Actual Dynatrace logs, metrics, spans, publication/operation events and source-owned workflow/deployment records were independently queried. Trusted observer report-only reruns passed after the live gateway became available. Application telemetry uses safe payload summaries; outbox bookkeeping/CDN hits are excluded from recursive events. Keep dtctl default airtel unchanged and explicitly select my-env for this project.

Browser control stopped during Google account selection. Do not bypass that stop or claim interactive owner sign-in/editor/mobile validation passed. Documented emulator and HTTP checks are separate evidence. Follow-up work can include an owner browser smoke test after a fresh authorized session. Roll back with static Hosting 58336dbdc5de13be if needed, without deleting CMS data or delivery receipts.
