# Browse redesign — design notes

- **Card:** Trello #271.
- **Design:** Claude Design project `df24299b-1299-4804-8a0a-5484005594c3`, `Browse Redesign Stage 1.html` (`bw-app.jsx`, with `hm-parts.jsx`/`hm-data.jsx` shared with Home).
- **ADRs:** ADR-066, ADR-064 (amended).

## Approved decisions

1. Stage 1 is built as drawn on desktop (Tigran, 2026-11-16):
   - a 300 px filter sidebar beside a main column;
   - the search bar with the "Smart search" switch and a Search button;
   - the active-filter chips row;
   - List/Map on the left and Sort on the right (keeps ai-search note 16);
   - a 3-column card grid.
2. The sidebar has collapsible sections, each with a selection badge. Category, Child's age, Price per day and District start open; Condition starts collapsed. The header shows a total badge and "Clear all".
3. Full scope (ADR-066):
   - multi-select category with icons and counts, plus "Show all";
   - multi-select age chips, labelled in years;
   - a dual price slider with Min/Max boxes, bounded by the facets min/max;
   - districts with a search box, counts and "Show all";
   - condition chips.
4. Distance (radius from a home or a point) stays as an extra sidebar section, restyled to match; its behaviour is unchanged (Tigran, 2026-11-16).
5. With Smart search on and the query empty, a panel shows 2 example prompts with tags; clicking one fills the field. Once text is typed, a hint line replaces the panel.
6. One shared toy card on every page (ADR-064 amendment, Tigran 2026-11-17). Owner and booking-status badges sit in one pill over the photo, top-left; distance goes on the location line.
7. Condition values follow ADR-042 (New / Like new / Good / Fair). The design's "Excellent" is not used.

## Open / not accepted

- The mobile filter sheet has no design. It gets the same new controls in its current sheet style until a mobile stage is drawn.
- No result-count line (ai-search note 14 stands), though the design's toolbar leaves an empty slot for one.
