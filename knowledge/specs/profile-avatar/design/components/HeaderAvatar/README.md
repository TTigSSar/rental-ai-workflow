# HeaderAvatar

The header account trigger and dropdown head, showing the photo with an initials fallback.

- Mobile: 32px avatar inside a 44px round button, top-right. Desktop: 36px avatar + chevron in a pill trigger (44px tall).
- Dropdown head: 44px avatar, name (`label`), phone (`ui-color-text-secondary`).
- If the image is missing or fails to load (`onerror`), render the initials avatar instead. Never a broken-image icon or an empty circle.
- The header avatar is not a photo editor: it only opens the account menu.
