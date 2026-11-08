# Home categories section — design notes

Card: Trello #251. Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, files `Home Categories.html` (stage 1, options A/B/C) and `Home Categories A Spec.html` (option A final: frames, tile anatomy, state and layout tables; `cat-parts.jsx`, `cat-options.jsx`, `cat-app.jsx`, `cat-spec.jsx`). Audit that motivated it: ux-designer AUDIT of live dorent.am, 2026-11-08 (summarised on card #251).

## Approved decisions

1. Direction **A — compact grid** (Tigran, 2026-11-08): desktop shows every category at once (5 columns up to 10, 6 columns for 11+, rows wrap, no cap), no carousel arrows. Mobile: 2-row horizontal scroller, fixed 156 px tiles, 2 full columns + 44 px peek.
2. Tile: pastel fill = API `colorHex`; name first (left, 2 lines then ellipsis, never clipped mid-word); API icon secondary (desktop: right, in a white disc; mobile: above the name). Each tile is one button whose accessible name is the category name.
3. **No "see all" link** in the categories header (Tigran, 2026-11-08) — every tile already opens the catalogue.
4. Mobile order: hero → categories → map → trust strip → toy sections (Tigran, 2026-11-08). Desktop order unchanged.
5. A failed load shows an error card with a single retry action — never the "categories coming soon" empty copy. Empty state stays neutral (no warning colour, no action).
6. Interaction: hover only under `@media (hover:hover)`; visible pressed state on touch (as on toy cards); keyboard focus ring per ADR-031 and a focused tile scrolls fully into view in the mobile scroller; motion off under `prefers-reduced-motion`.
7. Loading skeleton has the same tile size and grid as the loaded state.
8. No new API data: no counts, photos or localized names (localization is card #263).
9. Where the scroller is used above mobile width (the intermediate range), prev/next arrows appear **only for pointer devices** (`@media (hover:hover)`): 44 px, disabled at the start/end of the track, focus ring distinct from hover (Tigran, 2026-11-08). Touch keeps swipe only; the ≥1024 grid has no arrows.

10. Responsive rule (`Home Categories A Responsive.html`, approved by Tigran with the implementation plan, 2026-11-08). Minimum label area 138 px:
    - < 640: scroller, 2 rows, 2 full columns + 44 px peek, gutter 18.
    - 640–767: scroller, 3 columns + peek, gutter 40. 768–1023: scroller, 4 columns + peek, gutter 40. Scroller tile width = `(100% − gutter − n×8 − 44) / n`.
    - 1024–1279: grid, 5 columns, **compact tile** (mobile anatomy: icon on top, no disc), gutter 70.
    - ≥ 1280: grid, standard tile, 5 columns; 6 columns for 11+ only from a 1508 px viewport (supersedes "6 columns for 11+" in item 1).
    - Arrows: scroller range only, `(hover:hover) and (pointer:fine)`.

## Open / not accepted

- Per-label `lang` attribute from the design: not implementable (the API has no name language) — the page language applies.
- Heading size and section spacing come from the existing `app-ui-section-header` and home section rhythm, not the one-off values in the spec (19/800, 32/40).
