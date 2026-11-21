# PhotoMenu

The desktop popup menu anchored to the avatar, with the same actions as the mobile sheet.

- 8px below the avatar, left edges aligned; `ui-color-surface`, `ui-radius-md`, `ui-shadow-pop`, 1px `ui-color-border`. 232–320px wide.
- Heading “Profile photo” in `caption`. Items 44px tall: icon in `ui-color-primary-strong` + `body` label. “Remove photo” in `ui-color-danger`, after a hairline.
- Hover `ui-color-primary-wash`; keyboard focus adds the 2px inset ring. Focus starts on the first item; arrows move, Esc closes and returns focus.
- No photo: a single “Upload photo” item.
