# Loss & damage compensation — replacing the refundable deposit
Status: Completed | Decisions: ADR-018 | Mistakes: M-037, M-038 | PR: pending | Issues: —

Date: 2026-09-16 → 2026-09-17 | Area: `rental-api` + `Rental-Ui`

## Goal

Tigran asked to turn "Refundable deposit" into the amount a renter owes the owner if the toy is lost, seriously damaged or not returned, set by the owner when adding the item. Discussion first, then a Claude Design pass, then implementation.

## Decisions taken in discussion

Nothing paid upfront · the amount is a cap ("Up to X") · required · named "Loss & damage compensation" · shown to renters with no consent checkbox · existing values kept, "Not specified" when absent · full code and schema rename · 1,000–10,000,000 AMD. See ADR-018 for the reasoning and the rejected alternatives.

## Found before building

The deposit input had been missing from both the create wizard and the edit form since the Flow A redesign in May, so owners had not been able to set it for months; only seeded listings had values. This feature restored an input as much as it renamed one.

## Design import

The Claude Design project `Loss & Damage Compensation.html` covered all six requested surfaces with states, "Not specified" variants and a copy deck. It was read in the main thread (M-032) and its specifics were written into the implementer's prompt. Corrections carried into implementation are listed in ADR-018: currency format, an unbacked "free cancellation" line in the copy deck, excluded mock-only content, an icon collision with the hygiene row. The design file `flow-a-extra.jsx` still shows a "Refundable deposit" line inside a booking-detail total; the app never rendered it, so nothing was built, but the design project is stale there.

## Which tier caught what

- **Unit tests + mocked e2e:** green throughout, and missed both live defects, because the unit tests set values with `patchValue` and the create-mode submit gate was never exercised in edit mode.
- **Live `verifier` walk:** out-of-range amounts silently clamped by `p-inputNumber` (M-037); Save disabled on edit for a listing with no amount (M-038 a); the amount wrapping mid-number in hy/ru.
- **`qa-engineer`:** proved both bug tests fail against the pre-fix code; found two existing e2e specs (one mocked, one real-stack) broken by the new required field; added the create → details → booking journey and a real-stack assertion that the renamed column round-trips.
- **`/code-review`:** popover outside-click scoped to the whole page host; the `0` amount rendering two ways (M-038 b).
- **`/security-review`:** nothing (ownership check intact, no new exposure). Run against the two nested repos explicitly, per M-034.

## Open at close

- `e2e/real/create-listing-photo-upload.spec.ts` was updated for the required field but **not executed** — Docker was not running. Run `npm run e2e:real` before merge.
- Bookings read the listing's live amount, not a snapshot (ADR-018, open consequence).
- `MyBooking` (the bookings list) never carried the amount, before or after; the list does not display it.
- `listing-booking-page.component.scss` is over the 18 kB style-budget warning (under the 24 kB error).
- The migration needs human review before merge.
