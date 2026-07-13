# Rental Platform — Monorepo Map

Child-toys rental marketplace (Armenia/Yerevan). Two projects:

- `rental-api/` — ASP.NET Core 8 Web API, Clean Architecture, EF Core + SQL Server. See `rental-api/CLAUDE.md`.
- `Rental-Ui/` — Angular 21 SPA (standalone components, NgRx, PrimeNG, ngx-translate). See `Rental-Ui/CLAUDE.md`.

⚠️ `rental-api/README.md` is PARTIALLY OUTDATED (describes an early MVP without reviews, notifications, booking lifecycle extensions). Source of truth: controllers in `rental-api/src/RentalPlatform.Api/Controllers/` + `Rental-Ui/src/app/api/api-contract.ts`.

## Running locally

API (requires local SQL Server, `Server=.`, DB `RentalPlatformDbDev`, trusted connection):

```bash
dotnet run --project rental-api/src/RentalPlatform.Api/RentalPlatform.Api.csproj
# https://localhost:7241 and http://localhost:5241; Swagger in Development
# Dev seed runs automatically (idempotent, additive)
```

UI:

```bash
cd Rental-Ui && npm start        # port 4200; expects API at https://localhost:7241 (environment.apiBaseUrl)
```

Alternative — full stack via Docker (no local SQL Server needed):

```bash
docker compose -f rental-api/docker-compose.yml up --build -d
# SQL Server container (sa / RentalPlatform_SA#1), API on http://localhost:8080, UI container
docker compose -f rental-api/docker-compose.yml down -v   # teardown
```

## Tests

| Command | What |
|---|---|
| `dotnet test rental-api/RentalPlatform.sln` | backend unit/integration (`tests/RentalPlatform.Tests`) |
| `cd Rental-Ui && npm test` | frontend unit tests |
| `cd Rental-Ui && npm run e2e` | Playwright journeys — run against the real Angular app with the **backend stubbed at network layer** (`e2e/support/api-mock.ts`); no live API/DB needed |

## Demo accounts (dev seed, password `Demo1234`)

`admin@rental.local` (Admin) · `owner@rental.local` (owns seeded listings) · `renter@rental.local` (books/favorites) · `user2@rental.local` · `blocked@rental.local` (IsBlocked, for auth-rejection tests)

## Status machines (most common source of agent mistakes)

- **ListingStatus**: `Draft(0) → PendingApproval(1) → Approved(2) | Rejected(3)`; `Archived(4)` via archive/restore; rejected listings can `resubmit`. Public endpoints expose **Approved only**.
- **BookingStatus**: `Pending(0) → Approved(1) → Active(7) → Completed(5)`; also `Rejected(2)`, `Cancelled(3)`, `Expired(4)` (24h TTL on pending). Value 6 is retired — never reuse it. `BookingParty` (Renter/Owner) records who acted in the handover/return handshake.

## Engineering workflow (mandatory)

1. **Plan first**: non-trivial work starts in plan mode; the human approves the plan before any code.
2. **Specialist subagents** (`.claude/agents/`): `backend-dev`, `frontend-dev`, `contract-guardian`, `verifier`, `platform-engineer`. Give each a self-contained spec (files, constraints, definition of done). `platform-engineer` is the single owner of the production server, deploys, backups, and infra scripts — backend/frontend agents never touch the server, and it never edits business logic.
3. **Any API/DTO change** → `contract-guardian` must sync `Rental-Ui/src/app/api/api-contract.ts` and feature models.
4. **Verification is two-tier**: fast (build + affected tests + live feature walk) after each change; full (all tests + e2e + `/security-review`, a11y if UI changed) before merge.
5. `/code-review` on the branch diff before merge; human approves the merge. DB migrations always get human review of the generated migration.
6. **Release & production deploy**: implementation (backend/frontend) → contract-guardian → verifier → reviewer (+ `/security-review` before production when warranted) → `platform-engineer` prepares the release (branch state, changelog, readiness, deployment plan) → **the human reviews and merges to `main`** → platform-engineer deploys → runs `deploy/smoke.sh` → on failure executes or proposes rollback → updates infrastructure docs. Agents commit to `dev`; merge/push to `main` is human-only. A deploy is done only after the live smoke check passes. Never `docker compose down -v` in production.
7. **Close-feature step**: update `knowledge/decisions.md` (ADR-XXX) and `knowledge/mistakes.md` (M-XXX) when applicable; write `knowledge/feature-notes/<date>-<slug>.md` only for non-trivial features.

## Knowledge base (`knowledge/`)

Store only what the code cannot express: decisions (with rejected alternatives), mistakes, feature notes. Check `knowledge/mistakes.md` before starting work in an unfamiliar area.
