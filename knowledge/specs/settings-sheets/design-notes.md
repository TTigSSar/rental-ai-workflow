# Settings sheets (Password, Language) — design notes

ADR-021 amendment 2026-11-08. Builds on `../chat-notifications/design-notes.md` (Notifications sheet).
Export: [design/](design/) (Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `Password Language Stage 2.html`).

## Approved decisions (Tigran, 2026-11-08)
1. **Container.** Password and Language open the Notifications container unchanged: bottom sheet under 961 px, 560 px dialog from 961 px. One shell component, scoped to Settings.
2. **Password sheet.** Current, New, Confirm; footer pinned under scrolling fields with Cancel (secondary) + Save (single filled primary); desktop right-aligned, mobile side by side, wrap with Save on top.
3. **Errors.** Field errors under fields; server errors keep typed values; form-level banner above the first field.
4. **Submitting.** Fields read-only, Cancel disabled, Save keeps its width with a centred spinner.
5. **Success.** Sheet closes, focus back on the Password row, global toast "Password updated". No success screen; `/profile/settings/password` redirects to `/profile/settings`.
6. **Language sheet.** Three native-name options, check on current; tap applies and closes; no footer, no toast. Row shows the current language name as its value.
7. **Google-managed.** Password row inactive with the existing hint, never opens a sheet.

## Open / not accepted
- Rate-limit timing and network-failure copy are not designed (use existing banner and generic error mapping).
- Swipe-down to close the mobile sheet: not required in this slice.
