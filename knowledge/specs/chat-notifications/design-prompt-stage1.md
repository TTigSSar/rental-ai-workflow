# Chat notifications — Claude Design prompt, stage 1

Feature: Trello #17, ADR-059. Written by `ux-designer`, 2026-11-07. Not yet run in Claude Design.

```
Extend the existing DoRent settings screen and design 3 new small surfaces for chat message notifications. Stage 1: set the visual direction with 6 frames (below). Keep it calm and utilitarian; this is settings UI, not marketing.

PRODUCT CONTEXT
DoRent is a child-toys rental marketplace in Yerevan; owners and renters chat per rental. If a chat message stays unread, the recipient gets an email; while a DoRent tab is open in the background they can also get a browser (OS) notification. Most users are on phones (390 px first, then 1280 px desktop). Languages: Armenian, Russian, English; leave ~40% extra room for hy/ru strings.

KEEP THE EXISTING LOOK (do not invent new tokens)
- Colours: primary #ff6008 (never white small text on it; use --ui-color-primary-strong #c24600 for text/filled buttons with white), background #faf8f4, surface #ffffff, text #1a1b26 / secondary #6b6a75 / hint #6f6e7d, border #e8e5de, success #0d7d56 on #edf9f1, warning #8a5c00 on #fff4d6, info #3d52cc on #eaedff, error #d43f5e on #fff1f3.
- Radius 14/16 px for cards and inputs, pill 999 px; spacing scale 4-64; card shadow --ui-shadow-card.
- Settings is ONE white card of rows (icon tile 16 px glyph, label, optional hint line under it, value or control on the right, chevron for links; inactive rows are muted) with a page title above. Notifications replaces the current muted "Notifications - Coming soon" row. A danger-styled "Delete account" card sits below a divider and stays untouched.
- Switch: follow the existing role="switch" pill track + knob pattern (the AI switch on listings), 44 px touch target, visible focus.
- Info/warning notes: soft tinted surface with icon, as in the existing status banners; no new component style.

FRAMES TO DESIGN
1. Settings (mobile 390 + desktop 1280): the Notifications section as a heading + 2 rows inside the existing card style.
   Row A "Email about new messages" - hint "We email you when a message stays unread for 15 minutes. No emails between 22:00 and 09:00 (Yerevan time)." - switch, default ON.
   Row B "Browser notifications" - hint "Get a notification on this device while DoRent is open in another tab." - control depends on state (frame 2).
2. Row B states, shown as a stacked strip (mobile): (a) not asked: pill button "Enable" (secondary style, not primary); (b) on: success-toned "On" with a switch or a quiet "Turn off in browser settings" text (your call - the page cannot revoke permission, so do not draw a working off switch); (c) blocked by browser: warning-toned note "Notifications are blocked in your browser. To turn them on, open the site settings (the lock icon next to the address) and allow notifications." no button; (d) not supported: muted row "This browser does not support notifications." Row A must look complete and independent in all four.
3. Chat thread, right after the user's first sent message: the automatic browser-permission request. OPEN DIRECTION, give 2 options, both mobile-first:
   Option A - no in-app prompt: the thread looks normal; show only a note frame describing that the native browser dialog appears.
   Option B - a small dismissible soft prompt card under the sent message / above the composer: "Want to know when they reply? Turn on notifications for this device." with one primary "Turn on" and a quiet text "Not now". Must not cover the composer or push the keyboard area; it appears once and never nags. Add one frame for what the thread looks like after "Turn on" (prompt gone, nothing else changes).
4. Unsubscribe landing page (public, works logged out, uses the standard public page layout like the account-deletion page: centred card on #faf8f4, DoRent header). Frames: (a) confirm: title "Stop emails about new messages?", text "You will no longer get emails when someone writes to you in a chat. You can turn them back on any time in Settings.", ONE primary button "Unsubscribe" (nothing happens on page open; the button performs the action); (b) done: success tone "You are unsubscribed from message emails." + secondary link "Turn emails back on in Settings" (goes to login if logged out - do not mention that); (c) link invalid or expired: neutral/error note "This link no longer works." + link "Go to Settings"; (d) already unsubscribed: info tone "Message emails are already off." + same link. Include a loading state on the button and a generic failure line "Something went wrong. Please try again." above the button.
5. The email (600 px wide, light, inline-style friendly, English; also show that hy/ru titles wrap): header with DoRent wordmark; heading "Anna wrote to you about Baby stroller" (sender first name, toy title); small toy thumbnail (64 px, radius 12) beside the toy title; NO message text anywhere; one primary button "Open chat" (#c24600 with white text, min 44 px high, full width on mobile); footer in small muted text: "You are getting this because you have a conversation on DoRent and the message has been unread for a while." + "Unsubscribe from message emails" link + "Manage in Settings" link. Show a 2-line toy title and a long Russian heading variant.
6. A native-looking browser notification mock is NOT needed; skip it.

STATES THIS STAGE: frames 1-5 above only. Deferred: remaining edge cases (loading/error of the switch save, Google-only/blocked users, dark email clients, per-language email copy), polish after direction approval.

HARD RULES
- One primary action per state. Nothing implies payment through DoRent. No technical state names (no "token", "opt-out", "permission denied").
- Do not state anything the product does not promise: no "instant", no "we never email you", no counts or response rates; the only facts allowed are the ones written above (15 minutes, quiet hours 22:00-09:00 Yerevan, no message text in emails).
- WCAG AA contrast, 44 px touch targets, mobile 390 first. Currency not used here.
- Switch changes save immediately (no Save button); just draw a small inline saved/failed hint slot (your call on style).

DELIVERABLES
Frames 1-5 on mobile 390; frame 1 and frame 4(a) also on desktop 1280; frame 3 as Options A/B; the email at 600 px. Briefly label which option you recommend for frame 3.
```
