# AvatarStates

The four photo states the profile card always shows: none, present, uploading and failed.

- **A No photo:** initials in `ui-color-primary-strong` on `ui-color-primary-wash` (4.6:1), bold, 38% of the circle.
- **B With photo:** the square photo fills the circle (`object-fit: cover`); the server already centre-crops it.
- **D Uploading:** see AvatarButton. Add a `role="status"` caption “Uploading photo…” (`body-sm`, `ui-color-text-secondary`) under the avatar, and make the page’s other controls inert until it ends.
- **E Failed:** keep the old face. Put the PhotoError panel under the avatar row. The avatar stays enabled; using it again is the retry. Clear the panel when a new upload starts.
