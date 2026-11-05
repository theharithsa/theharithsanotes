# Production launch — issue #12

Verified baseline after 1.9.0: both custom domains report HOST_ACTIVE, OWNERSHIP_ACTIVE and CERT_ACTIVE. All 172 non-404 HTML documents on theharithsa.com matched the tested artifact; missing route returned 404; www redirects to the apex with 301. Immutable version 1588549d63a02e96, release 1793904916376000; PR #20 merge 6548dd8f1668417b9f095c2be1ede911c83831ee. Issue #12 is complete. Earlier sign-in/DNS/certificate holds below are historical and superseded; later release receipts belong to their own issues.

The owner authorized deployment to theharithsa.com and replacement of conflicting website DNS records on 5 November 2026. This supersedes earlier preview-only release holds. Unrelated mail, verification and subdomain records must be preserved.

## Source and deployment

- PR #2 merged through GitHub at 2026-11-05T10:29:08Z, merge commit `a8c93050759fe359ae668bb6d61e78e1ae33ef3c`.
- Accepted PR head `bcd473b051664986287daf5d879ece0aa1002f3f` passed foundation, website and GitGuardian checks. Foundation and website checks also passed on the merge commit.
- Application version 1.7.0, implementation `43c386cf7717849945e6a1887cf9440af98be79e`.
- Firebase Hosting version `3c655055dc9ec2fa` promoted directly from its immutable version ID to the live channel; no rebuild or new application changes.
- Live release `1793874575598000`, observed release time 2026-11-05T10:29:35.598Z.
- Live URL: https://the-harithsa-notes-94.web.app.
- All 47 non-404 HTML documents returned HTTP 200 and matched the tested local artifact byte for byte. A missing route returned 404. Browser home rendered successfully.

## Domain transition — pending DNS access

Firebase custom domains were created for theharithsa.com and www.theharithsa.com. The latter redirects to the apex domain. At this observation both remain HOST_MISMATCH / OWNERSHIP_MISSING with certificates validating; domain launch is not yet complete.

Authoritative DNS is GoDaddy (ns09.domaincontrol.com and ns10.domaincontrol.com). Current website records and rollback values:

| Name | Type | Before launch | Firebase-required value |
| --- | --- | --- | --- |
| @ | A | 76.76.21.21 | 199.36.158.100 |
| www | CNAME | hashnode.network | the-harithsa-notes-94.web.app |
| @ | TXT | absent | hosting-site=the-harithsa-notes-94 |

These target values came from this site's Firebase custom-domain API responses, not generic assumptions. Preserve existing Apple verification, iCloud SPF/MX/DKIM and all unrelated records. GoDaddy currently requires owner sign-in; no DNS changes have been made. Verify the full zone before editing, and refresh Firebase certificate challenges if needed rather than copying expired challenges.

There was no previous live Firebase release. The accepted Hosting version remains available for repeat promotion. Before DNS changes, rollback means leaving the original domain records intact; after changes, restore the two previous website records above if a cutover regression requires it. Do not remove unrelated or previously existing TXT records.

## Remaining acceptance

- Sign in to GoDaddy and edit only conflicting website records; add Firebase ownership verification.
- Verify authoritative and public DNS, Firebase domain ownership/host states, certificate activation, HTTPS apex content and www redirect.
- Record final results and close issue #12 only when complete.
- Google Analytics and Dynatrace receipt/searchability remain separately unverified. This deployment does not establish tenant ingestion evidence.
