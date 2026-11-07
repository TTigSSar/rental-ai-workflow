# Account deletion — design notes

Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `Delete Account Stage 1 v2.html` (+ `da2-app.jsx`, `da2-pages.jsx`, `da2-parts.jsx`, `ai-parts.jsx`). Spec: [spec.md](spec.md). ADR-056 (+ amendments 2026-11-04, 2026-11-06).

## Approved decisions

1. Stage 1 v2 approved (Tigran, 2026-11-06) with the corrections below; implemented without another design round.
2. Settings is a list of rows in the profile main area: Password (inactive "You sign in with Google" for Google-only), Language (current value, ellipsis), Notifications ("Coming soon" pill), then Delete account in its own card below a divider, danger text and red-tinted tile. No Verification ID row. Admins don't see Delete.
3. The mock's mobile profile menu is illustrative only: the real menu stays, with Security → Settings and Language moved into Settings. Log out keeps today's style and place.
4. Confirmation summary: option **B** (grouped "Erased" rows + collapsible "What stays"), one 560 px dialog on desktop, bottom sheet on mobile. The collapsed line states all three facts (stays/public reviews, toys archived, pending closed).
5. Google-only confirmation: type the email, **no hint** shown.
6. States: wrong value inline under the field; loading spinner "Deleting…" with Cancel/close/Escape disabled; any indefinite error → "Something went wrong. Please try again." at the top of the body.
7. Open-rentals state: rows with image, title, dates, role, link; copy "Finish these rentals or cancel those not yet handed over"; CTA to My rentals or Incoming requests by role.
8. After deletion: success toast (6a); the info toast (6b) only for the 401-after-dropped-connection case — never both.
9. Public page `/account-deletion` as drawn, with the corrected review wording; footer link "Delete account".
10. "Deleted user": muted circle avatar with a person glyph, secondary-colour text, never a link, on every surface that shows a person.

## Open / not accepted

- Option A summary (two stacked lists) — not drawn, not chosen.
- Verification ID row — removed by Tigran.
- Email hint for Google-only — rejected.
