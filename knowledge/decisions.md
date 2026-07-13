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

## ADR-002: Chat image attachments are served as unauthenticated capability URLs
Date: 2026-07-11 | Status: accepted (**deliberate trade-off, not an oversight**)
**Decision:** Chat attachments are written to a conversation-scoped directory with a server-generated filename and served by the same `UseStaticFiles` pipeline as listing images — i.e. **anyone holding the URL can fetch the file without being a participant, or even authenticated**. The URL is unguessable (GUID conversation path + GUID filename), so possession of the URL *is* the authorization ("capability URL").
**Why:** the human weighed it explicitly against the alternative below and chose to ship the vertical. It keeps the read path a plain `<img [src]>`, browser-cacheable, and identical in shape to listing images.
**Known consequence (accept it knowingly):** chat attachments are **private content between two users**, unlike listing images which are public by design. A URL that leaks — browser history, `Referer`, server logs, a forwarded screenshot — grants permanent, unrevocable access to that image. There is no participant check. `/security-review` will flag this; that finding is expected, and this ADR is the answer to it.
**Rejected:** an authenticated streaming endpoint (`GET api/chat/conversations/{id}/attachments/{file}`) that verifies the caller is a participant. Correct on privacy, but `<img src>` does not send the `Authorization` header, so the client would have to fetch each image as a blob and hand the component an object URL — more moving parts, no browser caching, and roughly half a day of extra work. Deferred, not dismissed: revisit before any real (non-demo) launch.
**Related infra:** `docker-compose.yml` mounts a `chat-uploads` volume at `/app/wwwroot/uploads/chat`; without it attachments vanish on image rebuild.

## ADR-003: Staging stand = single VPS + docker compose + Cloudflare Tunnel, one same-origin hostname
Date: 2026-07-13 | Status: accepted
**Decision:** The test stand for `dorent.am` runs the whole stack (SQL Server, API, UI, cloudflared) via `rental-api/docker-compose.staging.yml` on one cheap VPS (91.98.170.128). Exposure is a token-based **Cloudflare Tunnel** (outbound-only; zero inbound ports, TLS by Cloudflare). One public hostname `test.dorent.am` → the UI's nginx, which already reverse-proxies `/api/`, `/uploads/`, `/hubs/` to the API container — same-origin, so **no CORS config and no API subdomain are required** (`api.dorent.am` is optional, Swagger convenience only). `ASPNETCORE_ENVIRONMENT` stays `Development` on the stand deliberately (dev seed + Swagger); secrets move to `.env`. Guide: `rental-api/DEPLOY-STAGING.md`.
**Why:** SQL Server (~2 GB RAM) rules out free tiers and Cloudflare Workers; the dev compose already models the full stack; the domain was already on Cloudflare, making the tunnel the shortest path to HTTPS with no nginx/certbot/ports on the host.
**Rejected:** (a) UI on Cloudflare Pages + API on VPS — splits origins, forcing CORS + a rebuilt `apiBaseUrl`, for no benefit at staging scale. (b) Azure App Service + Azure SQL — costlier and slower to set up for a throwaway stand. (c) Classic A-record + nginx/certbot on the host — works, but needs open 80/443 and cert management the tunnel gives for free.
