# Maps Phase 1 — location on the listing (pin picker + approximate display)

Date: 2026-07-21 → 2026-07-22 | Branch: `dev` (both nested repos) | Trello: board "Renatall platform", list "Maps Subsystem"

## What shipped

An owner marks the toy's location on a map in the create-listing wizard's Step 3; every public reader
sees only a fuzzed circle and a district name.

- **rental-api**: `e6b06af` (H1 — exact coordinates gated to owner/admin), `d0b5f41` (Yerevan district
  GeoJSON + point-in-polygon provider), `e473ec2` (location value objects, `Districts` table + listing
  location columns migration), `dcecf51` (geohash-6 snapping, district assignment, backfill, dev-seed
  coordinates), `8305e5b` (`GET /api/districts`), `875790f` (`AddressLine` gated).
- **Rental-Ui**: `9a1c568` (contract + models + EN/HY/RU i18n), `63e2024` (lazy `app-map` + full-screen
  pin picker), `822b2b2` (approximate-location block on listing detail), `897bbd4` (focus-return fix),
  plus the e2e tier (mock handlers, tile interception, three journeys).
- **Root repo**: `4c6fa40` (ADR-007, ADR-008, M-017).

Decisions live in [ADR-007](../decisions.md) (tile stack) and [ADR-008](../decisions.md) (privacy model).
The one real mistake is [M-017](../mistakes.md).

## Scope taken, and why it was this shape

The board holds 21 cards across three phases. This run took H1 + the minimum of P1-1…P1-4 needed to
make two designed screens real, then P1-6, P1-8, P1-9, P1-10. The user chose that over marching the
board card-by-card, because the two designs were the actual ask and the P0 gates mostly served
decisions we could take cheaply (raster tiles) or defer (geocoding).

## Deliberately not built

- **P1-5 geocoding proxy / address autocomplete.** Needs a provider account and key. The board's own
  P0-1 gate allows "district picker + manual pin only" as the fallback outcome; that is what shipped.
- **P1-7 district filter** on the listings page.
- **Editing a listing's location.** There is no listing-edit route in the UI, and `UpdateListingRequest`
  carries neither `Latitude`/`Longitude` nor `AddressLine` — so an owner cannot move their pin after
  creating the listing. The picker is explicitly gated out of edit mode. This is the most visible
  functional hole left by Phase 1.
- **Trilingual map labels.** Impossible on raster tiles — see ADR-007.

## Things worth knowing before touching this area

- **The publish-time snap is the security property, not a rendering detail.** Fuzzing at write time
  is what makes repeated observation useless; per-request jitter would be averageable. Any new read
  path must take the public pair. There are comments at the seam saying so.
- **`latitude` in `ListingDetailsResponse` means different things to different callers.** Owner/admin
  get the true pin; everyone else gets a cell centroid. The frontend model documents this at the field.
- **`app-map` is the only file allowed to import Leaflet**, via dynamic `import()`. Main bundle cost of
  the whole feature: +4.27 kB; Leaflet itself is a 37.58 kB gzip lazy chunk. Keep it that way.
- **The detail map is tap-to-load on purpose.** We are on volunteer-funded OSM tiles whose usage policy
  excludes heavy traffic; a page view must not fetch tiles. There is an e2e journey asserting this.
- **Leaflet needs `invalidateSize()`** once its container has real dimensions, and its own controls sit
  at z-index 1000 — both bit us during P1-6 and are handled inside `app-map`.

## Bugs found during the phase (all fixed)

- `AddressLine` returned ungated to anonymous callers, undermining the whole feature — M-017.
- NG0103 infinite change-detection loop from binding the map's `[center]` to its own live centre.
- Focus returned to a node that Angular was about to destroy, so `document.activeElement` fell back to
  `<body>` after confirming a pin. Only the Confirm path; Cancel and Escape were always fine.
- Leaflet's `GridLayer.load` fires when the tile queue drains regardless of success, so it cannot be
  used to detect tile failure — the degradation check counts `tileload`/`tileerror` instead.

## Open, for later cards

- No real-stack (`e2e/real/`) coverage: geohash fuzzing and district derivation are unit-tested only.
- The location backfill runs on **every application start in every environment** (`Program.cs`); it is
  fill-only-nulls and cheap at current volume, but belongs in dev or a one-off migration.
- Contract drift found incidentally during P1-9, unrelated to maps: `priceUnit` missing from the
  frontend's update/preview models, and the listings search sends `title` the backend cannot bind while
  never sending `ageGroup`/`maxDistance` — i.e. keyword search is a server-side no-op.

## Post-close-out (2026-07-22)

- `/security-review` ran clean on the six rental-api commits — no findings at confidence 8+. The reviewer
  confirmed `ListingsQueryService` is the only construction site of `ListingDetailsResponse`, that both
  gates fail closed when `PublicLatitude` is null, and that the write-time snap has no recoverable seed.
- **Tiles moved off raw OSM.** `tile.openstreetmap.org` started returning OSMF's "418 Access blocked"
  placeholder — served as HTTP 200 with a valid PNG, so Leaflet counts it as a successful `tileload` and
  our degradation check cannot see it. The tile source is now configuration (`environment.tileProvider`),
  defaulting to MapTiler with an OSM fallback when no key is set. See the ADR-007 amendment.
  **Open:** MapTiler's free tier requires a visible MapTiler logo, not just the attribution text — not yet
  implemented. And the key itself still has to be created and pasted into the environment files.
- Two bugs surfaced only in production builds or on the human's machine, never in `ng serve`:
  the CJS-interop failure (`L.map is not a function` under esbuild, swallowed by the try/catch and reported
  as "map unavailable"), and a partial tile grid in the picker. See M-018 on why the e2e green that
  preceded them was not evidence.
