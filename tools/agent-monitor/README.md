# Agent Monitor — live view of a Claude Code multi-agent run

A zero-dependency local dashboard. Claude Code **hooks** POST each event (tool calls,
sub-agent lifecycle) to a tiny Node server; the browser streams them live over SSE.

```
tools/agent-monitor/
├── server.js   # the server + the dashboard (pure Node built-ins, no npm install)
├── runs.js     # folds hook payloads into one record per subagent run, keyed by agent_id
├── emit.js     # the command each hook runs: reads stdin JSON → POSTs to the server
├── traces/     # metadata-only JSONL, one line per finished subagent run (gitignored)
└── README.md
```

## 1. Run the server

```bash
node tools/agent-monitor/server.js
# → http://localhost:4599   (override with AGENT_MONITOR_PORT)
```

Open **http://localhost:4599**. `GET /runs` returns the current run snapshot as JSON; `POST /clear`
resets the live view (persisted traces are kept).

## 2. Hooks

Already wired in the committed **`.claude/settings.json`** (ADR-026) for `PreToolUse`, `PostToolUse`,
`PostToolUseFailure`, `SubagentStart` and `SubagentStop`, all with `matcher: ""` and the command
`node "$CLAUDE_PROJECT_DIR/tools/agent-monitor/emit.js"`. Settings changes take effect in the running
session; a new **agent definition** needs a session restart.

## 3. How a run is tracked (verified 2026-10-07, Claude Code 2.1.273)

| Signal | Source |
|---|---|
| run starts | `SubagentStart` → `agent_id`, `agent_type` |
| tools, files read/modified | `PreToolUse` inside the subagent carries `agent_id` (Read/Glob/Grep → inspected; Edit/Write → modified) |
| observed failures | `PostToolUseFailure` — fires for Bash exit ≠ 0 too |
| declared STATUS, NEXT_STEP, CHECKS/OBSTACLES present | the report the agent hands back: `PreToolUse` of `SubagentHandback`, `tool_input.message` |
| task label and parent | `PostToolUse` of `Agent` → `tool_response.agentId` + `description`; a call made inside a subagent sets that subagent as the parent |
| run ends | `SubagentStop` → the record is written |

`SubagentStop` does **not** carry `last_assistant_message` in this version, despite the docs. Parallel
agents are attributed exactly (distinct `agent_id`s); there is no FIFO guessing any more.

**Declared vs observed.** `status_declared` is what the agent said; `observed` is what the hooks saw.
`discrepancy` is set when an agent declares DONE while its last call failed, or — for agents the contract obliges to list CHECKS
(writers and verifier) — after failures with no CHECKS line. It is a signal for the orchestrator, not a verdict — the verifier decides whether work is done.

**Known blind spots.** Files read or written through Bash (`cat`, `sed -i`, `>`) do not appear in
`files_inspected` / `files_modified`. If the server is not running, nothing is recorded.

## 4. Persisted traces — privacy boundary (ADR-026 §10)

`traces/YYYY-MM-DD.jsonl`, one line per finished subagent run, built from a **whitelist** in
`runs.js` `toRecord()` — never from a raw payload:

`v, run_id, parent_id, session_id, agent_id, agent_type, task (≤80 chars), started_at, ended_at,
duration_ms, status_declared, observed{tool_calls, failures, failed_tools, last_call_failed},
discrepancy, files_inspected[], files_modified[] (project-relative, ≤100, outside → "<outside-project>"),
files_truncated, tools_used{}, has_checks, has_obstacles, next_step (≤160 chars)`

**Never stored:** prompts, assistant messages, command text, command output, error text, model
reasoning. `task` and `next_step` matching token/secret/password/api-key/bearer/connection-string
patterns are replaced by `[redacted]`. The raw event ring (live log) stays in memory only.

| Env var | Default | |
|---|---|---|
| `AGENT_MONITOR_PERSIST` | on | `0` disables writing traces |
| `AGENT_MONITOR_RETENTION_DAYS` | 30 | older files are deleted at server start |

## Safety

- `emit.js` is **fail-safe**: short timeout, fire-and-forget, and it **always exits 0**
  with `{}` — if the server is down or slow it silently no-ops and never blocks or delays
  a Claude Code session.
- Everything is **local** (localhost only); no data leaves the machine.

## When you want production-grade observability instead

This is a "watch it work" panel for local dev. For durable metrics/traces, Claude Code
also exports **OpenTelemetry**:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

Point OTLP at a collector and view in Grafana / Honeycomb / Datadog / Jaeger. Metrics
include session/cost/token/commit counts; events include prompts, tool decisions, and API
requests. (Env-var names can shift between versions — confirm against the current
`code.claude.com/docs/en/monitoring-usage` before relying on them.)
