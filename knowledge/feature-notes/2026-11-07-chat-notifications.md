# Chat notifications for new messages (Trello #17 → 17a/17b/17c)

Date: 2026-11-07 · ADR-059 (+ amendments) · Design: `knowledge/specs/chat-notifications/` · Web Push split out (card, High) · Feed retirement direction (card, Medium).

## What shipped
- **17a (rental-api):** `Users.ChatEmailsEnabled` + `ConversationParticipants.ChatEmailSentAt` (migration `AddChatEmailPreferences`). `PUT /api/auth/me/chat-emails`, anonymous `POST /api/auth/chat-emails/unsubscribe` (stateless HMAC token, 60 days, `?t=`). `ChatUnreadEmailDispatcher` (60 s): unread line ≥ 15 min and ≤ 48 h old, one email per unread streak, quiet hours 22:00–09:00 Yerevan, booking and moderation threads (member only), shared send budget + chat cap 70/24 h, gated on `IsOperational`. en/hy/ru template, no message text.
- **17b (Rental-Ui):** Settings → Notifications sheet/dialog (email switch, browser-permission states); chromeless public page `/unsubscribe/chat-emails`.
- **17c (Rental-Ui):** OS notification for a new message (and moderator note) while the tab is hidden; one-time soft prompt after the first sent message.

## Non-obvious
- `MarkReadAsync` stores the last message's `CreatedAt` as `LastReadAt`, not the read time, so the re-arm rule compares the uncapped oldest unread line with `ChatEmailSentAt`. The 48 h cap applies only to the trigger (reviewer Major, fixed 869791f).
- The dispatcher backs off 30 min after a shared-budget refusal, to avoid one Critical log per minute.
- New optional config: `Email__ChatSendBudget__Limit` (70), `Email__ChatSendBudget__WindowHours` (24).
- Overlays under `/profile/*`: see M-082.

## Follow-ups (reviewer minors, not blocking)
Caps reset on restart (inherited from ADR-028 §8); rare optimistic-revert mismatch after a cancelled request; first name in the email subject is user-controlled; image URLs are made absolute with `App:PublicBaseUrl` — check thumbnails on dorent.am.
