# trello-sync

Pushes the project's deferred backlog into a Trello list. Zero dependencies (Node 18+), same
spirit as `tools/agent-monitor`.

The backlog itself lives in [`backlog.json`](backlog.json) — it is the source, Trello is the
mirror. Idempotent: a card is created only if the list has no card with that exact name, so
re-running never duplicates. Edit `backlog.json` and re-run to add new items.

## Setup (once)

1. Open <https://trello.com/power-ups/admin>, create a Power-Up (any name), copy the **API key**.
2. On the same page click the **Token** link, approve, copy the token.
3. `cp .env.example .env` and fill in `TRELLO_KEY` / `TRELLO_TOKEN`.
4. `node sync.js --boards` — prints your boards and their list ids.
5. Put the id of the target list into `TRELLO_LIST_ID` in `.env`.

`.env` is gitignored — the key and token never leave the machine.

## Use

```bash
node sync.js --dry-run   # show what would be created, touch nothing
node sync.js             # create the missing cards
```

Labels named in `backlog.json` (`chat`, `backend`, `frontend`, `infra`, `docs`, …) are resolved
against the board and created if missing. Every card this tool writes additionally gets the black
**`AI`** label, so AI-authored cards stay distinguishable from hand-written ones. Labels are
reconciled on every run, not only at creation — adding a label to `backlog.json` reaches cards
that already exist.

## Item shape

```jsonc
{
  "name": "Short card title",           // required — also the idempotency key
  "priority": "Medium",                 // required — Blocker | Highest | High | Medium | Low | Lowest
  "labels": ["chat", "backend"],        // optional — "AI" is added automatically
  "desc": "Context + where it came from (file:line, or M-XXX in knowledge/mistakes.md)",
  "prompt": "Agent-ready spec…"         // optional but expected for deferred work
}
```

`prompt` is appended to the card body under a **Ready-to-run prompt** heading. Anything we
deliberately defer should carry one: the card exists so the task can be picked up later without
re-deriving the spec from scratch.

## Priority is mandatory

Every card on the board carries exactly one priority label from the scale in
[`priority.js`](priority.js): **Blocker / Highest / High / Medium / Low / Lowest**. It goes in the
item's `priority` field, never in `labels`. `sync.js` validates the whole backlog before any
Trello call and refuses to run if one item is missing it. On existing cards the board wins: sync
adds the backlog's priority only to a card that has none, so a priority changed by hand on the
board is never reverted.

[`priority-guard.js`](priority-guard.js) is the matching Claude Code hook (registered in
`.claude/settings.json`). It validates `backlog.json` on every Edit/Write, denies raw
`POST /1/cards` shell calls, and after a Trello-MCP `create` (which can't set labels) tells the agent
to attach a priority label right away.

## Keeping it honest

`backlog.json` is written from `knowledge/mistakes.md` (items still marked OPEN), the
`knowledge/feature-notes/*` "Deferred" sections, and `TODO`/`deferred` markers in the source.
When you close an item, delete it from `backlog.json` and archive the card — don't let the two
drift.
