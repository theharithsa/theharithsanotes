# Production launch — issue #12

The owner authorized deployment to theharithsa.com and replacement of conflicting website DNS records on 5 November 2026. This supersedes earlier preview-only release holds. Unrelated mail, verification and subdomain records must be preserved.

## Source and deployment

- PR #2 merged through GitHub at 2026-11-05T10:29:08Z, merge commit `a8c93050759fe359ae668bb6d61e78e1ae33ef3c`.
- Accepted PR head `bcd473b051664986287daf5d879ece0aa1002f3f` passed foundation, website and GitGuardian checks. Foundation and website checks also passed on the merge commit.
- Application version 1.7.0, implementation `43c386cf7717849945e6a1887cf9440af98be79e`.
- Firebase Hosting version `3c655055dc9ec2fa` promoted directly from its immutable version ID to the live channel; no rebuild or new application changes.
- Live release `1793874575598000`, observed release time 2026-11-05T10:29:35.598Z.
- Live URL: https://the-harithsa-notes-94.web.app.
- All 47 non-404 HTML documents returned HTTP 200 and matched the tested local artifact byte for byte. A missing route returned 404. Browser home rendered successfully.

## Domain transition — DNS saved, certificate validation pending

Firebase custom domains were created for theharithsa.com and www.theharithsa.com. The latter redirects to the apex domain. After owner sign-in, the DNS edits below were saved in GoDaddy on 5 November 2026 around 16:48–16:53 UTC. Both certificates remain validating; HTTPS launch is not yet complete.

Authoritative DNS is GoDaddy (ns09.domaincontrol.com and ns10.domaincontrol.com). Current website records and rollback values:

| Name | Type | Before launch | Firebase-required value |
| --- | --- | --- | --- |
| @ | A | 76.76.21.21 | 199.36.158.100 |
| www | CNAME | hashnode.network | the-harithsa-notes-94.web.app |
| @ | TXT | absent | hosting-site=the-harithsa-notes-94 |

These target values came from this site's Firebase custom-domain API responses, not generic assumptions. The two existing website records were edited in place, and the Firebase ownership TXT record was added. Firebase-issued TXT challenges were also added at `_acme-challenge` and `_acme-challenge.www`; their ephemeral values remain in the ignored local execution evidence, not this runbook. The zone now contains 16 records, compared with 13 before the change.

Authoritative GoDaddy DNS and public resolvers 1.1.1.1/8.8.8.8 returned the new A/CNAME targets. Authoritative DNS confirmed ownership and both ACME TXT records. iCloud MX, DKIM, SPF, Apple verification, GitHub Pages verification, portfolio verification, nameservers and Domain Connect were preserved. A full pre-edit table snapshot is saved locally at `qa/local/dns-before.txt` for rollback.

At 16:52 UTC Firebase detected the new apex A record but still had cached ownership TXT and www CNAME results; no additional DNS correction was indicated by authoritative results. HTTP redirects to HTTPS, but HTTPS certificate verification still fails while provisioning continues. Do not disable certificate validation or bypass a browser security warning. Firebase documents that certificate deployment may take up to 24 hours after the DNS cutover: https://firebase.google.com/docs/hosting/custom-domain.

There was no previous live Firebase release. The accepted Hosting version remains available for repeat promotion. Before DNS changes, rollback means leaving the original domain records intact; after changes, restore the two previous website records above if a cutover regression requires it. Do not remove unrelated or previously existing TXT records.

## Remaining acceptance

- DNS edits and authoritative/public target verification completed.
- Await Firebase DNS cache refresh, ownership/host reconciliation and certificate activation; then verify HTTPS apex content and www redirect.
- Record final results and close issue #12 only when complete.
- Google Analytics and Dynatrace receipt/searchability remain separately unverified. This deployment does not establish tenant ingestion evidence.
