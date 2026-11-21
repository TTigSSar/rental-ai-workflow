DoRent is a child-toys rental marketplace in Yerevan. This system covers one Stage 1 feature, the **profile photo control**, and reuses the app’s existing Rental-Ui tokens exactly as they are. Build the control from these rules; don’t restyle the app around it.

## The control in one line

The whole avatar is one button. Tap or click it to open the photo actions (a bottom sheet on mobile, a popup menu on desktop), and the avatar always shows the photo’s state: **none, present, uploading, failed**.

## Content fundamentals

- Plain, warm, short. Sentence case. Second person (“your photo”), verbs first on actions: “Upload photo”, “Change photo”, “Remove photo”.
- Never technical: no status codes, error keys (`avatar_busy`), MIME types or pixel sizes.
- Make no claims about file-size limits, quality, privacy or permanence. Say “too large”, not “over 5 MB”.
- Leave about 40% extra room in every label for Armenian and Russian. Rows are full width and the menu grows to 320px.

| key | en | ru | hy |
|---|---|---|---|
| sheet title | Profile photo | Фото профиля | Պրոֆիլի նկար |
| upload | Upload photo | Загрузить фото | Վերբեռնել նկար |
| change | Change photo | Изменить фото | Փոխել նկարը |
| remove | Remove photo | Удалить фото | Հեռացնել նկարը |
| cancel | Cancel | Отмена | Չեղարկել |
| button name (photo) | Change profile photo | Изменить фото профиля | Փոխել պրոֆիլի նկարը |
| button name (none) | Add profile photo | Добавить фото профиля | Ավելացնել պրոֆիլի նկար |
| status | Uploading photo… | Загружаем фото… | Նկարը վերբեռնվում է… |
| confirm title | Remove profile photo? | Удалить фото профиля? | Հեռացնե՞լ պրոֆիլի նկարը |
| confirm body | Your initials will show instead. | Вместо него будут видны ваши инициалы. | Դրա փոխարեն կերևան ձեր սկզբնատառերը։ |
| confirm button | Remove | Удалить | Հեռացնել |
| error: format | This photo format isn’t supported. Choose another photo. On iPhone, set Camera → Formats → Most Compatible. | Этот формат фото не поддерживается. Выберите другое фото. На iPhone: Настройки → Камера → Форматы → Наиболее совместимый. | Նկարի այս ձևաչափը չի աջակցվում։ Ընտրեք այլ նկար։ iPhone-ում՝ Settings → Camera → Formats → Most Compatible։ |
| error: too large | This photo is too large. Choose another one. | Фото слишком большое. Выберите другое. | Նկարը չափազանց մեծ է։ Ընտրեք այլ նկար։ |
| error: busy | We’re busy right now. Try again shortly. | Сервис сейчас занят. Попробуйте чуть позже. | Ծառայությունը հիմա զբաղված է։ Փորձեք մի փոքր ուշ։ |
| error: generic | Couldn’t update your photo. Try again. | Не удалось обновить фото. Попробуйте ещё раз. | Չհաջողվեց թարմացնել նկարը։ Փորձեք կրկին։ |

The Armenian iPhone hint keeps the English menu path: iOS has no Armenian interface, so people see English or Russian settings.

## Visual foundations

**Color.** `ui-color-primary` (#FF6008) is for fills and decoration only. Any text, and any button with white text, uses `ui-color-primary-strong` (#C24600, 5.0:1), because white on #FF6008 is 3.0:1. Pages sit on `ui-color-background`, and cards, sheets, menus and dialogs on `ui-color-surface`. Body text is `ui-color-text-primary` and captions are `ui-color-text-secondary`. Destructive actions use `ui-color-danger`, either as text on surface (the quiet Remove row) or as a fill behind white text (the Remove confirm button). Errors sit in an `ui-color-error-surface` panel edged in `ui-color-error-border`, always with an icon and words.

**Initials.** Set them in `ui-color-primary-strong` on `ui-color-primary-wash` (4.6:1), bold, at 38% of the circle. `ui-color-primary-soft` behind that text would be 4.4:1, which misses AA at small sizes, so the soft tint is used only for pressed states.

**Type.** Use the app’s font. The stack here is a stand-in. Styles: `title-lg`, `title`, `label` (buttons and rows), `body`, `body-sm` (status and hints), `caption` (sheet and menu headings), `initials`.

**Spacing and radii.** Use the 4/8/12/16/20/24/32 scale (`ui-space-1`…`ui-space-8`) and a 16px page gutter on 390 (ADR-063). Corners: `ui-radius-pill` for avatars, the badge and icon circles; `ui-radius-md` for buttons, rows, the menu and the error panel; `ui-radius-card` for cards; `ui-radius-lg` for sheet tops and the dialog.

**Elevation.** `ui-shadow-card` goes on cards and the badge. `ui-shadow-pop` goes on the popup menu, header dropdown and dialog. `ui-color-backdrop` dims the page behind sheets and the dialog.

**Focus.** Every control gets a 2px solid `ui-color-focus-ring` on `:focus-visible`: 3px outside the avatar circle, 2px outside buttons, and inset on menu items. It is at least 4.7:1 on every ground used.

**Targets.** Nothing is smaller than `target-min` (44px). Avatar hit areas extend 6px past the circle, the header avatar sits in a 44px button, and sheet rows are 48px.

**Motion.** Sheets slide up at 200ms. The spinner turns at 0.8s and slows to 2.4s under `prefers-reduced-motion`. When the upload finishes, the new photo simply replaces the old one, with no preview or crop step.

## States

| state | avatar | below the avatar | controls |
|---|---|---|---|
| A no photo | initials + badge | none | avatar opens sheet/menu with Upload |
| B photo | photo + badge | none | avatar opens Change / Remove |
| C open | as A/B | sheet (mobile) / menu (desktop) | focus inside, Esc / swipe closes |
| D uploading | old face + scrim + spinner | `role=status` “Uploading photo…” | avatar and page controls disabled |
| E failed | old face kept | PhotoError panel (`role=alert`) | avatar enabled: using it again is the retry |
| F confirm | as B | remove confirm sheet / dialog | red Remove is the only primary |
| G header | photo, else initials | none | header button opens the account menu |

Each state has exactly one primary action.

## Entry point: two options

1. **Camera badge** at the bottom-right of the circle, on every size (recommended: it is the same cue on every device and needs no hover).
2. **Scrim on desktop:** no badge at rest; hover, focus and press show `ui-color-scrim` with a white camera icon over the whole circle. Mobile keeps the badge.

## Iconography

The app uses primeicons and `app-icon`. Map them as follows: camera → `pi-camera`, upload → `pi-upload`, trash → `pi-trash`, error → `pi-exclamation-circle`, close → `pi-times`, chevron → `pi-chevron-down`. The previews draw line-icon stand-ins because primeicons isn’t loaded here; in code, use the real primeicons. Icons are 20px in rows, 12px in the 22px badge and 24px on the scrim. They are always `aria-hidden` next to a text label.

## Out of scope (Stage 1)

Chat, listing, review and admin avatars; admin removal; any crop UI.
