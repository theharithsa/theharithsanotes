# Meet Vish readability — 1.16.1

Issue #57 fixes the desktop biography being arranged as pairs of paragraphs in a two-column grid. The published narrative now uses a centered section capped at 720px and one continuous text column capped at 68ch, with 18px text, 1.8 line height and 1.4em between paragraphs. Phones use 17px text and the existing page insets. No breakpoint reintroduces columns or grid row gaps. The personal heading replaces the previous systems/work-led heading.

The existing CMS map still renders every paragraph in stored order. This release does not rewrite or republish the biography, change its image, add assets, change schemas or alter access/analytics. Gallery, links, footer and hero remain intact. No dependencies or template/brand versions change.

Validation: Astro check reports 0 errors/0 warnings and two existing Medium-import deprecation hints; static build and all 52 site tests pass. Chrome checks use the actual nine published public paragraphs in a local preview with the proposed CSS: desktop 1579px, tablet 768px and phone 320px show one block-flow column, increasing paragraph positions and no page overflow. Dark mode remains readable. The phone check uses emulated viewport sizing, not a physical device. Final current-head CI, immutable provider receipts and live browser verification are recorded on the linked PR.

Rollback uses the matching private-aware 1.16.0 runtime/client assets. CMS text, publication history, media and audit records remain untouched.
