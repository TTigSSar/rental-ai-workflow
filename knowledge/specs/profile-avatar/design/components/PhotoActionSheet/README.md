# PhotoActionSheet

The mobile bottom sheet the avatar opens: a small title, then the photo actions, Cancel last.

**Consumer provides:** `hasPhoto`, `onUpload`/`onChange` (opens the file picker), `onRemove` (opens RemovePhotoConfirm), `onClose`.

- Reuse the settings-sheet shell: `ui-color-surface`, `ui-radius-lg` top corners, grab handle, swipe down / backdrop tap to close (ADR-061), 16px side gutter (ADR-063).
- Title “Profile photo” in `caption`, `ui-color-text-secondary`, centred.
- No photo: one primary row, “Upload photo” (`btn-primary`: `ui-color-primary-strong`, white text). With a photo: “Change photo” (primary) then “Remove photo”: a quiet text row in `ui-color-danger` with a trash icon, transparent fill.
- Cancel: `btn-secondary` (`ui-color-surface-muted`), 8px clear of the actions.
- Every row is 48px tall and full width, so hy/ru labels (+40%) fit on one line.
- Focus moves into the sheet on open and returns to the avatar on close.
