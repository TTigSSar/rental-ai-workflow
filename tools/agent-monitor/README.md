# Agent Monitor — live view of a Claude Code multi-agent run

A zero-dependency local dashboard. Claude Code **hooks** POST each event (tool calls,
sub-agent lifecycle) to a tiny Node server; the browser streams them live over SSE.

```
tools/agent-monitor/
├── server.js   # the server + the dashboard (pure Node built-ins, no npm install)
├── emit.js     # the command each hook runs: reads stdin JSON → POSTs to the server
└── README.md
```

Verified working on this machine (Node v26): emit → server → SSE replay all pass.

## 1. Run the server

```bash
node tools/agent-monitor/server.js
# → http://localhost:4599   (override with AGENT_MONITOR_PORT)
```

Open **http://localhost:4599** in a browser. It shows "connecting…" until hooks fire.

## 2. Wire the hooks (one-time)

Add this to **`.claude/settings.json`** (shared) or **`.claude/settings.local.json`**
(machine-local, not committed). If a `hooks` key already exists, merge into it.

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "", "hooks": [ { "type": "command", "command": "node c:/Users/tigra/Projects/rental/rental-app/tools/agent-monitor/emit.js" } ] }
    ],
    "PostToolUse": [
      { "matcher": "", "hooks": [ { "type": "command", "command": "node c:/Users/tigra/Projects/rental/rental-app/tools/agent-monitor/emit.js" } ] }
    ],
    "SubagentStop": [
      { "matcher": "", "hooks": [ { "type": "command", "command": "node c:/Users/tigra/Projects/rental/rental-app/tools/agent-monitor/emit.js" } ] }
    ]
  }
}
```

- `"matcher": ""` catches **all** tools. To watch only agent orchestration, narrow to
  `"matcher": "Task"`. To reduce noise, use `"Task|Bash|Edit|Write"`.
- Forward slashes work in the path on Windows. No spaces here, so no quoting needed.
- Restart / re-open the Claude Code session after editing settings so hooks load.

Then run any Claude Code task — every tool call and sub-agent event appears live, with
the `Task` (sub-agent) rows highlighted and an **active-subagents** counter.

## Safety

- `emit.js` is **fail-safe**: short timeout, fire-and-forget, and it **always exits 0**
  with `{}` — if the server is down or slow it silently no-ops and never blocks or delays
  a Claude Code session.
- Everything is **local** (localhost only); no data leaves the machine.
- The dashboard renders the **raw** hook payload defensively (it keys only on the stable
  fields `hook_event_name` / `tool_name` / `session_id` and shows whatever else is
  present), so it keeps working even if payload field names differ slightly by version.

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
