# Feature and signal coverage

| Feature | Acceptance and coverage | Owner |
| --- | --- | --- |
| Editorial pages | Static home/about/projects/privacy/404; responsive desktop and phone browser checks | website |
| Personal gallery | Six selected photographs, replacement About portrait, native modal, arrow keys/Escape/focus restoration; desktop/mobile checks | website |
| Project workbench | Eleven entries verified against GitHub/public project pages; user supplied FinVision AI link; local image/link checks | website |
| Article migration | 12 original paths and substantive sanitized article bodies; local images and link resolution tested | website |
| Discovery | Case-insensitive title/description/topic search, topic filtering, live count, empty/reset states; browser checked | website |
| Accessibility | Skip link, semantic controls, selected state, keyboard focus, Escape menu, reduced motion | website |
| SEO/distribution | Canonicals, metadata, Person JSON-LD, RSS and sitemap; built feed/link tests | website |
| Browser telemetry | Consent isolation/local guard tests; actual production GA/RUM receipt pending | website |
| Hosting | Firebase static config, cache/security headers, review channel command; execution evidence separate | website |
| CI/foundation | Node application checks and inherited Python suite; current-head results must be verified | foundation-tooling / website |

No auth, mutable database, concurrency, canonical business events, backend OTel or workers are present. Search is browser-local and does not claim a server outcome. Full monitoring limitations and recovery are in [observability](observability.md). Execution belongs in [evidence](../qa/evidence.json).
