# Home design alignment + hero map (2026-08-11)
Status: Completed | Decisions: ADR-015 | Mistakes: M-031 | PR: — | Issues: —

Aligning `/` to the `DoRent Home` Claude Design project, which the human named as the source of
truth. Architecture and rejected alternatives live in **ADR-015**; the permission defect and its
detection story live in **M-031**. This note covers what shipped, what did not, and why.

Builds on the map component from [`2026-08-01-catalogue-map-view.md`](2026-08-01-catalogue-map-view.md)
(ADR-012) and inherits the geo model and privacy rules from the Maps P2 work — read those first.

## Reading the design

The published `DoRent Home (offline).html` is a self-contained bundle whose inlined image resources
push it past the 256 KiB `DesignSync.get_file` cap, so it reads back **truncated** — the `<script
type="__bundler/template">` tag carrying the actual markup is cut off entirely. The spec was instead
read from the project's own sources, which are small and authoritative: **`home.jsx`** (the complete
desktop + mobile page) and **`system.jsx`** (`TOKENS.A`, "Direction A / Refined Warm" — the palette
the app already ships). Worth remembering for the next design import: **prefer the `.jsx` sources
over the bundled `.html`**, which is a build artifact.

## What shipped

Three decisions were put to the human before implementation rather than resolved in-flight:

- **The hero map was built for real** — real geolocation, real pins, real counts — not stubbed.
- **The design's FAQ answer copy was rejected** in favour of the app's existing `en`/`hy`/`ru` text.
  The mock's answers are generic; the shipped copy describes actual deposit and cancellation
  mechanics. Design is source of truth for form, not for claims (ADR-014). Only the heading changed,
  to the design's `FAQ's`.
- **The category tile keeps one visible label.** The design shows it twice on desktop (burned into
  the gradient tile *and* in a white box below); the app deliberately shows one, and the human chose
  to keep that.

**Layout fixes.** The trust strip moved from after the listing sections to between the hero and "Toy
Categories", where the design puts it — the single highest-value correction, and the one that had
been silently wrong longest. Category tiles gained the translucent 64px icon chip. The process
steps, role toggle, FAQ block, section-action link and mobile search pill were retuned to the
design's exact tokens.

**The hero map** is a new `HomeHeroMapComponent` wrapping the existing `app-map`: 460×330 beside the
hero text on desktop, full-width 196px below 1024px. It needed **no backend work at all** — pins come
from `getMapPins` (geohash-7 centroids, already the privacy-safe source), and the count from
`getListings(filter, 1, 1, origin)` reading `PagedResult.totalCount`, since no count-near-a-point
endpoint exists and `ListingsState` discards `totalCount` in its reducer.

**`app-map` gained `markerVariant: 'brand' | 'twinkle'`**, default `'brand'`. The default is what
makes it additive, and `map.component.spec.ts` passing **byte-unchanged** through the whole change is
the evidence — verified via `git diff`, not asserted. `'twinkle'` markers are purely decorative: no
`role`, no `tabIndex`, no listeners, so the hero map contributes exactly one tab stop (the opt-in
button) and never a field of focusable noise.

**A new `nearby` slice in the Home store** calls `ListingsApiService` directly rather than
dispatching the listings feature's `loadMapPins`, which writes `ListingsState.mapPins` and is owned
by the `/listings` map view. Verified live by walking Home → `/listings` map → Home.

## What went wrong

The permission defect is M-031 and the design-mock rule is ADR-015. Three smaller things are worth
recording here:

- **The pill occluded the MapTiler logo.** Caught by reading a screenshot the `verifier` had itself
  produced and passed. The agent measured every number it was asked to measure and all of them were
  right; nothing in the brief said "look at whether these two elements sit on top of each other."
  A checklist verifies the things on it.
- **`userAccuracyMeters` was forwarded unbounded.** A WiFi/IP fix — precisely what desktops get from
  `GeolocationService`'s `FALLBACK_OPTIONS` — returns kilometre-scale accuracy and drew a circle
  wider than the panel. Same family as M-027: an honest uncertainty value rendered at a scale where
  it destroys the view. Now clamped at the **Home boundary only** (1400 m, derived from Web Mercator
  metres-per-pixel at Yerevan's latitude and zoom 14 against the tighter 196px mobile panel), never
  in `GeolocationService` or `MapComponent`, where real accuracy still matters to other consumers.
- **`/security-review` scoped itself to the wrong repository.** It targets the repo it is invoked
  from; `rental-app`'s tree was clean, so it diffed months-old documentation commits and would have
  returned a confident, worthless report. The real changes always live in the nested `rental-api` /
  `Rental-Ui` repos. **Check what a review actually diffed before reading its findings.**

## Lessons

**Two reviews, two lenses, one bug.** `/code-review` and `/security-review` independently found the
same root cause — the unsolicited prompt — and neither framing subsumes the other: one saw a broken
feature two pages away, the other saw PII widening into access logs. Running both is not redundant.

**Green tests are not evidence a feature should exist.** 656 unit tests, a purpose-built e2e journey
covering *both* permission paths, and a passing live walk all held while the feature was quietly
disabling an unrelated page. Every tier verified intent; none could question it.

**Ask before building the ambiguous half.** The three scope questions cost one round-trip and
prevented rewriting product-accurate FAQ copy with mock text, and re-litigating a documented
a11y decision on the category tile. The design was the source of truth for form — and the human was
the source of truth for which conflicts were worth resolving in the design's favour.

## QA verdict

**Regression test required** — delivered. `e2e/home-hero-map.spec.ts` (7 tests) covers: no prompt on
load (asserted against a **real**, `addInitScript`-wrapped `navigator.geolocation`, so it also catches
a regression that bypasses `GeolocationService` entirely — complementary to the unit spy on the
injected service); the opt-in journey end to end, with different counts before and after the click so
the *switch* is proven rather than mere presence; the M-027 truncation guard in both directions; and
licence-chrome non-overlap for the pill and the opt-in button against the MapTiler logo and Leaflet
attribution at 1440px and 390px — a regression test earned by a bug that had already happened once.

Run 4× individually plus `--repeat-each=3` (49/49, zero flakes) and the full suite twice (39/39).
Full tier before merge: `dotnet test` 358/358, `npm test` 666/666, `npm run e2e` 39/39, axe clean of
violations attributable to this work.
