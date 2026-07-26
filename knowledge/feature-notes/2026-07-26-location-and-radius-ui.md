# Location & radius — the UI half (2026-07-26)

Frontend counterpart to [`2026-07-25-geohash-precision-and-radius-circle.md`](2026-07-25-geohash-precision-and-radius-circle.md),
which covers the server side (geohash 6→7, bbox→Haversine circle, `DistanceKm`). Read that one first —
this note assumes its decisions.

Built from an approved five-screen design produced in Claude Design ("Location and Radius.html", project
"Rental Platform"). The design brief itself was written from the codebase, so the mockup already speaks in
this app's tokens and breakpoints; deviations from it are listed at the bottom rather than silently absorbed.

## What shipped

`Rental-Ui`, all on `dev`: `46a2f18` (shared map), `c9ed64c` (radius filter + origin picker), `d867dc1`
(detail page + full-screen map), `fff09f1` (stale precision figure in a doc comment), `691ac75` (one distance
formatter), `80ea274` (real geographic preview circle), `6638363` (merge the duplicated picker), `3f4a225`
(hint/zoom overlap fix), `9836f2c` (drop the duplicate toast), `4522614` (browser regression).

- **`app-map`** gained `userPin` (blue pulsing dot), `fitPins`, `scrollGate`, `circleDashed`,
  `zoomInLabel`/`zoomOutLabel`, three projection slots, and its own zoom stack replacing Leaflet's built-in
  control. It remains the only file allowed to import Leaflet.
- **Listing detail**: interactive map (was frozen), "My location" with a distance line, full-screen view,
  soft geo-denied fallback, text fallback on tile failure, no map at all without coordinates.
- **Catalogue**: the four fixed distance pills became a log-scale slider (200 m → 20 km) plus four presets,
  gated behind an explicit reference point with five states, present identically in the desktop sidebar and
  the mobile sheet.
- **Origin picker**: the wizard's crosshair picker generalized with opt-in inputs, now serving both flows.

## Non-obvious decisions

- **The radius filter measures from the PUBLIC coordinate, and that is a reversal.** The original call
  (mine) was to filter on exact coordinates for accuracy. Tightening the fuzz to ~150 m removed most of the
  accuracy argument and left two objections that did not exist at geohash-6: a boolean "inside this circle?"
  over exact coordinates is a **trilateration oracle** (repeat with moving centres and you recover the exact
  point), and results computed from exact coordinates can contradict the circle the user is looking at, which
  reads as a bug. Tigran took the public-coordinate option. See ADR-008's amendment.
- **One log scale instead of a metres/kilometres toggle.** The label carries the unit ("500 м" → "3 км"), so
  the user never picks a mode. Locale-aware via `Intl.NumberFormat`, so RU gets a decimal comma.
- **Radius is a URL param, the origin is not.** `originCoords` stays session-only (Maps P2-3, personal data).
  A reload with `?radiusKm=3` and no origin therefore cannot filter — it deliberately sends **no** distance
  params at all rather than a half-filter, shows no active-filter chip, and leaves the value waiting in a
  greyed slider so one tap re-arms it. Silently returning unfiltered results *while displaying an active
  radius* was the failure mode being avoided.
- **`maxDistance` → `radiusKm` with no legacy alias.** Looks breaking, isn't: the origin was never in the URL,
  so a bookmarked `?maxDistance=5` never filtered anything on a fresh load either. Verified before accepting.
- **No reverse geocoding for a manually-picked origin.** The mockup labels it "Кентрон · рядом с парком";
  there is no geocoder (deliberately — see the address-input decision below) and districts carry no
  coordinates, so the label is neutral instead of an invented landmark. Coordinates are never shown as numbers.
- **Address input was cut from the original request.** The ask was "type an address if geolocation is denied";
  it became "pick a point on the map" once it was clear a geocoder is a new external dependency. Every denial
  path routes to the same picker.

## What the design brief got wrong, and what the mockup assumed away

- The brief told agents the geohash-7 cell is ~150×150 m. The measured value is **~117×153 m** — the backend
  agent probed the real bit-interleaving code instead of trusting the figure. `APPROXIMATE_AREA_RADIUS_METERS`
  is 150 m, comfortably above the ~96 m worst-case centroid-to-corner distance, and matches the pill the design
  shows. Never let this number drop below real uncertainty.
- The mockup's hint card is compact; the implementation stretched it edge-to-edge and made the zoom buttons
  unclickable — **M-022**. Caught only by the live walk.

## Deliberately not built

- Broad e2e for the radius filter, origin picker and `distanceKm` (product call). Only the M-022 regression
  exists at browser level; everything else rests on unit tests. This is the thinnest part of the feature.
- Mid-right placement of the "My location"/zoom buttons in the full-screen map — they sit bottom-right, in
  `app-map`'s existing actions slot, to avoid a layout-only change to the shared component.
- `Down()` rollback of the re-snap migration, and multi-instance startup races on it.

## Things worth knowing before touching this area

- **Two workstreams shared one working tree and it cost us.** The git index raced: one agent's commit swept
  in another's staged files and had to be reset on a shared branch, and `c9ed64c` does not build in isolation
  because it imports a service only committed later in `d867dc1`. HEAD is fine; a `git bisect` through that
  commit is not. Give concurrent agents disjoint file sets **and** serialize the commits, or use worktrees.
- **Duplication created only to dodge concurrency must be cleaned up in the same feature**, or it becomes
  permanent. The point-picker duplicate and the second distance formatter were both born that way; both were
  merged before close-out.
- **The Haversine constant and formula are mirrored on both sides** (`ListingsQueryService` and
  `haversine-distance.utils.ts`, `6371.0088`). They were verified term-for-term during verification; the
  catalogue badge (server-computed) and the detail page (client-computed) agreed to the digit on a live check.
  Change one, change the other.
