# Design export — Message Notifications Stage 1

Exported 2026-11-07 from Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`.

- `styles.css` — the page `<style>` block of `Message Notifications Stage 1.html` (button, switch `.sw`, pill `.pill-ok`, quiet button `.btn-q`, link `.lnk`, row classes).
- `nt-parts.jsx` — Settings rows (Row A / Row B states), sheet/dialog, EN/RU copy (`NS`).
- `nt-pages.jsx` — chat thread + soft prompt (`NPrompt`), unsubscribe page states, email (EN/RU/HY copy in `EM`).
- `designer-notes.md` — the designer's **Notes** from `nt-app.jsx` (behaviour + contrast rules) and the list of board frames.

Not copied: `ai-parts.jsx`, `da2-parts.jsx`, `da2-pages.jsx` — shared mock primitives from earlier designs (phone/desktop frames, `Tile`, `Pi` icon, `Dlg`, `Keyboard`, base token object `DA`). In the app, use the existing components and `--ui-*` tokens instead. `Pi n="x"` = PrimeIcons `pi pi-x`; `Tile` = the existing settings icon tile.
