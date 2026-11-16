# FAQ page — design notes

Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `FAQ.html` (imports `hm-faq.jsx`, `hm-parts.jsx`, `hm-data.jsx`; `hm-faq.jsx` is copied to `design/`). Plan: Trello #267.

## Approved decisions
1. Content is the live content: all 5 groups and 14 questions, same i18n keys, texts and order. The questions and groups in the design are mockup copy (Tigran, 2026-11-16).
2. The app shell's header, footer and bottom nav stay. The design's own header and footer are context only.
3. Breadcrumb "Главная › Частые вопросы" above the H1. The old dark hero is removed.
4. Group heading is an h2 with a full-width 1px `--ui-color-primary` underline.
5. The open accordion item gets a neutral `--ui-color-border-input` border, with no orange border or shadow. The chevron rotates 180° and does not animate under reduced motion.
6. On desktop (≥1100) the page is two columns, `360px | 1fr`. The left `<aside>` (crumb, H1, help card) is sticky as one block, offset by the fixed header height.
7. On mobile the aside is `display: contents` and the help card is moved below the groups with `order`. The accepted trade-off is that a screen reader reaches the help card before the questions.
8. Colours come from tokens only (`src/styles.css`), with no hard-coded hex.

## Open / not accepted
- (none)
