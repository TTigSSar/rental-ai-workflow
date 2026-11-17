# Browse Redesign Stage 1
Status: Completed | Decisions: ADR-066, ADR-064 (amended), ADR-054 (amended) | Mistakes: M-091 (recurred), M-093 | PR: pending | Issues: Trello #271

**Goal.** Build the Claude Design "Browse Redesign Stage 1" on `/listings`:
- a 300 px filter sidebar with counts;
- a search bar with Smart search;
- active chips;
- List/Map and server sort;
- a 3-column grid of the same toy card Home uses.

**Plan.** Tigran chose the full scope (2026-11-16) and one shared card (2026-11-17). Route 8:
- backend: filters v2, facets, sort, District on every grid;
- contract;
- frontend A: the shared card;
- frontend B: the browse page;
- verifier, QA, reviewer.

**Alternatives rejected.** These are in ADR-066 and the ADR-064 amendment:
- a UI-only redesign with single-select and client sort;
- facet counts that ignore the active filters;
- keeping a Home-only card.

**What went wrong.**
- **The first plan assumed Home used `featured-listing-tile`.** That component was dead; Home used `home-toy-card`. Tigran caught it at plan review.
- **The first review found three decisions no ADR covered.** It flagged all three, and Tigran decided them:
  - distance under Nearest without a radius: shown;
  - `sort=nearest` restored from a URL: counts as an explicit choice;
  - AI mode dropping multi-select and condition: the AI contract was extended instead.
- **The AI response normaliser silently dropped the new list fields (M-093).**
- **A worktree junction wiped `node_modules` again (M-091).**
- **A real race:** "Clear all" under Nearest made two merge navigations in one tick and brought cleared filters back. A spec reproduced it, then it was fixed.

**Final solution.**
- **rental-api** (209d461, d86ecb5, 9368b97):
  - `categoryIds`, `ageRanges` and `conditions` with caps;
  - `GET /api/listings/facets`;
  - `sort`, where `nearest` without an origin returns 400;
  - District and the ≥2-review rating on the catalogue, favorites and profile grids;
  - AI search takes the same lists.
- **Rental-Ui** (eb57297 … final):
  - `app-listing-card` is the single card everywhere, with one top-left pill (Rented > owner > booking);
  - `browse-filters-panel`, the `.bsearch` toolbar, the sort listbox, the facets effect and the 3-column grid;
  - the mobile sheet gets the same controls in its old style.

**Lessons.**
- Give the verifier's "before" build its own `git archive` + `npm ci`.
- Send every structural question found in review back to Tigran, not to a writer.
- An honest "1 review" state beats "No reviews yet" (ADR-014).

**Known gap (Tigran, 2026-11-17: not needed now).** The backend never emits `listingStatus`. As a result:
- the "Rented" pill never shows on real data;
- the owner page's "In rent" tab stays at 0.

This predates #271. No card was opened.
