# Booking-scoped Chat — Phase 1 (backend + frontend)

Status: Completed (Phase 1) | Decisions: ADR-001 | Mistakes: M-002, M-003, M-004 | Commits: rental-api `6814399`, Rental-Ui `0514aa5`

## Goal
Turn the frontend-only chat stub into a real, backend-connected 1:1 chat scoped to a booking (owner ↔ renter), on the approved ToyRent design's information architecture. Phase 1 = text only.

## What shipped
- **Backend** (rental-api, branch `feature/chat-backend`): `Conversation` / `ChatMessage` / `ConversationParticipant` domain + EF configs + `AddChat` migration; `ConversationsStore`; `ChatService`; `ChatController` `/api/chat/*` (list, thread paged, send text, mark-read, get-or-create from booking); dev seed (1 conversation, 4 messages, 1 unread for renter). Committed bundled with the user's uncommitted notifications feature + production-readiness audit — see "Delivery" below.
- **Frontend** (Rental-Ui, branch `feature/chat-frontend`): models → DTOs; service (send/markRead/getOrCreateFromBooking); store (markConversationRead, sendMessageSuccess append); inbox rows (avatar + toy thumb, status pill, unread badge); thread (booking-context header, navy/white bubbles, inline system lines, "Seen", read-only-when-closed composer); i18n en/ru/hy; first chat unit specs (192→199).

## How it was built (multi-agent workflow, first real run)
Orchestrator → backend-dev (vertical) → contract-guardian (contract sync + drift map) → frontend-dev (UI rebuild) → verifier (live walk + screenshots). The pipeline's value showed up concretely: **verifier's live walk caught a runtime crash (M-004) that green builds + 199 unit tests missed** — fixed and re-verified PASS at 375/768/1440.

## Deferred (later phases)
Realtime (SignalR), push, image attachments/upload, app-wide entry points (navbar message icon, home widget, mobile nav tab), the closed-signal wiring (booking-complete + both-reviews sets `Conversation.ClosedAt` — currently never set automatically).

## Known follow-ups (from verifier, non-blocking)
- Thread does not auto-scroll to the newest message on load/after send (message pane is `max-height: 55vh; overflow-y: auto`). Basic chat UX gap — worth a quick fix.
- Mobile (375px): long toy title truncates mid-word with ellipsis (cosmetic).

## Delivery note
rental-api and Rental-Ui are two independent GitHub repos, each mid-WIP when chat started. Chat's EF migration/snapshot was entangled with the user's uncommitted notifications feature, so the backend landed as one honestly-labeled bundled commit (notifications + chat + audit) rather than a standalone chat PR. See ADR-001 and the git discussion.
