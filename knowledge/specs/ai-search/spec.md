# AI search ("describe the toy") — product spec v0.1

Status: product flow agreed by Tigran (with ChatGPT and Claude), 2026-10-26. No ADR yet. See *Open before ADR*. Design: [design-notes.md](design-notes.md).

## Goal
A signed-in user describes the toy in their own words in the catalogue search field. DoRent then shows real catalogue listings, with the most relevant first.

## Flow
1. The user turns on the **AI toggle** inside the existing catalogue search field and types a description. The search runs at once, with no clarifying questions.
2. An LLM parses the description and **fills the catalogue's existing filters**: child age, category, max price per day, districts.
3. The catalogue query returns real Approved listings. Up to **20 candidates** go to an LLM for **ranking**. The API validates the answer: unknown ids are dropped, missing ids are appended in fallback order.
4. Page 1 shows the 20 ranked listings. Page 2 onward shows the remaining matches in normal catalogue order, after a divider, with no repeats. Pagination and page size are the catalogue's.
5. A one-line explanation above the results states the intent only (e.g. "Picked for outdoor play: balance bikes first"). It never repeats filter values.
6. To refine, the user edits the same description and searches again. When the user changes a filter, the results are **re-ranked** with the same description: one LLM call, no re-parse.
7. Choosing a sort other than "Most relevant first" drops the AI order, the explanation and the divider. List/Map stays available.
8. Turning the toggle off restores the catalogue as it was before (text query, filters, sort, view, page). The description is kept separately and is never used as a text query.

9. **Guest:** a guest can turn the switch on and type. Submitting opens the existing sign-in dialog. The description is kept on the device only, nothing is sent before sign-in, and the search runs automatically after sign-in (agreed in the round-2 discussion; recorded 2026-10-27).

## Constraints
- **Always enforced by the system:** Approved listings only, non-blocked owners only.
- **Hard (never relaxed automatically):** child age, an explicit budget ("up to 3000"), and anything the user marks as "only / strictly / must".
- **Soft:** purpose ("educational", "outdoor"), district, "affordable", and a **named item type**. A named item type is expressed by its category plus ranking priority, because the catalogue has no item-type filter.
- **Auto-widening:** at most 2 visible steps, district → purpose. Each added neighbouring district shows as its own chip and is checked in the district filter.
- **No results:** "Widen the area" drops the district filter (all of Yerevan) as an explicit user action. "Notify me" (subscribe to the current filters) is a separate feature, Trello #220, built after AI search.
- Removing a filter chip is an explicit user change. Automatic widening never removes hard constraints.

## Catalogue change
Add a **"Child's age" filter** to the normal catalogue (sidebar and mobile sheet). The API already supports `AgeFromMonths` / `AgeToMonths`.

## Out of MVP
Rental-date availability. Browser geolocation. Here "near me" means the saved home point, possibly via the existing distance filter (to confirm in design stage 3). Per-card "why it fits" text. A chat UI.

## Failure behaviour (agreed direction)
- **AI unavailable** (provider down, missing credentials, parse failure, timeout): run a plain text search and show a notice. The AI switch turns off automatically and stays re-enableable. Each search with the switch on checks AI again.
- **Ranking fails:** use the fallback order.
- **Daily budget exhausted:** AI is off until Yerevan midnight and the normal search runs. The switch is shown disabled, with the reason, so the client needs the budget state before searching.
- **"Near me":** with a home point, use the existing distance filter from home at 1 km. Without one, show a "Location isn't considered" note.
- **Per-user rate limit hit:** "try again in a minute".
- Raw provider errors are never shown.

## Privacy (agreed direction)
- **Sent to the provider:** the description, the category and district lists, and public candidate fields only. Descriptions are trimmed and marked as data. No user identity and no exact coordinates.
- **Shown to the user:** a privacy note under the field while typing: "Your description is processed by an AI service."
- **Retention:** raw query text for 30 days, admin-only, then deleted.

## Open before ADR (Rule 0)
- Provider and model. Run a comparative test on about 40 queries (hy/ru/en/translit) with Claude Haiku 5.5, Claude Sonnet 5.5 and an OpenAI mini-class model.
- Data boundary, provider retention mode, and logging retention.
- Daily budget ($), per-user rate limit, exhaustion behaviour.
- API contract: endpoint(s), auth, error codes.
- District adjacency table (new data).
