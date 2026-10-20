# Rental card in chat — stage 1 (RC-1…RC-4)

Date: 2026-10-20 · Trello: Rental Lifecycle, RC-1…RC-4 · Design: `knowledge/specs/rental/design-notes.md`

## What shipped
- **Backend.** Chat conversation details gained additive nullable fields: `bookingStatus`, `viewerRole`, `turn`, `deadlineAt`, `startDate`, `endDate`, `rentalDays`, `rejectionReason`, `listingId` and `renterNote`.
- **Inbox.** The inbox item gained `lastMessageSystemKind`.
- **System lines.** Reject and cancel post chat system lines. The body is a fixed constant (ADR-051).
- **Status tokens.** Rejected, Cancelled and Expired show `not_happened` (ADR-001, 2026-10-20 amendment).
- **Read-only.** A Completed booking chat is read-only. A send returns 409 `chat.conversation_closed`.
- **UI.** `RentalCardComponent` replaces the status pill and the "View booking" link.
  - Badge, bar and copy:
    - The badge and the orange bar follow `turn` (ADR-046 note).
    - One sentence and one primary button.
    - The ⋯ menu holds the listing, the booking and withdraw/cancel. Withdraw and cancel ask for confirmation.
    - "Leave a review" is shown only while the viewer has no review.
    - The renter's note and the decline reason appear as quotes.
  - Layout:
    - Mobile: the card is pinned and collapses on scroll. It never auto-collapses on the viewer's turn.
    - 1280 and up: a 400 px "Rental" column, with the rail fixed while a thread loads.
  - Inbox: system lines are localized from `systemKind`.

## Worth knowing
- `ChatTokens.TurnToken` is interim. Replace it with ADR-046 §8 `turn`/`availableActions`, then drive the card's actions from `availableActions`.
- The admin messages list has no `lastMessageSystemKind`. Moderation threads never get system lines, so this is fine.
- Verification:
  - Measure PrimeNG overlays only after their enter animation ends (M-073).
  - The live walks used the dev DB only with Tigran's one-off permission (RC-4), with cleanup by id. Otherwise all writes were mocked (M-059).
  - Docker owns :4200 locally, so the walks ran on :4300.
- Follow-up cards (To Do): dates in ru/hy, flaky EmailVerificationConcurrencyTests, the wrong name in the renter's request line, inbox contrast, and the stale inbox row for the actor.
- Reviewer minors left open:
  - Reset the shell's rental-layout flag on a user switch (ADR-036).
  - Add a sync comment between `deriveRentalLayout` and `hasRental`.
  - Use an event-based wait in `e2e/chat-shell-layout.spec.ts`.
