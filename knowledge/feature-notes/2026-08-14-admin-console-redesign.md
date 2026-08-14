# Admin console redesign — six screens, from `Admin.html`

Date: 2026-08-12 → 2026-08-14 | Area: `rental-api` + `Rental-Ui`
Decisions: [ADR-016](../decisions.md#adr-016-the-admin-console-owns-its-own-chrome-hiding-a-category-retires-the-label-not-the-inventory-and-the-needs-category-fix-flag-is-a-seeded-keyword-table)
Mistakes: M-032 (design tool unreachable from subagents), M-033 (dead agent's scaffolding + green-run counts don't prove a flake fixed), M-034 (`/security-review` scoped to the wrong repo)

## What it replaced

One page: `/admin/listings/pending` — a mobile-first card list over `GET /api/admin/listings/pending`, with approve and a six-reason reject bottom sheet. Deleted, with the path kept as a redirect.

## What shipped

Six screens (`/admin/overview`, `/review`, `/review/:id`, `/categories`, `/users`, `/reports`), responsive at 1280px and 390px from the design's own desktop and mobile boards, plus user-facing report submission on the listing-details and public-profile pages.

Backend: four new controllers (`AdminCategories`, `AdminUsers`, `AdminReports`, `AdminOverview`), an extended `AdminListings` (paged status-filtered queue with counts, detail dossier, `PATCH /{id}/category`), a new public `POST /api/reports`, and four migrations — `AddModerationLog`, `AddCategoryVisibilityAndColor`, `AddReports`, `AddCategoryKeywords`.

The reject-reason catalogue went from six codes to nine (`hygiene`, `pricing`, `other` added); all six originals stay valid because the owner-facing `edit-listing-page` renders stored codes.

## Scope questions put to the human

1. **How far?** — full six-screen console (over "review + inspect only" and "UI-only, zero backend").
2. **Which viewports?** — both, responsive, against the design handoff's own "desktop only" recommendation, because DoRent is mobile-first and the design ships 390px boards for every screen.
3. **Hidden categories** — retire the label, not the inventory. See ADR-016 §2; this reversed an implementation that was already written the broad way.
4. **Compliance checklist thresholds** — `photoCount >= 3` confirmed rather than agent-chosen.
5. **The "needs category fix" flag** — build the seeded keyword rule rather than drop the badge. See ADR-016 §3.

## Which tier caught what

Worth recording, because the distribution is lopsided and matches M-028's lesson.

**Unit + mock e2e caught:** nothing about correctness that the live walk didn't also catch. They caught plenty *during* construction, but every defect that survived into "all screens built, all suites green" was invisible to them — because the mocks encode the same assumptions as the implementation.

**The live walk (`verifier`, real API + real DB) caught:** the review queue's inline recategorise not refreshing the suggestion badge (the reducer patched `categoryId`/`categoryName` from the response and dropped `suggestedCategoryId`/`suggestedCategoryName`, which the backend recomputes on every category update); and a plural-copy defect. It also *confirmed* the hidden-category ruling from the renter side by direct API calls — the one check no mock could perform, since the whole question is what a different audience sees.

**`qa-engineer` caught, while writing e2e:** the stale detail dialog on `/admin/reports` and `/admin/users` — resolving or suspending from *inside* a dialog while on a tab that excludes the outcome made the row leave the status-filtered `items()`, so the sync effect never re-fired and the dialog froze showing "Open" with live Resolve/Dismiss buttons after the mutation had already succeeded. It reported it rather than fixing business logic, and re-scoped its own test around the broken path — which is exactly why the regression journey afterwards had to assert on that path directly.

**The orchestrator caught:** three agents reporting that enums serialise as **strings** and a fourth reporting **ints**. Reading `ServiceCollectionExtensions.cs` settled it — `JsonStringEnumConverter` is registered globally, so strings. Taking the outlier at face value would have produced a Reports contract expecting `0`/`1`/`2` where the API sends `"Open"`/`"Resolved"`/`"Dismissed"`: a runtime break that compiles clean and unit-tests clean, because the mocks would have encoded the same wrong assumption. Also caught the `/security-review` mis-scope (M-034) and the scaffolding that broke the whole test build (M-033).

## Deliberate deviations from the mock

AMD via `DramCurrencyPipe` instead of `₽`; everything i18n'd into en/ru/hy; no post-decision **Undo**, no category-change **notify-owner** composer, **"Message owner"** → public profile, no static "suggested steps" playbook — all four for want of a backend, see ADR-016 §4. Two more the implementing agents flagged and I kept: the mobile user profile is a focus-trapped modal sheet rather than the design's non-modal screen-swap (one dialog idiom across the console beats two), and no "You" pronoun for the current admin in the activity feed (the backend gives no "is this me" signal, and on a shared audit trail the real actor name is more useful).

## Left open at close

- **Suspension does not cascade.** Access is cut immediately (`EnsureAdminAsync` re-reads the user and rejects on `IsBlocked`, so a valid JWT stops working), but approved listings stay public and bookable and in-flight bookings keep their status. Product decision, not an oversight.
- **Message reports do not verify conversation participation.** The security review established this is *inert* — the non-participant `TargetLabel` fallback returns `"Chat about {ToyTitle}"` (a public listing title) and deliberately does not name either counterparty, and conversation ids are unguessable v4 GUIDs. A product question, no longer a security one.
- **The four migrations were applied to the local dev DB** for the live walk (rollback target: `20260804210502_AddBookingNote`) but have **not** had the human review the repo requires before merge.
- **`admin.categories.card.listingCount`-class plural defects** were swept across the `admin.*`/`reports.*` subtrees — 13 `{{count}}` strings checked, 3 fixed, 9 confirmed unaffected. Other subtrees were not swept.
- **A flaky spec in `public-profile-page.component.spec.ts`** is unresolved: reproduces only under the full parallel run, passes in isolation. Two hypotheses were disproved empirically (cross-file module-singleton leakage does *not* occur — each spec file gets its own module registry even under `isolate: false`), and the original `resetTestingModule()` fix rested on a false analogy. Mechanism unidentified.
- **`resetSelectors()` teardown is missing** in `auth.guard.spec.ts`, `guest.guard.spec.ts`, `admin.guard.spec.ts`. Currently masked because every test re-overrides before asserting; it is an order-dependency landmine for the next test added to those files. `overrideSelector` mutates the memoized selector function's own closure, and `resetSelectors()` only walks a Map private to one `MockStore` instance, so a later instance cannot undo an earlier override.

## Process notes

Design files must be fetched by the orchestrator and handed over as scratchpad paths — subagents cannot reach `DesignSync` (M-032). Session limits interrupted work six times; agents resumed cleanly from their transcripts every time, but the cost is real and argues for narrow read scopes in task prompts, since exploration is what consumes the budget.
