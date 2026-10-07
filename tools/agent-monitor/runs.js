'use strict';
/**
 * Run aggregator for the Agent Monitor (ADR-026 §10, PR 3).
 *
 * Folds Claude Code hook payloads into one record per subagent run, keyed by `agent_id`
 * (verified 2026-10-07 on Claude Code 2.1.273):
 *   SubagentStart                    {agent_id, agent_type}                → run starts
 *   Pre/PostToolUse inside a subagent carry {agent_id, agent_type}        → per-run tool/file stats
 *   PostToolUseFailure (Bash exit≠0 included) {agent_id, tool_name, error} → observed failures
 *   PreToolUse SubagentHandback      tool_input.message = the final report → declared STATUS, NEXT_STEP
 *   PostToolUse Agent                tool_response.agentId + description    → task label + parent link
 *   SubagentStop                     {agent_id}                             → run ends; record emitted
 * SubagentStop carries NO last_assistant_message in this version, despite the docs.
 *
 * toRecord() builds the persisted record FROM A WHITELIST — it never spreads a payload — so prompts,
 * assistant messages, command text, command output and reasoning cannot reach disk by construction.
 */
const path = require('path');

const STATUSES = ['DONE', 'BLOCKED', 'NEEDS_INPUT', 'FAILED', 'APPROVAL_REQUIRED'];
const SECRETISH = /(token|secret|passw|api[_-]?key|bearer|connectionstring|key=)/i;
const MAX_FILES = 100;
const READ_TOOLS = { Read: 'file_path', Glob: 'path', Grep: 'path' };
const WRITE_TOOLS = { Edit: 'file_path', Write: 'file_path', NotebookEdit: 'notebook_path', MultiEdit: 'file_path' };

function redact(s, max) {
  if (s == null) return null;
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (SECRETISH.test(t)) return '[redacted]';
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function createAggregator(opts) {
  const root = path.resolve(opts.projectRoot).replace(/\\/g, '/').toLowerCase();
  const runs = new Map();        // agent_id -> run (in memory)
  const roots = new Map();       // session_id -> root run id

  function rootId(sessionId) {
    const sid = String(sessionId || 'unknown');
    if (!roots.has(sid)) roots.set(sid, 'main-' + sid.slice(0, 8));
    return roots.get(sid);
  }

  function projectPath(p) {
    if (!p) return null;
    const abs = path.resolve(String(p)).replace(/\\/g, '/');
    const low = abs.toLowerCase();
    if (low === root) return '.';
    if (low.startsWith(root + '/')) return abs.slice(root.length + 1);
    return '<outside-project>';
  }

  function getRun(agentId, p, at) {
    let r = runs.get(agentId);
    if (!r) {
      r = {
        run_id: agentId, parent_id: rootId(p.session_id), session_id: p.session_id || null,
        agent_id: agentId, agent_type: p.agent_type || null, task: null,
        started_at: at, ended_at: null, state: 'running',
        status_declared: null, has_checks: false, has_obstacles: false, next_step: null,
        tool_calls: 0, failures: 0, failed_tools: {}, last_call_failed: false,
        files_inspected: new Set(), files_modified: new Set(), tools_used: {},
        last_action: null, // in-memory only (live dashboard), never persisted
      };
      runs.set(agentId, r);
    }
    if (!r.agent_type && p.agent_type) r.agent_type = p.agent_type;
    return r;
  }

  function addFile(set, p) {
    const rel = projectPath(p);
    if (rel && set.size < MAX_FILES + 1) set.add(rel);
  }

  function parseReport(r, message) {
    const text = String(message || '');
    const m = text.match(/^\s*STATUS:\s*([A-Z_]+)/m);
    r.status_declared = m && STATUSES.includes(m[1]) ? m[1] : 'MISSING';
    r.has_checks = /^\s*CHECKS:/m.test(text);
    const ob = text.match(/^\s*OBSTACLES:\s*(.*)$/m);
    r.has_obstacles = !!(ob && ob[1].trim() && !/^none\.?$/i.test(ob[1].trim())) ||
      /^\s*OBSTACLES:\s*\n\s*[-*]/m.test(text);
    const ns = text.match(/^\s*NEXT_STEP:\s*(.*)$/m);
    r.next_step = ns && !/^(none|n\/a|-)\.?$/i.test(ns[1].trim()) ? redact(ns[1], 160) : null;
  }

  /** Ingest one hook payload. Returns the completed record when a run ends, else null. */
  function ingest(p, at) {
    if (!p || typeof p !== 'object') return null;
    const ev = p.hook_event_name;
    const tool = p.tool_name;
    const aid = p.agent_id;

    // Main thread (no agent_id) or a subagent launching another agent: link task + parent.
    if (ev === 'PostToolUse' && tool === 'Agent') {
      const resp = p.tool_response || {};
      const child = resp.agentId;
      if (child) {
        const r = getRun(child, { session_id: p.session_id, agent_type: (p.tool_input || {}).subagent_type }, at);
        r.task = redact(resp.description || (p.tool_input || {}).description, 80);
        if (aid) r.parent_id = aid;
      }
      // fall through: a subagent's own Agent call still counts as its tool call below
    }

    if (!aid) return null;

    if (ev === 'SubagentStart') { getRun(aid, p, at); return null; }

    const r = getRun(aid, p, at);

    if (ev === 'PreToolUse') {
      if (tool === 'SubagentHandback') { parseReport(r, (p.tool_input || {}).message); return null; }
      r.tool_calls++;
      r.tools_used[tool] = (r.tools_used[tool] || 0) + 1;
      const ti = p.tool_input || {};
      if (READ_TOOLS[tool]) addFile(r.files_inspected, ti[READ_TOOLS[tool]]);
      if (WRITE_TOOLS[tool]) addFile(r.files_modified, ti[WRITE_TOOLS[tool]]);
      r.last_action = { tool, at };
      return null;
    }
    if (ev === 'PostToolUse') {
      if (tool !== 'SubagentHandback') r.last_call_failed = false;
      return null;
    }
    if (ev === 'PostToolUseFailure') {
      r.failures++;
      r.failed_tools[tool] = (r.failed_tools[tool] || 0) + 1;
      r.last_call_failed = true;
      return null;
    }
    if (ev === 'SubagentStop') {
      r.ended_at = at;
      r.state = 'done';
      if (!r.status_declared) r.status_declared = 'MISSING';
      return toRecord(r);
    }
    return null;
  }

  function discrepancy(r) {
    if (r.status_declared !== 'DONE') return null;
    if (r.last_call_failed) return 'declared_done_last_call_failed';
    if (r.failures > 0 && !r.has_checks) return 'declared_done_failures_without_checks';
    return null;
  }

  function list(set) {
    const a = Array.from(set);
    return a.slice(0, MAX_FILES);
  }

  /** The ONLY shape that leaves memory. Whitelisted fields; no payload spread. */
  function toRecord(r) {
    const end = r.ended_at || null;
    return {
      v: 1,
      run_id: r.run_id,
      parent_id: r.parent_id,
      session_id: r.session_id,
      agent_id: r.agent_id,
      agent_type: r.agent_type,
      task: r.task,
      started_at: new Date(r.started_at).toISOString(),
      ended_at: end ? new Date(end).toISOString() : null,
      duration_ms: end ? end - r.started_at : null,
      status_declared: r.status_declared,
      observed: {
        tool_calls: r.tool_calls,
        failures: r.failures,
        failed_tools: Object.assign({}, r.failed_tools),
        last_call_failed: r.last_call_failed,
        bash_exit_tracked: true,
      },
      discrepancy: discrepancy(r),
      files_inspected: list(r.files_inspected),
      files_modified: list(r.files_modified),
      files_truncated: r.files_inspected.size > MAX_FILES || r.files_modified.size > MAX_FILES,
      tools_used: Object.assign({}, r.tools_used),
      has_checks: r.has_checks,
      has_obstacles: r.has_obstacles,
      next_step: r.next_step,
    };
  }

  /** Live snapshot for the dashboard: records plus in-memory state/last tool name. */
  function snapshot() {
    return Array.from(runs.values()).map((r) => Object.assign(toRecord(r), {
      state: r.state,
      last_tool: r.last_action ? r.last_action.tool : null,
    }));
  }

  function clear() { runs.clear(); roots.clear(); }

  return { ingest, snapshot, clear, toRecord };
}

module.exports = { createAggregator, redact };
