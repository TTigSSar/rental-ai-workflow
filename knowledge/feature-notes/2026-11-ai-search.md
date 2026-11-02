# AI Search
Status: Completed | Decisions: ADR-054 (+ amendments 10-28 … 10-30), ADR-045, ADR-048 | Mistakes: M-076, M-077 | PR: rental-api #22, #23 · Rental-Ui #30, #31 · rental-app #29 | Spec: knowledge/specs/ai-search/

**Goal.** A signed-in user turns on the "AI" switch on `/listings`, describes the toy in hy/ru/en/translit and gets real Approved listings: the description is turned into the existing catalogue filters, then at most 10 candidates are re-ranked. When AI is off or fails, the ordinary catalogue still answers.

**Initial plan.** Claude behind the `IAiSearchModel` seam: Haiku 5.5 to parse, Sonnet 5.5 to rank, up to 20 candidates, $1/day global budget, 5/min per user (ADR-054, 2026-10-28). Design in three stages (design-notes), delivered on six Trello cards (1–3 build, 4 full verification, 5 deploy, 6 ru/hy copy).

**Alternatives considered.** Embeddings/vector store, letting the LLM pick listings without the catalogue query, a DB adjacency table for districts — all rejected in ADR-054. `tools/ai-search-eval` (40 queries × 9 models) replaced the Claude pair with **OpenAI GPT-6 Luna** for both steps (amendment 10-29; the reasons are in that amendment and `tools/ai-search-eval/results/report.md`).

**What went wrong.**
- Production logs showed ranking 20 candidates was slow; cut to 10 with short numeric ids (amendment 10-30).
- A fast-toggle fix filtered the whole filter stream and broke every mobile filter in AI mode; caught only by the reviewer (M-076).
- The pre-merge security review found three Majors: spend was not recorded for aborted/timed-out calls, billed failures were logged at $0, and blocked users were not refused. Fixed: every model call is logged with its cost (pessimistic estimate without usage), the 50/day cap counts paid calls, blocked users get 403 `auth.user_blocked`, `/ai-search/status` is cached 30 s (amendment 10-30).
- The intent line came back in mixed forms ("Ищет…"/"Ищу…", "Փնտրում է…"/fragments, random full stops); it is shown without a prefix, so it read inconsistently.

**Final solution.** `POST /api/listings/ai-search` (authenticated) + anonymous `GET /api/listings/ai-search/status`; GPT-6 Luna, structured outputs, reasoning effort low; parse → catalogue query → rank ≤ 10; fallback to the plain catalogue with `aiUnavailable`; $1/day global, 5/min and 50/day per user; descriptions kept 30 days, admin-only. The intent is a verbless noun phrase with no trailing punctuation (prompt + server trim). The ru/hy copy was reviewed by two independent native-language reviewer agents instead of a human native speaker (Tigran's call, card 6/6); the eval stayed 320/320 for gpt-6-luna. Deployed to dorent.am 2026-11-02 (rollback tag `pre-ai-copy-6of6`).

**Lessons.**
- Run the model eval before fixing the provider in the ADR; it overturned the first choice.
- Every billed external call must be recorded on every exit path (finally + `CancellationToken.None`), or the budget lies.
- A model-generated UI line needs an explicit form in the prompt (part of speech, person, punctuation) and an example per language; check it across languages in the eval output, not just one sample.
- Keep the status endpoint: it greys the switch before the user types, which a "fail on first search" approach cannot do (Tigran, 2026-10-31).
