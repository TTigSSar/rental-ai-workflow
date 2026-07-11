# Architecture Decision Records

One entry per decision. Format: heading is the anchor other docs link to.
Store only decisions the code cannot express: WHY, and what was rejected.

Template:

```
## ADR-001: <Title>
Date: YYYY-MM-DD | Status: accepted
**Decision:** what we chose.
**Why:** the driving constraint.
**Rejected:** alternative(s) + one line why not.
```

---

## ADR-001: Chat conversations are scoped to a Booking
Date: 2026-07-07 | Status: accepted
**Decision:** A `Conversation` is 1:1 (owner ↔ renter) and keyed to exactly one `Booking` (`BookingId` unique). The conversation's status pill is **derived** from the linked booking's status + a closed flag (requested→approved→active→return_due→closed), not stored. Per-participant read state (unread count, "Seen") lives in a `ConversationParticipant` row (`LastReadMessageId`/`LastReadAt`), one per user. Inbox-preview fields (`LastMessageAt`, snippet, toy title/image) are denormalised on `Conversation` for join-free list reads — same pattern as `Notification`.
**Why:** The approved ToyRent design pins every thread to one toy+booking; system messages are emitted by booking lifecycle events; the read-only lock is "booking complete AND both reviews in". Booking is the natural key. Denormalising the preview + a participant read-cursor matches the codebase's existing join-free-read style and directly powers the unread badge and Seen receipt.
**Rejected:** (a) Conversation keyed by user-pair — breaks the design's per-booking system messages and status pill, and the existing Angular model already carries `listingTitle`. (b) Storing read state as two nullable columns on `Conversation` (OwnerLastReadAt/RenterLastReadAt) — simpler for strict 1:1 but doesn't generalise and reads awkwardly for the "Seen on my last message" query; the participant table is cleaner.
**Frontend impact:** the existing minimal Angular chat model (`title`/`participantName`/`listingTitle`/text-only) is replaced to match the design (booking-scoped, status, image/system messages). Contract rewrite handled by contract-guardian in a later Phase-1 increment.
**Amended 2026-07-11:** the pill vocabulary gained a `completed` state: requested → approved → active → return_due → **completed** → closed. `completed` = booking Completed but `ClosedAt` still null (chat open, awaiting both party reviews); `closed` is emitted ONLY from the `ClosedAt` override. Rationale: M-007's fix mapped Completed straight to `closed`, which made the pill read "Closed" on a conversation that still accepted messages — the vocabulary must distinguish "rental done" from "thread locked".
