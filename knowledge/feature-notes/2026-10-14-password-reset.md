# Password reset — "Forgot password?" (2026-10-14 → 2026-10-16)

Decisions: ADR-035 (the flow, with the §7 and §5 amendments), ADR-036 (a user switch without logout behaves like logout + login), ADR-030 §4 amended. Mistakes: M-064, M-065, M-066, M-067. Trello: TLnsDdZx (this feature); follow-ups hbprFg3q (JWT revocation, High), 6tIuqlpd (recycled-mailbox takeover of Google accounts, Low), kGIqsRKB (field-error colour 4.49:1, Low), Lu4YT3x1 (favourites survive logout, Medium).

## What shipped
- **Endpoints (all anonymous, one per-IP bucket `password-reset`, 5/min):**
  - `POST /api/auth/forgot-password { email, preferredLanguage }` → always 202; 503 `auth.password_reset_unavailable` when email is not configured or the global send budget is exhausted (checked before any account lookup).
  - `POST /api/auth/reset-password/check { token }` → 204, or 400 `auth.reset_token_expired` / `auth.reset_token_invalid`. Read-only.
  - `POST /api/auth/reset-password { token, newPassword }` → 200 `AuthResponse` (auto-login), or 400.
- **Token:** `TokenPurpose.PasswordReset = 2` in the existing `UserTokens` table, no migration. 30 min, single use, SHA-256 only, a new request revokes the previous one, 60 s cooldown, 5 per recipient per 24 h (silent), global budget shared with verification.
- **Link:** `{App:PublicBaseUrl}/auth/reset-password#token=…`; the page strips the fragment and keeps the token in memory.
- **Email:** en/hy/ru by the UI language at request time, sent to the address stored in the database (M-066).
- **UI:** "Forgot password?" under the password field; Request → Check your email (60 s countdown, "up to 5 emails a day") → Unavailable steps inside the auth dialog; `/auth/reset-password` page with check-on-load, form, expired/invalid states (focus moves to the heading); `/?forgot` deep link.
- **Session lifecycle (ADR-036):** chat hub and badge pollers follow the user id; `sessionReplaced` resets every non-auth slice on an A→B switch.

## How it was built
- Plan and nine decisions approved before code; the design came from Claude Design ("Forgot Password.html"), with ADR-035 overriding the mock where they differed (fragment vs query, 202 vs 200, 72 bytes vs 128 chars).
- Route 8: backend-dev → contract-guardian → frontend-dev → verifier (full) → reviewer → fixes in parallel → verifier (fast) → qa-engineer → session fix → verifier + qa → `/security-review` → recipient fix.
- What the later stages caught:
  - frontend-dev: error bodies parsed as text lost the `errorCode`; Enter reloaded the page.
  - reviewer: the ADR-030 §4 contradiction (accepted by Tigran, ADR amended); budget and cap logging; dead-link a11y.
  - qa-engineer on the real stack: user A's chat hub and pollers survived into B's session (ADR-036). The spec was red on the old UI and green on the fix.
  - `/security-review`: the reset link went to the request string (M-066).
- Docker Desktop's engine hung mid-feature; the orchestrator restarted it with Tigran's approval.

## Operating it
- Production needs `Email:Provider=Resend`, the API key and an https `App:PublicBaseUrl` (the ADR-028 §9 gate); otherwise forgot-password answers 503 and the UI shows "temporarily unavailable".
- Alerts worth watching: the Critical "Email send budget exhausted … verification and password reset" line, and Warnings for reset-cap hits (user id only).
- Real-stack specs: `e2e/real/password-reset-journey.spec.ts`, `password-reset-api.spec.ts`, `password-reset-session-replace.spec.ts`. They use `awaitRateWindow`; leave ~60 s between full real-tier runs.
- Known limitations: issued JWTs survive a reset (≤ 60 min, hbprFg3q); a recycled mailbox can take over a Google-created account (accepted, 6tIuqlpd).
