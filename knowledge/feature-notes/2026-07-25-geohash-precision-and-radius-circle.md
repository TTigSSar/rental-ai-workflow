# Geohash precision 6→7, radius filter bbox→circle, distance badge (2026-07-25)

Two coupled changes to the Maps subsystem's location fuzzing and distance filter, both explicit
product decisions from Tigran (not agent-driven scope). `rental-api` only — no frontend change in
this pass; the UI already sends `RadiusKm` as fractional km (`0.2` etc.) per the 2026-07-24 note,
so nothing on the wire changed shape, only the server's math and the fuzz precision.

## What shipped

- `GeohashSnapper.Precision`: 6 → 7. Cell size at Yerevan's latitude: ~933m×611m → ~117m×153m.
- One-time data migration `InvalidatePublicCoordinatesForGeohashPrecisionUpgrade` (schema-free,
  pure SQL data fix — reviewed like `BackfillUsdListingsToAmd`) plus **no new runner code**: it
  NULLs `PublicLatitude`/`PublicLongitude` for every listing with exact coordinates, and the
  pre-existing `ListingLocationBackfillRunner` (already runs on every startup, already only fills
  nulls) recomputes them at the new precision on the very next startup, since
  `Program.cs` runs `ApplyMigrationsAsync()` then `BackfillListingLocationsAsync()` before
  `app.Run()`. `DistrictId` is untouched (point-in-polygon on the exact point, precision-independent).
- `ListingsQueryService`'s distance filter: bounding-box pre-filter (unchanged shape, still sizes
  the box from `RadiusKm`) + a Haversine circle refinement layered on top, both against
  `PublicLatitude`/`PublicLongitude`, both translating to SQL (verified against both SQL Server
  and the SQLite test double via `ToQueryString()` — no client-evaluation fallback).
  `RadiusKm` clamped to `[0.2, 20]` km.
- `ListingPreviewResponse.DistanceKm` (nullable `double`, additive): populated whenever the
  request carries `OriginLat`/`OriginLng`, independent of whether `RadiusKm` is also present;
  same Haversine formula, same public coordinate, so the catalogue badge and the radius filter can
  never disagree.

## Why this reverses the 2026-07-24 note

That note explicitly recorded bbox-not-circle as "the accepted MVP shape" because the old
geohash-6 fuzzing (~1.2km cells) already made anything under ~1km moot. Today's product call
tightens the fuzzing specifically so a sub-kilometre radius (design wants 200m) is coherent, which
removes the reason the circle was deferred. See ADR-008's 2026-07-25 amendment for the full
reasoning, including why the circle is still computed against the **public**, not exact,
coordinate (an exact-coordinate radius filter is a trilateration oracle — repeat with different
centers/radii and you recover the exact point, defeating the entire fuzzing feature).

## Non-obvious decisions

- **No new "run-once" infrastructure for the re-snap.** The obvious options were a version-marker
  table or a dedicated one-off command. Both were rejected in favor of reusing
  `ListingLocationBackfillRunner` unchanged: it already has the exact "fill any null derived
  value" behavior the recompute needs, it is already tested, and it already runs at the right
  point in `Program.cs`. The migration's only job is to make the precondition (`PublicLatitude IS
  NULL`) true again for the affected rows. This also means the geohash bit-interleaving algorithm
  is never duplicated in T-SQL — `GeohashSnapper`'s own doc comment forbids a second place
  deciding precision, and a closed-form T-SQL reimplementation (mathematically possible — the
  per-axis cell index is a plain `floor()` once you fix the bit count — but a second
  implementation to keep in sync) was rejected on exactly that ground.
- **The Haversine formula is duplicated verbatim** between the `Where` refinement
  (`BuildApprovedListingsQuery`) and the `Select` projection (`DistanceKm` in
  `GetApprovedListingsAsync`), rather than factored into a shared method. EF Core's SQL Server/
  SQLite translators only recognise `Math.*` calls written inline in the LINQ expression tree — a
  call to a user-defined helper method does not translate (would throw or silently client-evaluate).
  Both call sites carry a comment cross-referencing the other; keep them in sync if the formula
  changes.
- **Two existing test fixtures needed new coordinate pairs**, not just a precision-6→7 rename:
  `GeohashSnapperTests.SnapToCellCenter_Two_Points_In_The_Same_Cell...` and
  `ListingDetailCoordinatePrivacyTests`'s `SecondExactLatitude/Longitude` both used a ~5-6m-apart
  pair that shared a geohash-6 cell (~933m×611m) but straddles a geohash-7 cell boundary
  (~117m×153m) — confirmed by independently re-running the bit-interleaving bounds check, not
  assumed. Replaced with a ~2-3m-apart pair verified to still share a precision-7 cell.

## Coverage

`ListingsQueryServiceFilterTests`: bbox-corner-but-outside-circle exclusion, two sub-kilometre
radii (0.2/0.5km) inclusion, `RadiusKm` clamping at both the floor (0.01→0.2) and ceiling
(100→20) with fixtures chosen so clamped vs. literal behavior actually diverges (not merely
consistent with either), `DistanceKm` null-without-origin / populated-with-origin (value-checked
against an independently computed expectation) / null-when-listing-has-no-public-coordinate.
`GeohashSnapperTests`: cell size re-measured for precision 7 (~117m×153m at Yerevan's latitude,
~153m×153m at the equator — the two degree-spans are numerically identical at this precision).
`ListingLocationBackfillRunnerTests`: a new test simulates the migration's invalidate-then-recompute
path end to end (seed a stale non-null public pair, null it out exactly as the migration's SQL
does, run the unchanged runner, assert the recomputed value matches a fresh `GeohashSnapper` call
and is NOT the stale value).

No qa-engineer regression added — this is filter/math logic fully covered at the unit layer
(`ListingsQueryServiceFilterTests`, `GeohashSnapperTests`), same reasoning the 2026-07-24 note
gave for age-group/distance: a browser-level journey would add `navigator.geolocation` flakiness
for no new proof. Frontend wiring (if any UI changes are needed to send finer radii or render the
distance badge) is out of scope for this pass — flagged for whichever agent picks up the UI side.
