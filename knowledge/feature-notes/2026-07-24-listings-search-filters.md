# Listings search + age + distance filters (2026-07-24)

Closed the confirmed prod bug where `/listings` search and two sidebar filters were dead:
the UI sent query params the backend had no fields for, ASP.NET silently dropped them, and
search returned the *unfiltered* list with no error (M-020 contract-drift class). Trello card
`6a61a427`. Commits: `rental-api` `09a0632`, `Rental-Ui` `6814f84` (+ qa regression `1d5fb89`).

## What shipped
`GET /api/listings` `ListingsQueryFilter` gained `Search`, `AgeFromMonths/AgeToMonths`,
`OriginLat/OriginLng/RadiusKm` (all nullable/additive, **no migration** — reuses `Title`/
`Description`, `AgeFromMonths/AgeToMonths`, and the P1-4-backfilled `PublicLatitude/PublicLongitude`).
UI serializes all three; `title` param renamed to `search` (now matches title+description).

## Non-obvious decisions (the reason this note exists)
- **Distance is a bounding box, not a circle, over PUBLIC coords.** Per Maps **P2-1** ("extend the
  existing search, bbox + haversine, no spatial index"). No Haversine refinement yet — a square box
  is the accepted MVP shape because public coords are geohash-6 snapped (~1.2 km) for privacy, so a
  `< 1 km` radius is already below what the data can honestly resolve. Haversine circle is a
  documented follow-up, not a gap. No spatial index (query plans don't demand one yet).
- **Renter coordinates are session-only.** `originCoords` lives in a dedicated NgRx slice, kept out
  of `ListingsFilter`, the URL, and storage — geolocation is personal data (Maps **P2-3**). Distance
  params are emitted only when a chip is active AND `navigator.geolocation` granted; on denial the
  chip stays inactive with a translated toast (no dead active chip).
- **`.Contains()` case-sensitivity differs by provider.** Prod SQL Server translates `.Contains()`
  to `LIKE` under CI collation (case-insensitive); the SQLite test double translates it to byte-exact
  `instr()`. The "search is case-insensitive" test would fail on SQLite without either a `ToLower()`
  in prod code (unwanted) or a fix in the double. Resolution: `SqliteTestDatabase` registers a
  case-insensitive `instr()` **on the test connection only** — prod code stays plain `.Contains()`.
  Verifier independently confirmed the real SQL Server behaviour, so the double emulates something
  real, it isn't asserting a fiction.

## Coverage (qa verdict)
- Search → real-stack regression `e2e/real/listings-search-filter.spec.ts` (asserts searched
  totalCount < unfiltered, and a known non-matching listing is excluded).
- Age-group & distance → regression **not** justified: both fully covered at the two cheaper layers
  (`ListingsQueryServiceFilterTests.cs` for the filter math incl. null bounds / 120+ / bbox edges,
  and `listings-api.service.spec.ts` for param serialization). A browser distance journey would add
  flaky `navigator.geolocation` permission handling for no new proof.

## Side finding (not acted on)
Verifier found `e2e/real/booking-lifecycle.spec.ts` is **no longer red** — both defects were fixed
in `b32b266` (M-021). The Trello card `6a61aaa1` sitting in **Doing** for that is stale; flagged to
Tigran, left untouched pending his call.
