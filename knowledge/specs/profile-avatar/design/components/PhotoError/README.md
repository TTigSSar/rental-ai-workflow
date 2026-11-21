# PhotoError

The inline error under the avatar: an icon and plain words, the old avatar kept, the control still usable.

- Panel: `ui-color-error-surface`, 1px `ui-color-error-border`, `ui-radius-md`, 12px padding; alert icon in `ui-color-danger`; text `ui-color-text-primary` 14/20. `role="alert"`.
- Messages (en): unsupported format, “This photo format isn’t supported. Choose another photo. On iPhone, set Camera → Formats → Most Compatible.” · too large, “This photo is too large. Choose another one.” · server busy, “We’re busy right now. Try again shortly.” · anything else, “Couldn’t update your photo. Try again.”
- Never show codes, sizes, formats lists or server words. Armenian keeps the iPhone path in English or Russian, because iOS has no Armenian interface.
