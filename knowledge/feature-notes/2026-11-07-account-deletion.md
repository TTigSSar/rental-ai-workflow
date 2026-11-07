# Account deletion + Settings (2026-11-04 → 2026-11-07)

Decisions: ADR-056 (with the 2026-11-04, AD-3, AD-7 and AD-6 amendments), ADR-021 amendment (inline change-password in Settings), ADR-029 §5 and ADR-030 §11 back-referenced. Mistakes: M-083, M-084. Spec: `knowledge/specs/account-deletion/` (spec, design-notes, implementation-plan). Trello: list "Account Deletion" (AD-1…AD-7).

## What shipped
- **`DELETE /api/auth/me`** — self-service anonymization: the `Users` row stays with `DeletedAt`, personal data is erased, `TokenVersion` bumps (sessions and SignalR end), tokens are deleted, a confirmation email (en/hy/ru) goes to the pre-erasure address. Password or (Google-only) email confirmation; admins get 403; blocked users may delete.
- **Open rentals block deletion:** 409 `account.has_open_rentals` with the list; Pending bookings are cancelled/rejected; a lost race → 409 `account.state_changed`.
- **Deleted user everywhere:** role-named `*IsDeleted` flags, empty name/avatar, "Deleted user" in the UI; public profile and review summaries → 404; catalogue/search/admin lists exclude deleted users; no notifications or emails to a deleted recipient; chat read-only (send → 409 `chat.participant_deleted`); report and moderation-log labels rewritten.
- **UI:** `/profile/settings` (password, language, delete), delete dialog (sheet on mobile, blocked state with rentals), public `/account-deletion` page for Google Play, footer link.
- **Migration:** `AddUserDeletedAt` (nullable column, metadata-only on SQL Server).

## How it was built
- Route 8 per card (AD-1…AD-5, AD-7), each merged to main separately; AD-6 closed it with a real-stack journey, full verification, review and `/security-review`.
- AD-6 review caught the approve-vs-delete race and leftover names in report moderation-log rows (M-083); fixed with a CAS approve and a post-close re-check. `/security-review`: no findings.
- qa-engineer found the stale language real spec (M-084).

## Operating it
- **Rollback:** `Down()` of `AddUserDeletedAt` drops `DeletedAt`. After any production deletion a rollback would make deleted rows look live again (blank names) in admin lists and public profiles. Roll back the app, not the migration.
- Play Console data-deletion URL: `https://dorent.am/account-deletion` (after deploy).
- Real-stack spec `e2e/real/user-account-deletion-journey.spec.ts` runs last (auth budget); it uses disposable `qa-del-*` users — never delete a seeded account (the seed does not restore it). The dev email budget (100/24h, in memory) is reset by `docker compose restart api`.
- Known gaps: chat "counterpart deleted" footer copy may be unreachable (open product check); two pre-existing serious axe findings (listing-card age badge contrast, Messages nav aria-label).
