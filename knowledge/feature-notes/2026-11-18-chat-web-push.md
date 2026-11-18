# Chat Web Push (Trello #252)

Date: 2026-11-18 · ADR-067 (+ amendments to ADR-048, ADR-059 §3/§8, chat-notifications design-notes #8)
Commits: rental-api ace17cf, 68e144e · Rental-Ui 0a497fc, 375f518, d752e92, f54f899, 1173f60 · outer 8cfe3c5, 4dfd14b

## What shipped
- `PushSubscriptions` table (migration `AddPushSubscriptions`, approved by Tigran), `/api/push/{public-key, subscription}`.
- SSRF guard on the endpoint (https, allow-listed push hosts, no IP/userinfo/port), re-checked before send; push HttpClient has redirects off and a 10 s timeout.
- Bounded in-memory queue + one `BackgroundService` sender; 404/410 and invalid p256dh points delete the row.
- Hand-written `public/sw.js`; WebKit always shows; Settings Row B "Turn off on this device"; iOS install hint; Row B hint copy now "when someone messages you".
- Push is off until `WEBPUSH_VAPID_*` are set in `/opt/dorent/.env` (startup check logs Critical, no crash).

## Found during verification
- Logout DELETE was sent after the token was cleared (401, orphaned row). Fixed by capturing the token at subscribe time; `authInterceptor` now leaves an explicit `Authorization` header alone. qa: regression test required → `e2e/real/push-logout-unsubscribe.spec.ts` (red on the pre-fix bundle).
- A unit spec relied on Node's `localStorage` (absent under Node 26 + vitest). qa: not justified (test infra).

## Known limits (accepted)
- Expired token + page reload never emits the previous user, so the device keeps its subscription until another user signs in or the push service returns 410. Consequence of ADR-067 §13 (transition-only unsubscribe).
- No rate limit on the push routes (cap of 10 rows per user); VAPID keys are checked for presence, not format.
- Not testable headless: real `pushManager.subscribe`, delivery, click-through, direct sessionReplaced A→B. Covered by the manual prod check.
- `.env.staging.example` not updated (staging stand is mothballed).

## Follow-up
- Trello "Web Push for rental events (not only chat)" (Low).
