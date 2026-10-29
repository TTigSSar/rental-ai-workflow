# AI search — implementation plan (ADR-054)

## Context
Product, design (stages 1–3) and ADR-054 are approved. Both parsing and ranking use **OpenAI GPT-6 Luna**, called directly at the OpenAI API, as chosen by `tools/ai-search-eval` (ADR-054, amended 2026-10-29; this replaces the earlier choice of Haiku 5.5 to parse and Sonnet 5.5 to rank). Approved behaviour lives in `knowledge/specs/ai-search/spec.md` and `design-notes.md`. Design: Claude Design project `df24299b…`, files `AI Search Stage 1 v2 / 2 / 3.html`.

Goal: a signed-in user turns on the "AI" switch in the catalogue search and describes a toy. The API fills the existing filters, ranks up to 20 candidates and returns real listings. If AI fails, the catalogue still works.

Route 8 (C + S + api+ui): **backend-dev → contract-guardian → frontend-dev → verifier → reviewer**, MODE SEQUENTIAL. The migration is APPROVAL_REQUIRED before merge.

**Decisions made while planning (Tigran, 2026-10-28):**
1. On desktop the AI field sits above the results on `/listings`, as in the design. The header search is hidden on that page.
2. Age uses the **existing age groups**. They are added to the mobile filter sheet, and AI maps the child's age to the group that contains it (3 years → "3–5").

`BASELINE:` re-check all three repos at the start of each card. Backend WIP is on rental-api branch `feature/ai-search` (7dd817d).

## Contract (C)
- **`POST /api/listings/ai-search`** `[Authorize]`, rate limit policy `AiSearchPolicy` (5 per minute per user).
  - Request `AiSearchRequest`:
    - `description: string` (1–500 chars)
    - `filters: AiSearchFilters | null`. Null on the first search. On re-rank or page 2+ it carries the user-edited filters, which are then **not** re-parsed.
    - `page: int = 1`, `pageSize: int = 20`
    - `excludeIds: Guid[] | null` (page 2+: the page-1 ids)
  - `AiSearchFilters` (all nullable): `categoryId: Guid?`, `ageGroup: string?` (existing group key), `maxPrice: decimal?`, `districtIds: Guid[]?`, `nearHome: bool`, `radiusKm: double?`
  - Response `AiSearchResponse`:
    - `items: ListingPreviewResponse[]`, `page`, `pageSize`, `totalCount`, `hasMore`
    - `appliedFilters: AiSearchFilters`
    - `ranked: bool` (true only for page 1 when ranking succeeded)
    - `intent: string?` (UI language; null when AI is unavailable or the order isn't ranked)
    - `widenedDistrictIds: Guid[]` (districts added by auto-widening)
    - `purposeWidened: bool`, `datesMentioned: bool`, `locationNotConsidered: bool`
    - `aiUnavailable: bool` (true → this is a plain text search on the description)
  - Errors (ADR-045 ProblemDetails with `errorCode`):
    - 401 `ai_search.unauthenticated`
    - 400 `ai_search.invalid_description`
    - 429 `ai_search.rate_limited`, with `Retry-After`
    - 503 is **never** used: AI failure is a 200 with `aiUnavailable: true`
- **`GET /api/listings/ai-search/status`** `[AllowAnonymous]` → `{ available: bool }` (false when the daily budget is spent or no key is configured).
- UI language comes from the `Accept-Language` header (en/ru/hy), the same as ADR-025.

## Schema (S)
New entity `AiSearchLog`:
- `Id`
- `UserId?` (FK, `SetNull`)
- `CreatedAt` (UTC)
- `Description?` (nvarchar(500); nulled after 30 days)
- `ParseModel?`, `RankModel?`
- `InputTokens`, `OutputTokens`, `CostUsd` (decimal(10,6))
- `LatencyMs`
- `Outcome` (string: `ok | ranking_failed | ai_unavailable | budget_exhausted`)

Index on `CreatedAt`. One migration, `AddAiSearchLog`.

## Backend (backend-dev) — rental-api
- **Application:**
  - `IAiSearchModel` with `ParseAsync(description, lang, catalogs)` → `AiParsedQuery` and `RankAsync(description, candidates)` → ordered ids.
  - `IAiSearchService` / `AiSearchService`:
    1. validate
    2. check the budget
    3. parse (GPT-6 Luna)
    4. map to `ListingsQueryFilter`. The age group comes from months. `nearMe` with a home point means the server reads the **user's home point** (`User.HomeLatitude/Longitude`) and sets radius 1 km. Without a home point, `locationNotConsidered`. Exact coordinates **never** go to the model.
    5. query the catalogue
    6. if 0 results, widen up to 2 steps: districts via the adjacency constant, then drop purpose keywords. Never widen age, an explicit price or "only".
    7. rank the first ≤20 (GPT-6 Luna), validate ids (drop unknown, append missing). **This step runs only for `page == 1`.** For `page ≥ 2` the service makes **no LLM call at all**: no parse (the request's `filters` are used as they are) and no rank. It returns the plain catalogue order (`CreatedAt desc`) with `excludeIds` applied, `ranked: false` and `intent: null`. A filter change re-ranks, so it is always a new page-1 request.
    8. write the log (page ≥ 2 is not logged, because it costs nothing)
  - Validate the intent line on the server: drop it if it contains digits or district names.
  - DTOs as in the contract. Error codes go in a static class `AiSearchErrorCodes`, following `HomePointErrorCodes.cs`.
- **Catalogue reuse:** add `ExcludeIds` to `ListingsQueryFilter` and apply it in `ListingsQueryService.BuildApprovedListingsQuery`. Add an internal method that returns candidates, so the Approved-only rule stays in one place.
- **Infrastructure:**
  - `OpenAiAiSearchModel`: a typed `HttpClient`, the same pattern as `ResendEmailSender.cs`. It sends raw HTTP to the OpenAI API (`Authorization: Bearer`) with a strict JSON-schema structured output and reasoning effort `low`. The request shape is in `callOpenRouter` in `tools/ai-search-eval/run.mjs`, which is OpenAI-compatible. Verify the direct model id (`gpt-6-luna`) and the endpoint against the current OpenAI docs.
  - Prompts are taken from `tools/ai-search-eval/run.mjs`. The description is passed as data.
  - Timeout 8 s, no retry. Never throws: failure returns null.
  - `AiSearchOptions` (section `AiSearch`): `ApiKey`, `ParseModel`, `RankModel`, `DailyBudgetUsd = 1`, `PerUserPerMinute = 5`, `NearMeRadiusKm = 1`. Bound with `ValidateOnStart`. A missing key means AI is unavailable, not a startup failure.
  - Budget: the sum of today's `AiSearchLog.CostUsd` since Yerevan midnight. Add a `YerevanCalendar` helper (fixed UTC+4, ADR-048) in Domain. This survives restarts.
  - `YerevanDistrictAdjacency`: a static map of the 12 district codes.
  - `AiSearchLogCleanupService`: a `BackgroundService` with a `PeriodicTimer`, every hour, in the style of `ExternalAuthNonceSweepService.cs`. It sets `Description = null` on rows older than 30 days.
- **Api:**
  - `ListingsController` gets two actions, `[EnableRateLimiting(AiSearchPolicy)]`.
  - New policy in `RateLimiterExtensions.cs`: per user, 5 per minute, using `ResolveUserKey`. Plus an `OnRejected` that writes the ProblemDetails `ai_search.rate_limited` body **only** for this policy.
  - Production env: `AiSearch__ApiKey` in `docker-compose.production.yml` (the platform-engineer sets the real key at deploy).
- **Tests:** a `FakeAiSearchModel` swapped in `RentalPlatformWebAppFactory`. Integration tests cover:
  - parse → filters → ranked page 1
  - page 2 with `excludeIds`: the fake model's call counter stays at 0, order is `CreatedAt desc`, no page-1 id repeats
  - rank failure → fallback order, `ranked: false`
  - parse failure → `aiUnavailable` plus a text search
  - budget spent → status false
  - 429 + `errorCode`
  - 401
  - widening never touches age or price
  - the home point is not sent to the model
  - log cleanup

  Unit tests: id validation and the adjacency map.

## Contract sync (contract-guardian)
- `ApiContract.listings.aiSearch` and `aiSearchStatus` in `Rental-Ui/src/app/api/api-contract.ts`
- the models in `features/listings/models/ai-search.model.ts`
- the `KnownApiErrorCode` entries plus `API_ERROR_MESSAGE_KEYS` (`api/api-error.model.ts`, `api-error-mapper.ts`)

## Frontend (frontend-dev) — Rental-Ui
- **Search field + "AI" switch** (`role=switch`). On mobile: inside the sticky bar of `listings-filters`. On desktop: a new field above the results on `/listings`, with the header search hidden on that page.
- The field grows while typing and collapses after a search. The privacy note shows only while typing. A first-use example is shown. Esc and Enter work.
- **State:** a new slice in the listings store (actions/effects/selectors) holds:
  - `aiMode`, `description` (kept separately, never written to `q`), `aiResult` flags, `rankedIds`, `aiStatus`
  - The URL gets `ai=1`. The description and `q` are never put in the URL. The AI-applied filter values are written as the existing catalogue params (`categoryId`, `ageGroup`, `maxPrice`, `districtIds`, `radiusKm`), so the URL-driven filter controls keep them. (Tigran, 2026-10-29.)
  - `AiSearchFilters` has no `minPrice` and no origin other than home. So after an AI search or re-rank, a user's min price or a non-home radius is dropped: the filters show only what the server applied. (Tigran, 2026-10-29: accepted for now, no follow-up card.)
  - Turning the switch off restores the previous filters, `q`, sort and view.
- **Results:**
  - AI-set values go into the **existing** filters and chips, with the `#C24600` border and the count badge. Each widened district gets its own chip and is checked.
  - The explanation line and "· most relevant first" show only when `ranked`.
  - Sort gets a new option "Most relevant first", the default in AI mode. Choosing another sort drops the AI order.
  - Infinite scroll continues from the endpoint with `excludeIds`. The divider sits before card 21.
  - A filter change re-ranks, debounced 400 ms, with the "Updating the order" state.
- **Age:** add the existing `AGE_GROUPS` pills to the mobile filter sheet (`listings-filters`). The desktop sidebar is unchanged.
- **States** (stage 2–3 design):
  - loading: dimmed cards plus a status line and an indeterminate bar; skeleton on the first search
  - no results: option A — "Widen the area" drops districts, "Increase the budget" focuses price "To", category pills, "Edit description"; the bell stays hidden until #220
  - `aiUnavailable`: a `ui-msg` info notice, and the switch turns off automatically but stays enabled
  - budget spent: `aria-disabled` switch, tooltip on desktop / Note on mobile, driven by `status` loaded on page init
  - 429: a warn notice; the description and cards stay
  - dates and location Notes
  - "near me": the existing radius filter set to home and 1 km
  - guest: submit opens the existing auth dialog; after sign-in the search runs automatically, using the `pairwise` pattern from `auth-dialog.component.ts:99-109`
- **i18n:** keys under `listings.ai.*` in en/ru/hy (parity spec). ru/hy copy follows the design proposals.
- **Tests:** unit specs for the effects/selectors and the switch component. `e2e/support/api-mock.ts` gets an `aiSearch` seed. A Playwright journey covers switch on → describe → ranked results → page 2 divider, plus `aiUnavailable`.

## Out of scope
- the bell and subscriptions (Trello #220)
- date availability
- browser geolocation
- a native-speaker review of the ru/hy copy (a follow-up)

## Verification
1. **Fast tier after each writer:** `dotnet test rental-api/RentalPlatform.sln`, `cd Rental-Ui && npm test && npm run build`.
2. **verifier, live walk:** API plus UI locally with the real `OPENAI_API_KEY`, accounts `renter@rental.local` (has a home point) and a guest. Check:
   - en/ru/hy queries fill the filters
   - the ranked page 1 and the page 2 divider
   - a filter change re-ranks
   - no results → widen
   - removing the key → `aiUnavailable` notice and the switch turns off
   - `DailyBudgetUsd=0` → disabled switch
   - 6 quick searches → 429 notice
   - "near me" uses the home chip
   - guest → dialog → the search resumes
   
   Mobile 390 and desktop 1280 screenshots, before/after slider per the memory rule.
3. **Full tier before merge:** all tests + `npm run e2e` + `/security-review` pointed at rental-api and Rental-Ui (focus: prompt injection, key handling, 30-day cleanup, no PII to the provider) + a11y.
4. **reviewer** against this plan and ADR-054/045/048/008. Tigran reviews the generated migration.
