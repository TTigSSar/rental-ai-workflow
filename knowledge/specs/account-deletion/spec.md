# Account deletion — spec (ADR-056)

Goal: satisfy the Google Play account-deletion requirement. A signed-in user deletes their own account from the profile; a public page explains how.

## Contract (C)
- **`DELETE /api/auth/me`** `[Authorize]`, rate limit policy `auth`.
  - Request body `DeleteAccountRequest`: `password: string | null`, `email: string | null`. Password users send `password`; accounts without a password (Google only) send `email`.
  - **204** — deleted. Every token of the user is now rejected (ADR-055).
  - **400** `account.invalid_confirmation` — wrong password / email.
  - **403** `account.admin_cannot_delete`.
  - **409** `account.has_open_rentals` — ProblemDetails extension `openRentals: [{bookingId, listingTitle, startDate, endDate, role: "renter" | "owner"}]` of the `Approved`/`Active` bookings that block deletion.
  - **401** after a commit (e.g. retry) — the token is already revoked.
- `CurrentUserResponse` gains `hasPassword: bool` so the UI knows which confirmation field to show.
- Public profile of a deleted user → 404. Anywhere a deleted user appears as a counterparty/author, the API returns `isDeleted: true` and an empty name; the UI shows "Deleted user" / "Удалённый пользователь" / "Ջնջված օգտատեր".

## Schema (S)
- `Users.DeletedAt datetime2 NULL`. Migration is APPROVAL_REQUIRED.

## Behaviour
1. Check order: lock the user row (`UPDATE Users … WHERE DeletedAt IS NULL`) → admin → confirmation → open rentals → erase.
2. One transaction: close `Pending` bookings (outgoing → Cancelled, incoming → Rejected, ADR-046 CAS + `BookingEvent`, counterparties notified with actor "Deleted user"; a lost CAS rolls back → 409); archive own listings and clear their `AddressLine`, `Latitude/Longitude`, `PublicLatitude/Longitude`; delete their `ListingLocationBeforeHomePoint` rows; delete favorites, own notifications, user tokens; scrub other users' notification actor snapshots (`ActorName`, `ActorAvatarUrl`); erase meeting-point coordinates in chat messages the user sent; set `AiSearchLog.UserId = NULL`; replace the user's name in `Report.TargetLabel` / `ModerationLogEntry.TargetLabel` with "Deleted user"; erase the user's personal fields; set email `deleted-{id}@deleted.invalid`; `DeletedAt = now`; `TokenVersion + 1`.
3. After commit: delete the avatar file; send the "account deleted" email (en/hy/ru) to the captured address/language via `IEmailService` (ADR-029 rules: never throws, counts against the send budget).
4. Deleted users are excluded from admin user lists, search and catalogue.
5. Login, Google sign-in and password reset refuse a row with `DeletedAt` explicitly. Booking creation refuses a listing whose owner is deleted.
6. Blocking set is written against today's `BookingStatus`; re-map if ADR-046 v1.1 states land first.

## UI
1. **Profile → "Delete account"** (danger zone at the bottom of the profile/settings page).
2. **Confirmation dialog:** what is erased / what stays, password field (or email field when `hasPassword = false`), destructive button "Delete account", Cancel. Inline error for a wrong value (ADR-045 mapper).
3. **Blocked state:** on 409 the dialog lists the open rentals with links to them and explains they must be finished first.
4. **After success:** local logout, redirect home, toast "Your account has been deleted".
   - Network/server error before a response: inline error in the dialog, "your account was not deleted, try again".
   - 401 on the delete call: local logout, info toast "You've been signed out. If your account was deleted, we've sent you an email."
5. **Public page `/account-deletion`** (no auth, en/hy/ru): steps (sign in → Profile → Delete account), what is erased, what is kept anonymized, a "Sign in and delete" button that opens sign-in and then the profile. Linked from the footer.

## Acceptance
- A deleted user's old JWT gets 401; login with the old email/password fails; Google sign-in with the same Google account creates a fresh account.
- The counterparty still sees the booking, chat and reviews with "Deleted user".
- Deletion with an `Approved`/`Active` booking returns 409 and changes nothing.
- The confirmation email arrives in the user's language.
- `/account-deletion` opens without signing in.

## Route
Route 8: design (ux-designer → Claude Design → Tigran approves) → backend-dev → contract-guardian → frontend-dev → verifier → reviewer. qa-engineer: real-stack journey "delete account → old session rejected → counterparty sees Deleted user".
