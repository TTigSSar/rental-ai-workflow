# Share meeting point — design notes

Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, files `Share Meeting Point Stage 1.html` (`mp-parts.jsx`, `mp-app.jsx`) and `Share Meeting Point Stage 2.html` (`mp2-parts.jsx`, `mp2-app.jsx`). Decision: [ADR-053](../../decisions.md). Trello P3-1.

## Approved decisions

1. Owner-only pin button in the composer, next to the photo button (stage-1 option a), not in the rental-card menu (Tigran, 2026-10-27).
2. After the tap: a chooser dialog — "My home point" / "Another place"; one primary button whose label follows the choice; no home point → home option disabled with "Set home point".
3. "Another place" is picked on the map in the existing location-picker look (fixed centre pin, district chip, confirm disabled until the map moved). Confirm uses `primary-strong` `#C24600` (ADR-031).
4. Meeting points are Yerevan only; outside → red chip and blocked confirm (frame iv kept).
5. Bubble = proposal A: "Meeting point" + subtitle "Owner's home" for home shares, no subtitle for another place; "Open in maps" link row; no coordinates/address; no mini map.
6. Inbox preview: pin icon + localized "Meeting point" (+ "You:").

## Open / not accepted

- RU/HY copy is a draft; native-speaker check pending.
- Mini map in the bubble: not accepted for v1 (quota).
