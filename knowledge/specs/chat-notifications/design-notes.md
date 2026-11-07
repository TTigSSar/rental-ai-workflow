# Chat notifications — design notes

Feature: Trello #17 (split into 17a backend, 17b settings + unsubscribe UI, 17c browser notifications + chat prompt). ADR-059.
Prompt: [design-prompt-stage1.md](design-prompt-stage1.md) · Export: [design/](design/) (Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, file `Message Notifications Stage 1.html`).

## Approved decisions (Tigran, 2026-11-07)
1. **Settings entry.** "Notifications" is a row in the Settings card (replaces "Coming soon"), opened like Language: bottom sheet on mobile, 560 px dialog on desktop, one card with Row A and Row B. No Save button.
2. **Row A** "Email about new messages": `role="switch"`, saves on change; "Saved" / "Couldn't save. Please try again." line under the hint; on failure the switch goes back.
3. **Row B** "Browser notifications" has four states: not asked (secondary "Enable" button), on (green "On" pill + "Turn off in browser settings"), blocked (warning note how to re-enable, no button), unsupported (muted row). No off switch.
4. **Chat soft prompt — Option B.** After the first sent message, a one-time card is the last item in the thread (scrolls with messages, never overlaps the composer/keyboard): "Want to know when they reply? Turn on notifications for this device." [Turn on] [Not now]. Both remove it for good (per device). Native dialog only after "Turn on". ADR-059 amendment.
5. **Unsubscribe page.** Public, works signed out; opening the link changes nothing, the "Unsubscribe" button POSTs. States: confirm, loading, failed (error line above the button, button stays enabled), done, invalid/expired, already off — each result is a tinted icon + one-line heading (`role="status"`) + one link to Settings.
6. **Email.** 600 px single column, no message text; heading "<First name> wrote to you about <Toy>", toy row with 64 px thumbnail, "Open chat" button #C24600 48 px (full width under 600 px), footer with why-you-got-this line, "Unsubscribe from message emails" and "Manage in Settings" links. RU/HY copy proposals in `design/nt-pages.jsx` (`EM`).
7. **Copy.** EN/RU strings for Settings are in `design/nt-parts.jsx` (`NS`); the hint states 15 minutes and quiet hours 22:00–09:00 Yerevan.

## Open / not accepted
- Browser notification mock (not designed — the OS draws it).
- Deferred edge states: dark email clients, Google-only/blocked users, per-language email polish.
