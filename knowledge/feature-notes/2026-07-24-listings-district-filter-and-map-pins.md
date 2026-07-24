# Listings: district filter + viewport search & map-pins endpoint (Maps P1-7, P2-1)

Date: 2026-07-24 | Branch: `dev` (both nested repos) | Trello: board "Renatall platform", list "Maps Subsystem"

## What shipped

A renter can filter listings by Yerevan district from any surface, and the backend can now answer
"what is inside this map viewport" — the data channel Maps P2-2 needs to draw a map.

- **rental-api**: `4216c7f` — `ListingsQueryFilter` gained `DistrictIds` (multi-select, repeated
  query key, capped at 12) and `MinLat`/`MaxLat`/`MinLng`/`MaxLng`; new
  `GET /api/listings/map-pins` (`AllowAnonymous`, same filter object, 500-pin cap, `Items` +
  `IsTruncated` envelope); `IValidatableObject` rejects `minLng > maxLng`.
- **Rental-Ui**: `ddf041c` (mobile sheet multiselect), `b5b3b97` (desktop sidebar checkboxes),
  `40da9ba` (removable district chips in the desktop toolbar), `09cb81d` (contract + pin models),
  `4f44e37` (real-stack pin-privacy test), `2873ef4` (the M-021 fix).

## Why it was scoped this way

The original proposal bundled three cards, because the listings search no-op and both of these
touch `ListingsQueryFilter` and `ListingsQueryService`. By the time work started the search card had
already shipped (`09a0632` + `6814f84`), and it left behind the pattern the rest followed: a
nullable filter property, a `Where` block in the query service, one query param on the client.

**No migration was needed.** `ListingConfiguration.cs` already indexed `DistrictId` and already had
the composite `(PublicLatitude, PublicLongitude)` index — checked before planning, not after.

Two decisions were taken by Tigran rather than inferred: districts are **multi-select** (a renter
will accept 2–3 neighbouring districts), and P2-1 is **bbox + pins only** — the haversine refinement
promised in the radius filter's own comment stays a separate follow-up, so the existing square-box
behaviour was left exactly as it was.

## Things worth knowing before touching this area

- **The bounding-box predicate is now shared.** `ApplyBoundingBox` serves both the radius filter and
  the viewport filter. Change it and you change both — that was the point, but it cuts both ways.
- **`ListingMapPinResponse.Latitude`/`Longitude` are always the public pair.** Unlike
  `ListingDetailsResponse.latitude`, which means different things to different callers (ADR-008),
  a pin has **no privileged variant**: `ListingsController.GetMapPins` never reads the
  `ClaimsPrincipal`. Do not copy the `CanSeeExactCoordinates` branch into it. The UI model documents
  this contrast at the field.
- **The district filter lives on three surfaces** — mobile sheet, desktop sidebar, desktop toolbar
  chips — over one `districtIds` field, one URL param and one store slice. Any fourth surface must
  join that state, not clone it. This is also what made M-021 visible.
- **District names are data, not copy.** They arrive from the backend in three languages; render
  them through `districtDisplayName()` and never through ngx-translate keys.
- **The 500-pin cap uses `Take(501)`** so `IsTruncated` is exact without a second count query.

## Bugs found during the work (all fixed)

- The `p-multiSelect` overlay rendered *behind* the bottom sheet header — `.lf-sheet` is
  `position:fixed; z-index:401`, the un-appended overlay was `z-index:auto`, so every district
  option was unclickable regardless of DOM order. Fixed with `appendTo="body"`, the same escape
  hatch `location-picker` already uses.
- The mobile sheet's Apply wiped `ageGroup`/`maxDistance` from the URL — M-021.
- P1-7 was initially implemented on mobile only, because the desktop sidebar is a separate
  hand-rolled component and the task spec pointed at the shared filters component. Caught by the
  implementing agent, not by the spec.

## Open, for later cards

- **`ListingsFiltersComponent` has two dead surfaces**: the active-chip row never renders (its only
  consumer passes `[showChips]="false"`) and `clearSheet()` is `protected` with no template binding.
  Carded — the decision (wire up or delete) should be taken for both together.
- **No component-level test for cross-surface consistency.** `qa-engineer` deliberately left this to
  frontend-dev's layer: it is pure Angular wiring with no backend involvement, so a Playwright
  journey would pay Docker cost for nothing. `listings-page.component.ts` still has no spec.
- P2-2 (map view + clustering) and P2-3 (Near me) are the consumers of `map-pins`; nothing renders
  it yet.
