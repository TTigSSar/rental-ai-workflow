# Account deletion + Settings — implementation plan (ADR-056)

Route 8 (C + S + api+ui), MODE SEQUENTIAL. Behaviour: [spec.md](spec.md). Design: [design-notes.md](design-notes.md).

`BASELINE: rental-api@d8527d3 clean · Rental-Ui@f60ea6a clean · outer@a4f1c3a clean` (all on `dev`)
`EXPECTED: rental-api/src/** rental-api/tests/** · Rental-Ui/src/** Rental-Ui/e2e/** · knowledge/**`
`AGENTS: backend-dev → contract-guardian → frontend-dev → verifier → qa-engineer → reviewer`

## Step 1 — backend-dev (`rental-api`)
- Migration `AddUserDeletedAt`: `Users.DeletedAt datetime2 NULL`. **APPROVAL_REQUIRED** — stop after `migrations add`, Tigran reviews the generated file.
- `DELETE /api/auth/me` + `AccountDeletionService`: lock order, checks, single transaction, post-commit avatar delete + email (spec Behaviour 1–3); error codes `account.invalid_confirmation`, `account.admin_cannot_delete`, `account.has_open_rentals` (+ `openRentals` with `listingImageUrl`), `account.state_changed`; exempt from the blocked-write 403.
- `CurrentUserResponse.hasPassword`.
- Guards: login / Google / password reset refuse `DeletedAt`; booking create refuses a deleted owner; chat send to a conversation with a deleted party refused; no notifications/emails to a deleted recipient.
- Projections: `isDeleted` + empty name/avatar wherever a user is returned as counterparty/author/participant; public profile and review summaries of a deleted id → 404; deleted users out of admin lists, search, catalogue.
- Email template "account deleted" en/hy/ru (ADR-029 seam); server-side "Deleted user" strings for notification copy.
- Tests: service unit tests per rule, integration tests for the endpoint (204/400/403/409×2/401-after), JWT rejected after deletion, counterparty still reads booking/chat/reviews.

## Step 2 — contract-guardian
Sync `api-contract.ts` + models: `DeleteAccountRequest`, error codes, `openRentals`, `hasPassword`, `isDeleted` fields.

## Step 3 — frontend-dev (`Rental-Ui`)
- Settings: `/profile/settings` list page, `/profile/settings/password` (security page moved, `/profile/security` redirect), sidebar + mobile menu Security → Settings, Language moved in, Earnings/Verification/Notifications placeholders removed from the sidebar.
- Delete dialog (option B; sheet on mobile), all states, open-rentals state, 6a/6b toasts, logout via existing `AuthActions.logout()`.
- Public `/account-deletion` page (no guard) + footer link.
- Shared "Deleted user" component/pipe applied on every surface listed in spec UI 6; "Location removed" meeting-point bubble.
- i18n en/ru/hy; `KnownApiErrorCode` entries (ADR-045); dates via the ADR-052 pipe.
- Unit specs.

## Step 4 — verifier
Fast tier after each step; full tier before merge (all tests, e2e, `/security-review` on both repos, a11y). Before/after screenshot pairs for the profile sidebar, mobile menu and security→settings, shown to Tigran as a slider page.

## Step 5 — qa-engineer
Real-stack journey: delete account → old session 401 → counterparty sees "Deleted user" in booking/chat/review → open rental blocks deletion. Verdicts for any bugs found.

## Step 6 — reviewer
Diff `origin/main...dev` on both repos against this plan and ADR-056.

## Delivery
`ship-dev-pr` → Tigran merges → platform-engineer deploys (migration rehearsal on a restored backup, ADR-023) → smoke. The public page URL `https://dorent.am/account-deletion` goes into the Play Console after deploy.
