# FAQ page — design notes

Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `FAQ.html` (imports `hm-faq.jsx`, `hm-parts.jsx`, `hm-data.jsx`; `hm-faq.jsx` is copied to `design/`). Plan: Trello #267.

## Approved decisions
1. Content is the live content: all 5 groups and 14 questions, same i18n keys, texts and order. The questions and groups in the design are mockup copy (Tigran, 2026-11-16).
2. The app shell's header, footer and bottom nav stay. The design's own header and footer are context only.
3. The old dark hero is KEPT, overriding the design that removed it (Tigran, 2026-11-16, after the before/after review). Inside it are the breadcrumb, a 64px orange circle badge with a white `pi-comments` icon in place of the old "?", the H1 and the lead. Below it, the left column holds only the help card.
9. The home page no longer has a FAQ section (Tigran, 2026-11-16). `/faq` is reached from the footer.
4. Group heading is an h2 with a full-width 1px `--ui-color-primary` underline.
5. The open accordion item gets a neutral `--ui-color-border-input` border, with no orange border or shadow. The chevron rotates 180° and does not animate under reduced motion.
6. On desktop (≥1100) the area under the hero is two columns, `360px | 1fr`. The help card is sticky on the left, offset by the header height (61px + 24px).
7. The help card comes after the groups in the DOM on every width. On desktop, grid places it in the left column, so the visual order and the reading order match.
8. Colours come from tokens only (`src/styles.css`), with no hard-coded hex.

## Open / not accepted
- (none)
