# Compact private reader — 1.20.1

Issue #74 reduces the private reader title, cover and prose scale. Body copy uses 18px/1.65 on desktop and 17px on phones with tighter paragraph and heading spacing. The cover stays inside the 760px reading column and is capped at 360px.

Consecutive top-level figures share a CSS grid: three columns above 600px, two on phones, 12px/8px gutters. Prose and headings span the complete column, interrupting photo runs; standalone figures remain full width. Images keep their intrinsic proportions without cropping, alt text and source order. No JavaScript grouping, HTML schema change or new dependency is needed. The rule applies only to the invitation-only reader; public Blog typography is unchanged.

Journal prose can be combined into coherent paragraphs through the existing revisioned content API independently of this release. Never include private content or photos in source, fixtures, screenshots or deployment archives. Invitation checks and media authorization remain unchanged.

Validation: check/build/site tests, CMS regressions, server build and synthetic desktop/phone browser geometry. Current-head CI and immutable provider release evidence belong on the linked PR. Rollback uses matching private-aware 1.20.0 runtime/client artifacts; retain content revisions.
