# Catalogue map view — Maps P2-2 (2026-08-01)

The consumer for the pins endpoint built in
[`2026-07-24-listings-district-filter-and-map-pins.md`](2026-07-24-listings-district-filter-and-map-pins.md),
sitting on the geo model from
[`2026-07-25-geohash-precision-and-radius-circle.md`](2026-07-25-geohash-precision-and-radius-circle.md)
and reusing the map component built in
[`2026-07-26-location-and-radius-ui.md`](2026-07-26-location-and-radius-ui.md). Read those first —
this note assumes their decisions. Architecture and rejected alternatives live in **ADR-012**; this
note covers what shipped and what did not.

## What shipped

`rental-api` `fd13ebe`, `Rental-Ui` `8decd20`, both on `dev`.

- **`/listings` gained a List/Map toggle**, mode in the URL as `?view=map`. In map mode the results
  grid and "load more" are not rendered; the filters sidebar, active-filter chips, mobile sheet, sort
  and result count keep working against the same store slice — a fourth surface joining that state,
  not cloning it.
- **The map** draws each matching listing at its published geohash-7 centroid as a 150 m circle with
  the brand ball (ADR-011) at the centre. Balls are static; hovering bounces one and opens a popup
  beside it with photo, title, price, rating and a link to the listing. Listings sharing a published
  coordinate collapse to one circle, one ball and a count badge, with every card in a scrollable
  vertical stack.
- **`app-map`** gained a multi-marker API (`markers`, `markerRadiusMeters`, `markerCircleMinZoom`,
  `activeMarkerKey`, `markerLabel`/`markerGroupLabel`; `markerHovered`, `markerActivated`,
  `viewportChanged`, `mapClicked`) and a fourth projection slot, `[app-map-overlay]`. It remains the
  only file allowed to import Leaflet, and no Leaflet type crosses its boundary.
- **`ListingMapPinResponse`** gained `Rating`/`ReviewCount` — projection-only, reusing the catalogue's
  existing `ToyReviews` subquery pair including its 2-review threshold, so map and list agree by
  construction.
- **First HTTP-level tests for `GET /api/listings/map-pins`**, which had none: wire shape and casing,
  all-four-or-none viewport binding, and the 400 on an antimeridian box — all things the service-level
  tests bypass by constructing the filter directly.

## Non-obvious decisions

The four load-bearing ones — viewport fetching and its self-feeding-loop guard, the Angular popup
instead of `L.popup`, exact-coordinate grouping, and sharing the brand ball as a Sass mixin rather
than as a component — are in **ADR-012** with their rejected alternatives. Three smaller ones:

- **The brief was inverted, deliberately.** It asked for every ball bouncing continuously and stopping
  on hover. Up to 500 simultaneously animating SVG markers is a real cost, and motion that is
  everywhere carries no information. Tigran took the inversion: static by default, bounce under the
  pointer — which also puts the map on the same gesture as the header brand.
- **`markerGroupLabel` is a `{count}` template, not a finished string.** The first implementation
  passed one opaque translated string applied to every group, so a pair and a group of seven announced
  identically. The parent now passes the translated string with the placeholder intact and
  `MapComponent` substitutes each group's own count — which keeps that file ignorant of ngx-translate,
  the same contract `zoomInLabel` has.
- **The popup needs a ~150 ms close grace.** Without it the popup is unreachable by mouse: the pointer
  leaves the ball before it arrives at the card. It has an e2e assertion, because it is exactly the
  kind of timing detail that regresses silently and is invisible in jsdom.

## Not built (deliberate)

- **The active search radius and origin point are not drawn on this map.** Useful, and a follow-up.
- **No pixel-distance clustering.** Grouping is exact-coordinate only, so two addresses straddling a
  geohash cell boundary stay two circles 117–153 m apart. See ADR-012 for why exact equality was
  preferred for this iteration.
- **No two-way card↔pin highlighting** — there is no list beside the map to highlight against.
- **No browser-level assertion on the 150 m circles.** Leaflet renders them as SVG paths with no
  app-owned class, so asserting on them would couple the suite to Leaflet's internal DOM — against
  this repo's own map-testing convention. If that regression net is wanted later, the fix is a stable
  `className` on the circle layer in `map.component.ts`, not a workaround in the spec.
- **A pre-existing 8 px overflow at exactly 960 px** (`.lp-sticky-header` bleed vs `.page-container`
  padding in the 901–960 band) was found, measured, confirmed to predate this work, and left alone.

## Bugs found before merge

Both caught by review rather than by tests, both now recorded: **M-026** (the toggle overflowed the
`nowrap` toolbar at 375 px — fixed, with a Playwright regression at that width) and **M-025** (a stale
docker container squatting `:4200` made the whole mocked e2e tier test a bundle without this feature —
now guarded by a `globalSetup` hook).

## Verification

`dotnet test` 348/348 · `npm test` 551/551 across 58 files · `npm run e2e` 16/16 · `npm run build`
clean apart from pre-existing warnings · live walk of twelve journeys including reduced motion,
keyboard traversal, viewport refetch under a network panel (no runaway request stream) and all five
pre-existing `app-map` consumers · `/security-review` clean, with explicit verdicts that
`GetMapPinsAsync` has no privileged coordinate branch and that no listing-controlled string reaches
the `divIcon` HTML.
