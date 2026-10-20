# Rental in chat — design notes

Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `Rental Chat Stage 1.html` (+ `rc-parts.jsx`, `rc-app.jsx`). Spec: [rental-spec-v1.1.md](rental-spec-v1.1.md) §3, §14.

## Approved decisions

1. Stage 1 direction approved (Tigran, 2026-10-19): Rental card pinned at the top of the chat replaces the status pill and the "View booking" link; turn badge → one sentence → one primary button.
2. "Your turn" emphasis: option **A** — 5 px brand-orange (`#FF6008`) bar on top of a white card, only when it is the viewer's turn (not the orange wash).
3. Primary button in the card: `primary-strong` `#C24600`, same as every primary button in the app (ADR-031).
4. Stage 1 is implemented on the current backend first; the new handover/return/closing steps follow when ADR-046 is implemented, and the same card picks them up.

## Open / not accepted

- Wording of the period hint in spec §11.3 ("a full week is paid") — to confirm when that stage is designed.
