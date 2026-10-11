# Google sign-in v1 (2026-10-10 → 2026-10-11)

Decision: ADR-030 (with amendments), which amends ADR-028 §2. Mistakes: M-057, M-058, M-059, M-060. Deferred work is on Trello: "Social login: Facebook and Apple sign-in" (Medium) and "Password reset" (High).

## What shipped
- **Google is the only social sign-in.** Facebook and Apple are deferred; the Apple backend path stays hidden.
- **Nonce.**
  - `POST /api/auth/external/nonce` issues a 32-byte single-use nonce that lives 5 min.
  - The server keeps only its hash, in an in-memory store of at most 50 000 entries that never evicts.
  - The validator checks signature, `iss`, `aud` and `exp` first, then atomically consumes `payload.Nonce`. The request has no nonce field.
- **Rate limits:** `external-auth-nonce` 30/min per IP and `external-auth` 10/min per IP. IPv6 is keyed by /48.
- **Linking rules:** the 7-case table in the plan and ADR-030 §4.
  - "Authoritative" means `email_verified` AND (gmail/googlemail OR `hd` == the email's domain).
  - A pending registration is converted only for an authoritative email. Otherwise the answer is 409 `auth.external_pending_registration`.
  - Blocked is checked before any write.
  - A unique-index race answers 409, never 500.
- **Names:** `given_name` → `name` → "". The email local part is never used.
  - A mandatory "What should we call you?" step appears whenever `firstName` is empty. It has no logout link; that is an accepted risk.
  - `PUT /api/auth/me/name` takes an optional last name.
- **Phone:** `PUT /api/auth/me/phone`.
  - 409 `listing.phone_required` / `booking.phone_required` is returned before any write.
  - The UI asks for the phone before the first publish or booking and then sends the action exactly once. It resends only on that explicit 409.
- **UI:**
  - The Google block sits at the top of Sign in and of Register step 1 only.
  - Six inline messages in the design colours.
  - A "Personal info" card in the profile.
  - Neutral Security text.
  - en/ru/hy strings; the Armenian copy is still a draft.
- **Related fixes on the same branch:**
  - blocked users could submit reviews (`8aa5210`);
  - blocked users could update, archive, restore and resubmit listings and create chats (`675462e`, `efe199e`, plus a 27-case matrix test).
- `appsettings.json` no longer carries a placeholder client ID. The local compose passes the public client ID (`66765b3`).

## How it was built
- **Reviews.** Review of the architecture, then a ChatGPT cross-check, then a design review, then a plan validation (decisions F1–F3), then an implementation review and a security review.
- **Two real-GIS experiments** (Tigran clicked through):
  - `initialize` alone does NOT change an already-rendered button's nonce; initialize + emptying the container + render does.
  - Re-rendering while a popup is open does not break that popup.
  - These results shaped the no-timer nonce rule.
- **Live check found two things tests could not:**
  - The button label ignored `locale` until the script was loaded as `gsi/client?hl=<lang>` (`5f9a9f1`).
  - Google rejects `http://<LAN IP>:4200`.

## Operating it
- **Production release** (platform-engineer, after the merge):
  - add `ExternalAuth__Google__ValidAudiences__0=${GOOGLE_CLIENT_ID:-}` to `docker-compose.production.yml` and the value to the server `.env`;
  - make sure `https://dorent.am` is in Authorized JavaScript origins;
  - check that nginx is not reachable around the tunnel;
  - no migration; smoke check `POST /api/auth/external/nonce` → 200.
- **If the client ID is missing in Production:** a Critical log `ExternalAuthConfigurationStartupCheck` appears, nonce and external answer 503, and the button is hidden.
- **Google sign-in on a phone works only over https** (dorent.am or an https tunnel), never over a LAN IP.

## Open follow-ups
- Native-speaker review of the Armenian strings. Add them to the existing native-review card.
- Apple has no nonce. This must be added before Apple is enabled; noted on the Facebook/Apple card.
- Pre-existing accessibility and copy issues the verifier found outside this diff:
  - the auth dialog has no accessible name, and the X button has no label;
  - `<html lang>` never changes;
  - the header "Log in" is untranslated;
  - white on #ff6008 has a contrast ratio of 3.03;
  - `/profile` has no `h1`.
