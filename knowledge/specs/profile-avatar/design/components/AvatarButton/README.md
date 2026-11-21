# AvatarButton

The profile avatar as one button that opens the photo actions; the camera badge is only a visual cue.

**Consumer provides:** `photoUrl` (or null), `initials`, `size` (56 mobile card, 72 sidebar, 96 identity card), `state` (`idle` | `uploading`), `onOpen`.

- Render a real `<button type="button">` around the whole circle. Name: “Change profile photo” with a photo, “Add profile photo” without (ru “Изменить фото профиля”, hy “Փոխել պրոֆիլի նկարը”). `aria-haspopup="menu"` on desktop, `"dialog"` on mobile.
- Initials and the image are `aria-hidden`; the button name carries the meaning.
- Hit area: the circle plus 6px all round (`::after`), never below `target-min` (44px).
- Focus: 2px `ui-color-focus-ring`, 3px offset, on `:focus-visible`.
- Badge: `badge` size, `ui-color-surface` fill, `ui-color-border` outline, camera glyph in `ui-color-primary-strong` (5.0:1). 28px on the 96px avatar.
- Pressed: the face dims 6%, the badge turns `ui-color-primary-soft`.
- Uploading: `ui-color-scrim` + white spinner over the old face, badge 45%, `aria-disabled="true"`, `aria-busy="true"`, clicks ignored.
- **Option 2** (desktop only): no badge at rest; `ui-color-scrim` + 24px white camera on hover, focus-visible and press. Mobile keeps the badge.

Don’t: make only the badge clickable; add a second “Edit” link beside it; show a broken-image icon.
