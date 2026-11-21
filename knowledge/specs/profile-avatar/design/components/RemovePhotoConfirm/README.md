# RemovePhotoConfirm

Confirms removing the photo, styled like the home-point remove confirm: a sheet on mobile, a p-dialog on desktop.

- 56px `ui-color-danger-surface` circle with a trash icon in `ui-color-danger`; title “Remove profile photo?” (`title`); body “Your initials will show instead.” (`body`, `ui-color-text-secondary`).
- Buttons: Cancel (`btn-secondary`) + Remove (`btn-danger`, white on `ui-color-danger` 5.3:1), side by side and equal width. Red Remove is the only primary.
- `role="alertdialog"`; focus starts on Cancel. Desktop: 400px wide, `ui-radius-lg`, 24px padding, 44px close button.
- On Remove: close, show initials at once, and return focus to the avatar.
