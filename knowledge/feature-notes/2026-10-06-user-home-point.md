# The user home point, and what the tests could not see

**2026-09-18 → 2026-10-06.** A listing no longer has a location. Its owner does, and every listing they own inherits it. The model, its migration and both sides of the UI are in ADR-024; ADR-025 covers the notification copy. This note records what the code and the ADRs cannot.

## The shape of the work

Plan → five design boards in Claude Design → backend → contract → UI (owner side, then renter side) → QA → verification → review. Roughly 790 backend tests, 1600 frontend unit tests, 98 mocked journeys and a 3-test real-stack journey later, the feature's own numbers were never the interesting part.

## The through-line: every tier found a different class of defect, and the live walks found the ones that mattered

Nine defects reached a human. **Six of them were invisible to roughly 1,600 passing tests** and surfaced only when someone drove the real app in a real browser:

1. **An infinite district-lookup loop.** The status message under the map changed the container's height → the map box resized → Leaflet kept its pixel origin → the crosshair landed on a different geographic point → that read as a pan → new lookup → new message. ~450 ms per request against a rate-limited anonymous endpoint, forever. Worse: **Confirm submitted the pre-pan coordinate.** A unit test cannot see it because nothing in the component is wrong; the defect lives in the feedback between layout and map state.
2. **The renter-side origin never fired on a cold page load.** `ListingsEffects` is route-scoped, so on a cold `/listings` the lazy chunk registers effects *after* `/api/auth/me` has already answered — the action is long gone. Unit tests passed because the harness *sends* the action. The fix (drive off `store.select`, which emits on subscription) is what the regression test now pins, by subscribing rather than sending.
3. **A confirmation dialog with no way out.** `[closable]="false"` gates PrimeNG's `closeOnEscape` *and* `dismissableMask`, so "move all 13 of your toys?" could not be dismissed by keyboard or by clicking away. The template comment above it claimed "one focus trap and one Escape handler for both" — M-029's lie, verbatim.
4. **Two dialogs with no accessible name.** `aria-labelledby` pointed at PrimeNG's default header span, which renders only when no header template is supplied. A screen-reader user got "dialog", then a confirmation about relocating their whole catalogue. The second half was subtler: even with text in it, the element sat in a `display: none` subtree.
5. **The profile card spoke before it knew.** `toyCount()` reads a slice that is `[]` until `GET /api/listings/mine` answers, and the card renders first. In that window Remove was enabled, clicking it showed "Home point removed" while the server answered 409, and a move captured "0 toys" while the server relocated all of them. The spec asserted the broken behaviour as correct.
6. **A privacy test checking the wrong coordinates.** The real-stack `TOY_KITCHEN` constants were stale, so the assertion that an anonymous caller never sees the exact pin was comparing against a value nothing published any more.

The remaining three came from review, not from running: a stale `City` surviving the migration, `Country` still writable on update, and the create-while-moving race.

**What this says about the acceptance bar.** "All tests green" was true at every single one of those moments. The live walk is not a formality at the end of the checklist — on this feature it was the highest-yield tier by a wide margin, and four of the six are classes no unit test can reach: layout↔state feedback, bootstrap ordering, third-party component wiring, and render-before-data.

## Three green results that were not results

- **Four migration tests reported "passed" without running** on any machine without SQL Server — an early `return` is a passing xUnit test, and they guard the one irreversible step of the migration (M-049). The fix for *that* was also wrong on the first attempt: throwing from the probe surfaces at test **discovery**, which can still exit 0.
- **`/security-review` returned "no vulnerabilities" having read two markdown files.** The feature lives uncommitted in two nested repos the outer one does not track, so the diff it assembled contained none of the code (M-050). A clean bill of health and a review that never looked are indistinguishable from the outside.
- **The real-stack login budget had been hand-derived wrongly twice.** There are two independent rate-limit buckets, not one, because browser traffic arrives through nginx and helper calls go direct — so the suite's failures tracked the contents of the dev database, not its demand (M-044 amendment).

All three are the same mistake: a signal that means "nobody looked" rendered identically to "nothing is wrong."

## Decisions that changed under contact with reality

- **"Within Armenia" became "within Yerevan"** after Tigran saw the first design pass: a home point outside Yerevan cannot be saved at all, for renters too. That deleted the bounding box, the second error code, and the entire "Outside Yerevan is a neutral state" branch the boards had drawn.
- **Distance only travels with a radius** — Tigran rejected the boards' default badges. The home page's hero map is the one accepted exception, because a map called "Toys near your home" cannot be centred without it.
- **City is derived and fans out with the point.** Found by the implementer refusing to implement the spec literally: the spec enumerated what the fan-out copies and `City` was not in it, which produced a pin in Gyumri labelled Yerevan — exactly the contradiction the feature exists to remove.
- **The showcase split per district** solved a real problem (one Kentron pin for the entire public catalogue) and created a new one nobody asked about: thirteen production accounts sharing a published password. Caught by review as an unapproved widening of ADR-005; they now get random passwords and are not logins at all.
- **Coordinates in the `districts/at` query string** were raised as a Medium security finding and **accepted** as-is. Recorded in ADR-024 so it reads as a decision, not an oversight.

## Operational facts worth keeping

- **`dotnet run` ignores `ASPNETCORE_ENVIRONMENT`** — `launchSettings.json` forces `Development`, so a production-shaped boot needs `--no-launch-profile`. The first migration rehearsal silently ran the dev seed and polluted its own measurement.
- **The migration was rehearsed in both directions on real data**: `BACKUP ... WITH COPY_ONLY` → restore as a copy → `dotnet ef database update <previous>` (running `Down`, reconstructing the pre-feature state **from the undo tape**) → a production-shaped boot applying `Up`. Measured: 23 of 45 users got a point, 13 owners collapsed, worst case 19 distinct pins across 4 districts → 1 pin; tape complete 92/92; `Status` and `UpdatedAt` changed on 0 rows. That `Down`-then-`Up` path is also the rollback, which is why proving it was worth the time.
- **An agent applied the migration to the working dev database and left litter behind** despite the instruction not to (M-051). A live walk gets its own throwaway database, named as such.
- **`ListingLocationsBeforeHomePoint` is a permanent copy of every pre-migration exact coordinate.** Drop it in a cleanup migration once the production result is confirmed.
- The design tool's authorization expired mid-feature; five boards and the string dictionary had already been saved to disk, so work continued, but `hp.css` arrived two rounds late and **corrected four implementation guesses** — including a home marker rendered orange next to an orange circle and an orange toy pin, which read as another toy.

## Known drift, all deliberate

Distance badges wait for a radius; the picker's chip tints whole rather than by icon tile for ok/error; the filter's denied card keeps a `color-mix()`; `shared/ui/home-point-map` imports the district model from `features/listings` (Tigran chose not to move districts mid-feature); `HomePointUpdatedAt` shows the deploy date for migrated users. Three carded follow-ups: the move-side race, the desktop notifications panel, and the `MyListingStatus` drift this work happened to uncover.
