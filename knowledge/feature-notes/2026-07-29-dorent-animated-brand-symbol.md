# DoRent Animated Brand Symbol
Status: Completed | Decisions: ADR-011 | Mistakes: M-024 | PR: — (uncommitted on `dev` at time of writing) | Issues: —

## Goal

Replace the logo animation with the approved `jumping_ball.html` motion — vertical bounce,
squash-and-stretch, synchronized oval shadow — in two places: the desktop header hover, and a
mobile app startup/loading screen. Both had to run off **one** reusable implementation rather
than two unrelated copies.

## What the brief assumed vs. what was actually there

The request said "replace both existing logo animations". Exploration found that premise was
wrong in both halves, and correcting it up front shaped the whole plan:

- There was only **one** animation — the header's flat `translateY(-1px → -10px)` loop. No
  squash, no shadow, hover-only (no keyboard parity).
- The **mobile startup screen did not exist at all**. No splash component, no Capacitor/Cordova
  wrapper, nothing gated on `authInitializing`; `index.html` had only a `background:#faf8f4`
  anti-flash rule. That half was net-new work, not a replacement.
- What *did* exist in duplicate was the **markup**: byte-identical inline SVG in
  `app-header.component.html` and `home-page.component.html` (the mobile guest topbar, static).
  That was the real duplication worth absorbing — so the component got three consumers, not two.

Two conflicts with the design system also surfaced before any code: `DESIGN_RULES.md` §17 lists
"Bounce, spring overshoot" as **Prohibited**, and the reference's `#FF5A00` is not the brand
token `--ui-color-primary` (`#ff6008`).

## Alternatives considered

- **Boot screen scope** — mobile-only (chosen), all viewports, or additionally a pre-Angular
  splash inlined in `index.html`. The inline splash was rejected: it cannot reuse the Angular
  component, so it would be a fourth hand-maintained copy of the mark.
- **Shadow placement** — sibling DOM element (the reference's literal structure), suppressed in
  hover mode, or drawn inside the SVG viewBox (chosen; layout-inert). See ADR-011.
- **Design rules** — amend §17 with a bounded carve-out (chosen) vs. ship and leave the document
  contradicting the code.

The human resolved a fourth question in a way that became the hardest constraint: *"before hover
it should be static ball as it is now, on hover it should be replaced by the ball animation, but
the swapping should be not visible."* That forbids conditional markup and forces the rest state
to be the animation's `0%` keyframe — the central design idea, recorded in ADR-011.

## What went wrong

**Process:** the first implementing agent was killed twice by API limits — once mid-run (leaving
only two stray constants in `app.ts`) and once on the follow-up fix round. The recovery lesson is
mundane but real: `git diff --stat` is the only trustworthy account of what an interrupted agent
did. Its own recollection is not, and the second resume had to be told explicitly not to build on
files it believed it had written. A fresh agent, given a tight self-contained brief, completed the
fix round without difficulty.

**Product:** review caught two defects that a green 497-test suite did not — the wordmark
re-kerning by 8px, and a permanent shadow blob for reduced-motion users. Both are written up in
M-024, including why jsdom and a self-reporting agent were structurally unable to see them.

## Final solution

`app-ui-dorent-symbol` (`shared/ui/dorent-symbol/`) — `viewBox="0 0 100 100"`, `overflow: visible`,
`r="50"` so ink diameter equals the `size` input, per-instance `clipPath` ids, brand token for the
fill. Parent-driven `animate` input (the component never listens for hover itself), which is what
let the header add focus parity for free. Motion lives inside
`@media (prefers-reduced-motion: no-preference)`, with the falling edge branching between an
immediate clear (reduced motion) and a deferred `animationiteration` clear (loop running).

`app-ui-boot-screen` (`shared/ui/boot-screen/`) — full-viewport `--ui-color-background` field at a
new `--ui-z-boot: 1200`, gated on the existing `selectAuthInitializing` signal plus a 600ms
minimum-display timer and a once-at-construction `matchMedia('(max-width: 960px)')` check. Mounted
unconditionally with a `visible` input so it can fade rather than cut. `role="status"` /
`aria-live="polite"` / `aria-busy`, label from `app.shell.loading` (en + hy).

Three consumers wired: header (hover/focus), boot screen (always on, 72px), Home mobile topbar
(static). `DESIGN_RULES.md` §17 carve-out added.

**Verification:** 54 files / 498 unit tests green; `npm run build` clean; `verifier` fast tier
passed with no defects, measuring the acceptance bar directly in a real browser — ink 17×17px,
advance 21px, no reflow on hover, un-hover eases home in 530ms without freezing, reduced-motion
hover inert with the shadow returning to opacity 0, boot screen absent at desktop width and on
in-app navigation.

## Lessons

1. **Check the brief's premises before planning.** "Replace both existing animations" was wrong
   twice over; had it been taken at face value, the mobile half would have been scoped as an edit
   and the third duplicate SVG would have been left to rot.
2. **A constraint phrased as UX ("the swap should not be visible") is often a structural
   requirement.** Here it eliminated an entire class of implementations and dictated the keyframe
   layout. Translating it early was worth more than any amount of polish later.
3. **When the acceptance bar is "looks unchanged", the reviewer must produce the number.** See
   M-024 — the 8px regression was found by arithmetic on the diff, not by any test or any agent's
   self-report.
