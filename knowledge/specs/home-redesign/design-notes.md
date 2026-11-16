# Home redesign — design notes

Card: Trello #268. Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, `Home Redesign Stage 1.html` (`hm-app.jsx`, `hm-data.jsx`, `hm-parts.jsx`). ADR-064.

## Approved decisions

1. Stage 1 is implemented as drawn (Tigran, 2026-11-16): hero (H1 44/52 · 28/34, search pill with round submit), map beside the hero on desktop (560×360, 480 wide at 1280), categories per `specs/home-categories`, five toy rows, How it works, FAQ. Footer, bottom nav and header are unchanged.
2. Section titles 24/32 on desktop and 20/28 on mobile, w800; sections 64 px apart on desktop, 40 px on mobile; gutters via `--page-gutter` (ADR-063). Supersedes `home-categories` "Open" item 2 for Home.
3. Toy rows: desktop shows 4 cards + 54 px peek with overlay prev/next arrows; mobile shows 232 px cards with a 12 px gap and scroll-snap, no arrows.
4. Home-only toy card (ADR-064): image 0.86 (mobile) / 0.83 (desktop) of the width, age pill, "City, District", rating or "no reviews yet" (never a star without reviews), price + unit, condition chip, "View" pill on desktop only. The whole card is the link.
5. Map on touch: locked state with a light scrim, a "tap to move the map" hint and inactive zoom until tapped (within ADR-015).
6. The "Every toy is reviewed" trust strip is removed (as drawn).

## Open / not accepted

- Lending-mode step copy: the design flags it as duplicating the renting copy, and "Get paid and reviewed" can read as payment through DoRent. Not changed in Stage 1.
- The mobile "Opt2" tabbed toy section and the compact card variant (`Opt1b`) are explored options, not chosen.
