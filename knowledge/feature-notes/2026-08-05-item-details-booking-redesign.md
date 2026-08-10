# Item details + booking page — rebuilt to the Claude Design source of truth

Date: 2026-08-05 · Area: `Rental-Ui` (listings feature) + `rental-api` (bookings)
Design: project `df24299b-1299-4804-8a0a-5484005594c3`, file `Item & Booking.html`
Related: ADR-013 (booking note + contact reveal), ADR-014 (design vs. backend claims), M-028, M-029, M-030

## What this was

The design defines a two-page rent flow — item details with **no** calendar → "Continue to booking" → a
dedicated booking page whose centrepiece is a note the owner reads → confirmation. The app already had
that shape (`/listings/:id` → `/listings/:id/book`), so this was a fidelity-and-completeness pass, not a
re-architecture. The design's owner-facing screens were explicitly **out of scope**;
`features/my-listings/pages/owner-listing-page` is untouched.

## The one thing that was actually broken

The booking page shipped a complete note editor — textarea, four suggestion chips, live chat-bubble
preview — and dropped the value on submit behind a TODO, because no backend field existed. Everything
the renter typed was discarded. That is now `Booking.Note`, end to end (ADR-013).

## Decisions taken with the human, and what they cost

| Question | Call |
|---|---|
| How much backend? | The note only. No renter trust fields on requests, no `Inclusions`, no similar-listings endpoint. |
| Phone "unlocks on send"? | **No** — server gate stays at `Approved`+. Confirmation offers real chat instead. |
| Owner listing view? | Out of scope this pass. |
| Service fee / deposit? | Deposit line shown as refundable and **excluded from the total**; no service fee. |

Six design blocks were dropped for want of truthful data — see ADR-014 for the list and the general rule.
None were faked.

## Things a reader will otherwise re-derive

- **Currency and brand in the design are illustrative.** It says ToyRent / ₽ / "Anna Sargsyan"; the app is
  DoRent, currency goes through the existing `dram` pipe, names come from data. Layout is binding, copy is not.
- **The app's design tokens already matched.** `--ui-color-primary` is `#ff6008`, border `#e8e5de`, text
  `#1a1b26` — identical to the design's "Refined Warm" palette. No new hex was introduced. The one gap is
  star gold (`#f2a900`), which lives hardcoded in `star-rating.component.scss` and has no token.
- **Breakpoints were unified.** The two pages previously switched to 2-col at 1100px and 960px respectively,
  plus ad-hoc 900/1099/700/600/480 breaks. Both now use the documented `DESIGN_RULES.md §3` ladder, 2-col at
  **≥1100px**. Deliberate consequence: a 1024px tablet renders the booking page single-column.
- **A lot of the design's copy was already translated and rendered nowhere.** `listings.details.breadcrumb.*`,
  `.protection.*`, `.toyDetails.deposit*` and `listings.booking.deposit` existed in all three locales as
  orphans. Reused rather than re-invented. The dead `booking-panel` component and the nine keys only it used
  were deleted.
- **`ChatApiService.getOrCreateFromBooking` existed with no callers.** It now backs the confirmation's
  "Message the owner", via a new `openConversationFromBooking` action/effect. That required registering the
  chat slice on the listings route tree — NgRx slices here are lazily provided per consuming route, and
  chat's only existed under `/chat/**`.

## Verification state at close

- `dotnet test rental-api/RentalPlatform.sln` — 358 pass (8 new booking-note tests)
- `cd Rental-Ui && npm test` — 635 pass
- `cd Rental-Ui && npm run e2e` — 31/32; the single failure is `create-listing-location.spec.ts`, unrelated
  pre-existing label drift ("Continue to basics" → "Next Basics") from separate in-flight work on the branch
- `/security-review` — one Medium finding (user-controlled owner name reaching an `[innerHTML]` binding on
  the booking page), **fixed**: `phoneUnlock` split into a lead + emphasis key so the name flows through
  ordinary escaped interpolation. No `[innerHTML]` with an interpolated parameter remains in the app.

### Not done at close

- **The EF migration `20260804210502_AddBookingNote` is generated and NOT applied.** Human review gates it,
  per the workflow. No live end-to-end walk has run against a real database — everything above is build,
  unit/integration, and network-stubbed e2e.
- Both nested repos carried **substantial pre-existing uncommitted work** before this task started
  (`rental-api`: seed data + district tests + untracked `wwwroot/uploads/`; `Rental-Ui`: an in-flight
  create-listing wizard redesign). A PR opened without sorting that first would sweep it in.
