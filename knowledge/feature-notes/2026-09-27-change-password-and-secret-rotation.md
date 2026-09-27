# Self-service password change, and the secret rotation that needed it (Trello #49)

**2026-09-25 → 2026-09-27.** Started as two hygiene chores from the 2026-07-13 production deploy. Ended as a feature, four ADRs, three mistakes and a CI repair. The interesting part is not the code — it is the distance between what the records said and what was true.

## What the card asked for, and why it could not be done

> 1. Log in at dorent.am and change the bootstrap admin password via profile.
> 2. Rotate the Cloudflare tunnel token.

Item 1 named a screen that **has never existed**. `AuthController` was `register` / `login` / `external` / `me` / `me/preferred-language` — no change-password, no reset, no admin-side reset either. The fastest possible check (grep the controllers for a password route) takes seconds and would have reshaped the task in July. Nobody ran it for two months, because the card *looked* almost done.

It looked almost done because on 2026-07-16 someone blanked `BOOTSTRAP_ADMIN_EMAIL`/`_PASSWORD` in the server `.env`. That is a real and useful action — it stops a re-bootstrap on restart — and it is **not a password rotation**: `AdminBootstrapRunner` only ever creates, never updates, so the existing row's hash was untouched. The secret left the config; the credential stayed live. Two different properties, one of them achieved, the other assumed. See M-046.

The password was confirmed live on 2026-09-25 by logging in with it: `200`, `role=Admin`.

## What actually shipped

**The feature** (ADR-021 — the auth surface's first recorded decision of any kind): `PUT /api/auth/me/password`, `[Authorize]`, requires the current password even though the request is already authenticated. Page `/profile/security`, the first child route owned by the `profile` feature, reachable from three independent settings surfaces in `profile-page.component.html` that share no markup.

Three decisions inside it that are not obvious from the code:

- **A wrong current password is 400, not 401.** In this codebase 401 means "no valid token" and the Angular client reads it as an expired session — so 401 for a typo would tell the user they had been logged out.
- **Its own rate-limit policy** rather than the shared `auth` bucket, so a password change cannot eat the owner's login attempts from the same IP.
- **A password change does not revoke issued JWTs**, because there is no `SecurityStamp` or `jti` denylist to revoke against. Stated in the ADR and deliberately kept out of the UI copy, which never claims other devices were signed out. A false reassurance is worse than none.

**Two real bugs closed on the way**, neither of them the point of the card:

1. External-auth users are created with `PasswordHash = string.Empty`, and `BCrypt.Verify(x, "")` **throws** rather than returning false — so a password login against a Google-only account returned **500 instead of 401** and still burned a rate-limit permit. Invisible to the suite because `FakePasswordHasher` returns `false` where the real hasher throws (M-013's shape exactly), which is why the new tests use the real `BcryptPasswordHasher`.
2. **BCrypt ignores everything past byte 72.** The DTOs allowed 128 *characters*, so a wrong current password sharing the first 72 bytes of the real one verified as correct. Armenian and Russian are 2 bytes per character, so the real ceiling there is ~36 characters. Now capped in UTF-8 bytes where a password is **created**, and deliberately **not** where one is verified — capping the verification side would lock out anyone already holding a longer password. Both forms got a client-side byte validator too: the register form had no maximum at all, so without it this change would have made registration *worse* than before.

## The records that were wrong

- **ADR-009** said `dorent.am` sits behind Cloudflare Access. It never did — both hostnames answered 200 anonymously from day one, and `deploys.log` had said so in plain language since 2026-07-31. Worse, `smoke.sh` picks its mode from the *presence* of the Access service token, so the unconfigured state silently skips the very check that proves the gate is closed, and printed a clean PASS every deploy. Now ADR-020 (the stand is public, deliberately) and M-047.
- **ADR-005** claimed there is no rate limiting on login. There is, and there was when the line was written.
- **CI had not run for six weeks.** It triggers only on PRs into `main`, and none were opened between 2026-08-14 and 2026-09-27, while all work happens on a long-lived `dev`. Two tests requiring a real SQL Server had been failing since September and nobody could know. The badge showed green — from a run predating the code. ADR-022 and M-048.
- **The memory note said the server tracks `origin/dev`.** It tracks `main`, and has since 2026-07-14.

## Operational notes worth keeping

- **The Cloudflare dashboard no longer offers Refresh/Rotate token** on a tunnel page. Rotation is `PATCH /client/v4/accounts/{a}/cfd_tunnel/{t}` with a fresh base64 `tunnel_secret`, then `GET .../token`. Account tag and tunnel ID are both decodable from the token already in `.env`. **Prove it by the token's hash changing** — an API call returning `success: true` is not proof that a secret rotated. There is no rollback: the old token is dead the moment it rotates.
- **`backup-production.sh --verify` does not take a backup** — the two modes are mutually exclusive, so both runs are needed. Cron runs without `--verify`, so restorability is proven only by hand; the last proof before this work was 2026-08-14.
- **The deploy was rehearsed before it was run**: the fresh `.bak` was restored into a throwaway database and the newly built API image run against it, so all four migrations were proven on real data first. That rehearsal found that `AddConversationModeration` creates a **unique** filtered index — a single duplicate in live data would have aborted the migration mid-release. Whether to make this standing practice is an open decision.
- The release deployed in **77 seconds**, four migrations applied, row counts and column sums identical before and after (`sum(DepositAmount)` → `sum(CompensationAmount)` = 661 000.00 over 56 rows, byte-equal).

## The through-line

Four separate things here were recorded as true and were not: an ADR marked accepted but never implemented, a green CI badge from a run that never happened, a blanked config mistaken for a rotated credential, and a card describing a screen that did not exist. None was a bad decision. Each was a **claim nobody re-checked against reality**, and each survived precisely because checking was cheap and therefore never felt urgent.

The habit that caught all four is the same one: ask the system, not the document. Log in with the password. Hash the token before and after. Run the unmodified commit in the CI's own environment. Grep the controllers for the route.
