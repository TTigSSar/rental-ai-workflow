# AI search — design notes

Design: Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, files `AI Search Stage 1 v2.html` (+ `ai-parts.jsx`, `ai2-parts.jsx`, `ai2-app.jsx`) and `AI Search Stage 2.html` (+ `ai3-app.jsx`). Spec: [spec.md](spec.md). Stage 1 rev 1 (`AI Search Stage 1.html`, a separate AI mode with its own chips) is superseded.

## Approved decisions

1. Stage 1 rev 2 direction approved (Tigran, 2026-10-26). AI search is an **"AI" switch inside the existing catalogue search field**. There is no separate page, bar or mode screen.
2. The AI writes into the **existing filters and chips**. There are no separate AI chips. The real catalogue components (category selector, mobile sheet "Cancel / Apply") are kept, not the mock's versions.
3. Refinement means editing the same description. On mobile the field grows while typing and collapses to one line after a search.
4. The explanation line states the intent only and never shows filter values.
5. The sort "Most relevant first" is the default in AI mode. Page 1 holds the 20 ranked cards, and page 2 onward opens with the divider "More listings matching your criteria".
6. A widened district adds **one chip per district** (Kentron, Arabkir, Avan, …), each with its own ×, and those districts are checked in the district filter. This supersedes the one grouped chip (Tigran, 2026-10-27).
7. A new "Child's age" filter appears in the normal catalogue sidebar and sheet, as drawn in v2.
8. The privacy note shows only while the user is typing, not on the results.
9. AI-set controls get the same `#C24600` border that a user-set filter gets. On mobile, the filter button shows the count badge.
10. Stage 2 approved (Tigran, 2026-10-27):
    - **Loading:** previous cards stay in place, dimmed and inert, under one status line with a thin indeterminate bar. A first search shows the existing skeleton.
    - **Re-rank:** "Updating the order" replaces the count line.
    - **Purpose widening:** one quiet note, with no undo.
    - **No results:** option **A**, stacked full-width buttons. The primary is "Widen the area", which drops the district filter and searches all of Yerevan, or "Edit description" when no district is set. Secondary actions: "Increase the budget" (focuses the price "To" field, no suggested amount), category pills, and the bell. There is no "Clear filters".
11. The privacy note is shortened to "Your description is processed by an AI service." (Tigran's decision).
12. **Bell** in the no-results state: a round button beside the search circle, with a hint under the title that repeats the bell icon inline. Once subscribed, the bell turns into ✓ with the subscribed text, and tapping ✓ unsubscribes. An existing subscription opens directly in that state. It ships with the subscriptions feature (Trello #220, after AI search) and is hidden until then.

## Open / not accepted

- Stage 3 (guest, AI unavailable, budget exhausted, rate limit, dates and location not considered) is not designed yet.
- "Near me" through the existing distance filter is to be confirmed in stage 3.
