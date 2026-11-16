# Listing hero (mobile) — design notes

Trello #270. Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `Listing Hero Stage 1.html`. Scope: `/listings/:id` at <1100px; desktop unchanged.

## Approved decisions

1. No title bar (`app-ui-page-header`) on <1100px; the hero starts at the top of the viewport (Tigran, 2026-11-16).
2. Hero: full bleed, `aspect-ratio: 4/5; max-height: 70svh`, bleed via `--page-gutter` (ADR-063), no `100vw`.
3. Back button: round 44×44 translucent white pill (white 86%, 12px blur, 1px #1a1b26/10% edge, soft shadow, dark arrow), top `env(safe-area-inset-top) + 8px`, left 12px (16px on tablet). Focus: 2px #c24600 outline, 2px offset, white halo.
4. Back behaviour: history back; `/listings` fallback when there is no in-app history. Scrolls away with the photo; no sticky bar.
5. Top scrim: #10121e 38% → 0 over safe area + 72px.
6. Photo counter: bottom-right dark pill (#1a1b26/78%, white 13px/600), 32px above the hero bottom, ≥44px hit area.
7. Content edge: sheet on page background, 20px top radius, overlaps the hero by 20px, soft upward shadow.
8. Landscape photos: option 05A — whole photo (`contain`) over a blurred backdrop (as today).
9. Heart and share stay as they are today (pill buttons with text, next to the title) — the design's icon-only row was not accepted (Tigran, 2026-11-17).

## Open / not accepted

- Age/condition chips under the price — not added (out of scope; duplicates the specs block). Tigran, 2026-11-17.
- Sticky compact title on scroll — not decided; stage 2 if wanted.
- Loading/no-photo/single-photo states — stage 2.
