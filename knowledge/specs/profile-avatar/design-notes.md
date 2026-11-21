# Profile picture (upload / change / remove) — design notes

Trello #279 · ADR-070 · Plan v2.2 (orchestrator plan `mighty-forging-balloon.md`).
Export: [design/](design/) — copied from the claude.ai artifact "DoRent Profile Photo" (`https://claude.ai/artifact/9agHQtq2c6HucKKDkZiUXB`, version 1795251435-b38a). Start with `design/README.md` (copy table en/ru/hy, states A–G), then `components/<Name>/README.md` + `preview.html`; full frames in `components/MobileFrames`, `DesktopFramesAD`, `DesktopFramesEG`, `DesktopOption2`. Prompt: ux-designer stage-1 report (2026-11-21).

## Approved decisions (Tigran, 2026-11-21)
1. **Entry point = option 2.** Desktop: no camera badge at rest; hover, focus-visible and press show `ui-color-scrim` with a white 24px camera over the whole circle (`components/DesktopOption2`). Mobile keeps the camera badge.
2. **The whole avatar is one `<button>`** (hit area circle + 6px, ≥44px), name "Change profile photo" / "Add profile photo". Sizes: mobile card 56px, desktop sidebar 72px, desktop identity card **96px**.
3. **Actions.** Mobile: bottom sheet (settings-sheet shell, swipe-down, ADR-061) titled "Profile photo"; no photo → primary "Upload photo"; with photo → primary "Change photo" + quiet danger-text "Remove photo"; Cancel secondary. Desktop: popup menu anchored 8px below the avatar, same actions, Remove after a hairline.
4. **Remove confirm** in the home-point remove style: trash in a danger-surface circle, "Remove profile photo?" / "Your initials will show instead.", Cancel + red Remove (only primary); sheet on mobile, 400px dialog on desktop; focus starts on Cancel.
5. **Uploading:** scrim + white spinner over the old face, `role=status` "Uploading photo…" under the avatar. **Only the avatar is disabled** — the rest of the profile page stays usable (Tigran; overrides the design's "page controls inert").
6. **Error:** inline panel under the avatar (error-surface, icon + words, `role=alert`), old face kept, the avatar stays enabled (using it again is the retry). Four messages (format + iPhone hint, too large, busy, generic) per the copy table; no sizes or codes.
7. **Header:** photo in the trigger (32px mobile in a 44px button, 36px desktop pill) and dropdown head (44px); initials fallback on null or `onerror`; the header never edits the photo.
8. **Initials** in `ui-color-primary-strong` on `ui-color-primary-wash`, bold, 38% of the circle.
9. **Copy** en/ru/hy exactly as `design/README.md`; the Armenian iPhone hint keeps the English settings path.

## Open / not accepted
- The design's "make the page's other controls inert while uploading" — not accepted (decision 5).
- Entry option 1 (badge on desktop) — not chosen.
- Not designed in stage 1: 768px tablet layout (use mobile rules below the desktop breakpoint), the other error variants as separate frames, rate-limit (429) copy (falls under the generic error).
