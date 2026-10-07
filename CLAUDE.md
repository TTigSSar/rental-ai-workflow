# DoRent — Monorepo Map

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

`admin@rental.local` (Admin) · `owner@rental.local` (owns seeded listings, home in Kentron) · `renter@rental.local` (books/favorites) · `user2@rental.local` · `blocked@rental.local` (IsBlocked, for auth-rejection tests) · `anahit@toyrent.am`, `narek@toyrent.am`, `lilit@toyrent.am`, `davit@toyrent.am`, `mariam@toyrent.am` (owners backing the toy-catalogue expansion, no bookings/reviews) · `gohar@toyrent.am`, `karen@toyrent.am`, `armen@toyrent.am`, `seda@toyrent.am`, `vahe@toyrent.am`, `hasmik@toyrent.am` (home-point cohort)

All 13 seeded owners have a home point, and together they cover all 12 Yerevan districts. **A home point outside Yerevan cannot be saved** — the district lookup is the validation authority, so there is no seeded Gyumri owner any more.

## Status machines (most common source of agent mistakes)

- **ListingStatus**: `Draft(0) → PendingApproval(1) → Approved(2) | Rejected(3)`; `Archived(4)` via archive/restore; rejected listings can `resubmit`. Public endpoints expose **Approved only**.
- **BookingStatus**: `Pending(0) → Approved(1) → Active(7) → Completed(5)`; also `Rejected(2)`, `Cancelled(3)`, `Expired(4)` (24h TTL on pending). Value 6 is retired — never reuse it. `BookingParty` (Renter/Owner) records who acted in the handover/return handshake.

## Engineering workflow (mandatory)

**Rule 0 — structural decisions are load-bearing and human-owned.** Every structural decision gets recorded in `knowledge/decisions.md` as an ADR — architecture, data model and schema, API/contract shape, state machines, auth and privacy boundaries, cross-cutting display and formatting rules (currency, dates, units), build and delivery topology, and the choice of any library or external service. Recording is not optional and not "when applicable": an unrecorded decision is one the next person will re-litigate or silently contradict.

Before starting work, read the ADRs covering the area you are about to touch. Then:

- **Work that follows a recorded decision** proceeds normally.
- **Work that would deviate from, contradict, supersede or quietly widen a recorded decision STOPS.** Bring it to Tigran with the full picture — which ADR, what it says today, what the new work needs, why the existing decision does not cover it, the options with their blast radius, and a recommendation. Change it only after he approves, then amend or supersede the ADR in the same change.
- **Work in an area with no recorded decision** is itself a decision to make. Surface it the same way rather than picking silently, and write the ADR as part of the work.

This applies to subagents too: a subagent that hits a structural question reports it back rather than resolving it. Never infer approval from a plan sign-off, an earlier session, a passing test suite, or another agent's report — only Tigran grants it, explicitly, for that specific decision.

1. **Plan first**: non-trivial work starts in plan mode; the human approves the plan before any code.
2. **Specialist subagents** (`.claude/agents/`, ADR-026): `backend-dev`, `frontend-dev`, `contract-guardian`, `verifier`, `reviewer`, `platform-engineer`, `qa-engineer`. Built-in `Explore`/`Plan` for read-only work; never `general-purpose` for project work. Route and hand off per **Delegation** below. `platform-engineer` is the single owner of the production server, deploys, backups, and infra scripts — backend/frontend agents never touch the server, and it never edits business logic. `qa-engineer` owns durable regression protection: real-stack E2E/integration journeys, regressions for confirmed bugs, fixtures, and the stability of QA-owned suites; it never writes application code, and unit tests next to code stay with the implementers.
3. **Any API/DTO change** → `contract-guardian` must sync `Rental-Ui/src/app/api/api-contract.ts` and feature models.
4. **Verification is two-tier**: fast (build + affected tests + live feature walk) after each change; full (all tests + e2e including the QA-owned suites for the affected areas + `/security-review`, a11y if UI changed) before merge.
5. **Review before merge**: the `reviewer` agent on routes 2 and 8 (below); `/code-review` and `/security-review` only when pointed at `rental-api` and `Rental-Ui` explicitly — they scope to the outer repo by default (M-034, M-050). Human approves the merge. DB migrations always get human review of the generated migration.
6. **Release & production deploy**: implementation (backend/frontend) → contract-guardian → verifier → `reviewer` (+ `/security-review` before production when warranted) → `platform-engineer` prepares the release (branch state, changelog, readiness, deployment plan) → **the human reviews and merges the PR into `main`** → platform-engineer deploys → runs `deploy/smoke.sh` → on failure executes or proposes rollback → updates infrastructure docs. A deploy is done only after the live smoke check passes. Never `docker compose down -v` in production.
7. **Git delivery** (`ship-dev-pr` skill): all three repos commit on `dev`, push to `origin/dev`, and deliver via a pull request into remote `main`. Local `main` branches were deleted 2026-07-31 — never switch to or recreate one. Merging the PR is human-only.
8. **Close-feature step**: record every structural decision in `knowledge/decisions.md` (ADR-XXX, per Rule 0 — mandatory, not "when applicable") and update `knowledge/mistakes.md` (M-XXX) where a mistake was made; write `knowledge/feature-notes/<date>-<slug>.md` only for non-trivial features. Every confirmed bug gets an explicit `qa-engineer` verdict before closing: `Regression test required` (with the minimal stable test) or `Regression test not justified` (one-line factual reason).

## Agent report contract (every custom agent, ADR-026)

The reply's first line is exactly `STATUS: DONE | BLOCKED | NEEDS_INPUT | FAILED | APPROVAL_REQUIRED`, then:

- `SUMMARY` (1–3 lines) · `FILES_MODIFIED` (list or `none`) · `OBSTACLES` (list or `None` — environment problems, failed commands, special flags, workarounds, assumptions, unexpected architecture) · `NEXT_STEP` (one line).
- `CHECKS` — writers and verifier: each command run → pass/fail. A writer's DONE without CHECKS is not accepted.
- `WHAT_IS_NEEDED` for BLOCKED/NEEDS_INPUT; `REASON / PROPOSED_ACTION / RISK / EXPECTED_RESULT` for APPROVAL_REQUIRED; `PLAN_DEVIATION` when the approved plan no longer holds.
- Role sections extend this (verifier VERDICT, platform Risk/Evidence, QA report, reviewer severities). Omit fields that don't apply.

**Stop and retry.** A retry must name what changed since the last attempt. Two failed fixes of the same cause → `BLOCKED`. An environment failure (DB down, port taken, tool or access missing) → `BLOCKED` at once, no retry. A re-run that turns green is not evidence. Stop when DONE_WHEN is met. A structural question → `NEEDS_INPUT` (Rule 0). Writers commit their own work on `dev` (only their paths); never push, stash or reset — the orchestrator reads the diff and pushes (ADR-026 §8, amended).

## Delegation (orchestrator)

**Facts first:** W = files change · R = repos touched ⊆ {outer, api, ui} · C = API contract changes (route, DTO field, auth, status codes) · S = schema changes (entity, EF config, migration) · P = production/infra · Q = security/authz/ADR-conformance question.

**Route — first match wins:**

| # | When | Route |
|---|---|---|
| 1 | P | `platform-engineer` (app code first via 6–8, then the release flow §6) |
| 2 | ¬W ∧ Q | `reviewer` |
| 3 | ¬W, ≤ ~5 reads | orchestrator directly |
| 4 | ¬W | `Explore` (≤3 in parallel, disjoint questions) |
| 5 | W ∧ R ⊆ {outer} | orchestrator directly (knowledge, agent config, tools, docs) |
| 6 | W ∧ R = {ui} ∧ ¬C | `frontend-dev` → `verifier` (fast) |
| 7 | W ∧ R = {api} ∧ ¬C ∧ ¬S | `backend-dev` → `verifier` (fast) |
| 8 | W ∧ (C ∨ S ∨ R ⊇ {api, ui}) | plan gate + baseline → `backend-dev` → `contract-guardian` (if C) → `frontend-dev` (if ui) → `verifier` → `reviewer`. S ⇒ the migration is APPROVAL_REQUIRED before merge |

**Overlays:** O1 a structural decision appears → stop, Rule 0. O2 confirmed bug → `qa-engineer` verdict before close. O3 before merge → verifier full tier (+ reviewer on route 8). O4 NEEDS_INPUT or PLAN_DEVIATION → stop downstream; re-approve if R, C, S or an ADR's scope grew.

**PARALLEL_WRITERS** — `backend-dev ∥ frontend-dev` only if ALL hold, otherwise sequential:
P1 the plan lists every changed route (verb, path, auth) and DTO field (name, type, nullability), or says "no contract change" · P2 backend ⊆ `rental-api/**`, frontend ⊆ `Rental-Ui/**`, and frontend-dev owns contract/model files for this run · P3 no migration is applied (`migrations add` is fine, `database update` is not) · P4 both hand-offs say `MODE: PARALLEL` — build + unit tests only; no `dotnet run`, `npm start`, `docker compose up`, Playwright, screenshots or e2e · P5 baseline recorded and both repos clean · P6 contract-guardian, verifier, qa-engineer and reviewer start only after BOTH return, and not at all if either is ≠ DONE. Post-check: each writer's FILES_MODIFIED stays in its repo.

**Execution baseline** (written into the plan at approval, before any writer runs): `BASELINE: rental-api@<sha> clean · Rental-Ui@<sha> clean · outer@<sha> clean` · `EXPECTED: <path globs>` · `AGENTS: <list>` · `MODE: SEQUENTIAL|PARALLEL`. Subagent edits are invisible to `/rewind` — git is the recovery point. Every completed step ends in a commit; the orchestrator reads that diff before pushing (M-002). Snapshot `git status --porcelain` before and after every read-only agent; any difference is a violation.

**Hand-off:** `TASK · MODE · SCOPE (repo, entry files) · CONTRACT (if C) · CONTEXT (only the relevant ADR/M excerpts — grep "^## ADR-|^## M-|Area:" — plus the knowledge/ paths) · CONSTRAINTS · OUT_OF_SCOPE · DONE_WHEN · PRIOR_RESULT (STATUS + FILES_MODIFIED + FINDINGS only)`. `Explore`/`Plan` don't load this file — put the expected report format in their prompt.

## Knowledge base (`knowledge/`)

Store only what the code cannot express: decisions (with rejected alternatives), mistakes, feature notes. Check `knowledge/mistakes.md` before starting work in an unfamiliar area.
