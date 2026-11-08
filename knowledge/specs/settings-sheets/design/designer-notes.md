# Designer notes — Password & Language Stage 2

Copied verbatim from the `PNotes` block of `pl-app.jsx` (Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `Password Language Stage 2.html`).

- **Container.** Password and Language open the Notifications container unchanged: bottom sheet under 961 px, 560 px dialog from 961 px, same header, close and backdrop. Password adds a footer pinned under the scrolling fields: 1 px #E8E5DE divider, 12 px above the buttons, 12 px gap between them, 34 px safe area below on mobile (12 px with the keyboard open). On desktop the buttons sit right-aligned, 140 px minimum.
- **Footer wrap rule.** Cancel and Save are 48 px pills, each 1 1 140 px. When both labels fit on one line they sit side by side (EN, RU and HY all fit at 390 px). If they don't fit, they wrap with Save on top and both go full width. Only Save is filled (#C24600, white text 5.0:1).
- **Dialog semantics.** role="dialog", aria-modal="true", aria-labelledby the title. On open, focus goes to Current password (Password) or to the current language (Language). Focus is trapped inside and returns to the row that opened it on close.
- **Language.** A listbox of three options in their own language (lang attribute on each). The current one has a #C24600 check and aria-selected="true". Tapping an option applies it and closes the sheet. The page re-renders in the chosen language and the row value shows the new name.
- **Field errors.** Every field error is an icon plus a sentence in #CC2D25 (5.3:1 on white) under the input. The input border turns #D43F5E. Inputs carry aria-invalid and aria-describedby pointing to their error line. After Save, all client errors show at once and focus moves to the first invalid field. An error clears when its field is edited.
- **Server errors.** "Current password is incorrect." sits under Current, "must be different" under New. Typed values are kept so the person can fix one field and save again.
- **Banner.** The existing soft error message sits above the first field, role="alert". Values are kept, and Save stays available.
- **Submitting.** Fields switch to the read-only look and Cancel is disabled. Save keeps its width: the label stays in the layout but is hidden, and a spinner is centred on top (aria-busy, accessible name "Saving"). Nothing moves.
- **Success.** The sheet closes, focus returns to the Password row, and the existing top-centre toast "Password updated" is announced as a polite live region. There is no success screen.
- **Google-managed account.** The Password row is inactive (aria-disabled, hint-colour label, no chevron), with the existing hint. It never opens a sheet.
- **Not shown in the static frames.** Rate-limit timing: how long the banner stays and when Save works again. Request failure: what appears when the save can't reach the server. Keyboard behaviour: Enter moves to the next field and submits from Confirm, Esc closes, swipe down closes the mobile sheet, and the sheet rides on top of the on-screen keyboard. Focus order: Close, Current, Show, New, Show, Confirm, Show, Cancel, Save (focus starts on Current).

## Board frames
A Settings rows (390, Google-managed 390, 1280) · B Language (390, 1280) · C Password empty (390, 1280) · D Field errors (390, 1280, New too long 390, HY 390, stacked footer fallback) · E Server errors (Current incorrect 390/1280, New same 390) · F Submitting (390, 1280) · G Too many attempts banner (390, 1280) · H Success toast (390, 1280) · I Keyboard open (390).

## Styles used (from the page `<style>` block)
- `.btn-p` filled primary: min-height 48, padding 12/24, radius 999, bg #C24600 (hover #A83C00), white 16/600.
- `.btn-c` secondary: flex 1 1 140px, min-height 48, padding 12/20, 1.5px border #6B6A75, radius 999, white bg (hover #F4F4F8), 16/600; disabled: text #6F6E7D, border #DDD9D0.
- `.inp` input: min-height 52, 1px #DDD9D0, radius 14; focus border+outline #C24600; error border #D43F5E; read-only bg #F4F4F8.
- `.pmsg` banner: 1px #F6CCD3, bg #FFF1F3, radius 14, padding 12/14, 14/20.
- `.lopt` language option: min-height 48, padding 12/16, 16/24, dividers #E8E5DE, hover #FAF8F4; current one 600 weight + check #C24600.
- `.srow .val` row value: 14/20 #6B6A75, ellipsis, max 50%.
