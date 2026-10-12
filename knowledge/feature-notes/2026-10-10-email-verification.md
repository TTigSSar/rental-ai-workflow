# Hard email verification (2026-10-08 → 2026-10-10)

Decisions: ADR-027 (real client IP, prerequisite), ADR-028 (verification model, with amendments), ADR-029 (Resend transport). Incident: M-055. Missed field: M-056.

## What shipped
- **Phase 0 (ADR-027)**, deployed 2026-10-09.
  - The API now sees the real client IP: nginx overwrites `X-Forwarded-For` with Cloudflare's `CF-Connecting-IP`, and the API trusts it only from the pinned compose subnet 172.18.0.0/16.
  - IPv6 clients are keyed by /64.
  - Before this, every per-IP rate limit in production was one global bucket.
  - The deploy caused a 1h28m outage (M-055).
- **Email verification (ADR-028/029)**, deployed 2026-10-10. Downtime about 13 s.
  - Register returns 201 with no token. Login on an unverified account returns 403.
  - `POST /api/auth/verify-email {token, password}` and `POST /api/auth/resend-verification {email}` (always 202).
  - Table `UserTokens` (SHA-256 of the token) and column `Users.EmailConfirmedAt`. Every pre-existing user was grandfathered as verified.
  - Email goes through Resend from `no-reply@dorent.am` (domain verified, click/open tracking off). The email is in the sign-up language.
  - Angular page `/auth/verify-email`: reads the token from the fragment, strips it from the URL, and keeps it in memory only.

## How it was built
- Planning:
  - Two adversarial plan reviews before any code: D1–D8, then R1–R12, then Rev 3.1.
  - The repository check found that the "per-IP" limits were global. That became Phase 0.
- Implementation:
  - The SQL Server race tests found a real deadlock (a joined token read versus the writers' lock order). Fix: one lock order everywhere, Users → UserTokens.
  - The reviewer found that re-registration bypassed the cooldown, and that the per-recipient cap did not cover re-registration.
  - Fixing the cap reintroduced a renewable email squat. Tigran accepted that risk over a platform-wide mail-budget outage (ADR-028, last amendment).
- Testing:
  - Tigran's manual local test found the email always in English (M-056).

## Operating it
- **Runbook:** rental-api `DEPLOY-PRODUCTION.md`, section "Релиз email-верификации". Rollback = retag `:pre-email-verification` and run `up -d` (no down-migration). Before any later roll-forward, run `deploy/grandfather-unverified-data-owners.sql`.
- **Production gate:**
  - A wrong or missing `EMAIL_PROVIDER`/`EMAIL_RESEND_API_KEY` gives 503 on register, plus a Critical log line `Email verification is NOT operational in Production`.
  - smoke.sh `email-gate` catches it right after a deploy.
- **Abuse limits:**
  - 60 s cooldown and at most 5 emails per recipient per 24 h. Over-cap gives a Warning log `Email verification per-recipient cap reached for user {UserId}`.
  - Global budget of 100 sent emails per 24 h. When exhausted: Critical log, no 429.
- **Squatted address (accepted risk):** the victim signs in with Google/Apple, or an admin deletes the pending account. It owns nothing.

## Open follow-ups
- A native-speaker review of the hy/ru email and page copy.
- Alerts on the global-budget Critical log and on the over-cap Warning (not built).
- The real-tier auth budget is 5/5, with no headroom (M-044).
- Real-tier runs under a non-default compose project need `COMPOSE_PROJECT_NAME`.
- `check_email_gate` is reliable only right after a deploy or restart, because of log rotation.
- Older runbook sections still pass `SQLCMDPASSWORD` in argv.
- Delete the server's `.env.bak-2026-10-10` once it is no longer needed.
