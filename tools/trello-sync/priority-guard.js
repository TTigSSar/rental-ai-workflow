#!/usr/bin/env node
'use strict';

/**
 * Claude Code hook: no Trello card is created without a priority label.
 *
 * sync.js is the real gate (it refuses to run on an invalid backlog.json). This hook
 * covers the ways around it and moves the failure closer to where it's made:
 *
 *   PostToolUse  Edit|Write|MultiEdit on backlog.json → validate right away, feed errors back
 *   PreToolUse   Bash|PowerShell raw POST to /1/cards  → deny, point at sync.js
 *   PostToolUse  Trello MCP trelloWriteCard "create"   → the MCP can't set labels on create,
 *                                                        so demand the attach_label follow-up
 *
 * Reads the hook payload from stdin; silent (exit 0) for everything else.
 */

const fs = require('fs');
const path = require('path');
const { PRIORITIES, validateBacklog } = require('./priority');

const BACKLOG = path.join(__dirname, 'backlog.json');
const SCALE = PRIORITIES.join(' / ');

const out = (obj) => process.stdout.write(JSON.stringify(obj));
const samePath = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

function onBacklogEdit(input) {
  const file = input.tool_input && input.tool_input.file_path;
  if (!file || !samePath(file, BACKLOG)) return;

  let errors;
  try {
    errors = validateBacklog(JSON.parse(fs.readFileSync(BACKLOG, 'utf8')));
  } catch (e) {
    errors = [`not valid JSON: ${e.message}`];
  }
  if (!errors.length) return;
  out({
    decision: 'block',
    reason:
      'tools/trello-sync/backlog.json now violates the priority rule (every card must carry exactly one ' +
      `priority: ${SCALE}; put it in the item's "priority" field, not in "labels"). Fix before syncing:\n  ` +
      errors.join('\n  '),
  });
}

// A raw create is POST .../1/cards with nothing after "cards" but a query string.
// Sub-resources (/cards/{id}/idLabels, …) and PUT moves are left alone.
const RAW_CREATE_URL = /api\.trello\.com\/1\/cards(?![\w/-])/i;
const POST_VERB = /(-X\s*POST|--request\s+POST|-Method\s+Post|method\s*:\s*['"]POST['"])/i;

function onShell(input) {
  const cmd = (input.tool_input && input.tool_input.command) || '';
  if (!RAW_CREATE_URL.test(cmd) || !POST_VERB.test(cmd)) return;
  out({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        'Raw Trello card creation bypasses the priority rule. Add the item to tools/trello-sync/backlog.json ' +
        `with a "priority" (${SCALE}) and run \`node tools/trello-sync/sync.js\` instead.`,
    },
  });
}

function onMcpWriteCard(input) {
  if (!input.tool_input || input.tool_input.action !== 'create') return;
  out({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext:
        `The Trello card "${input.tool_input.name || ''}" was just created WITHOUT a priority — the MCP create ` +
        'action cannot set labels. Attach exactly one priority label now, before anything else: ' +
        `${SCALE} (trelloReadBoard for the label ARIs, then trelloWriteCard action "attach_label"). ` +
        'Every card on the board must carry a priority. Also attach the black "AI" label.',
    },
  });
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return; // never break the session over a malformed payload
  }
  const tool = input.tool_name || '';
  const event = input.hook_event_name;
  if (event === 'PostToolUse' && /^(Edit|Write|MultiEdit)$/.test(tool)) onBacklogEdit(input);
  else if (event === 'PreToolUse' && /^(Bash|PowerShell)$/.test(tool)) onShell(input);
  else if (event === 'PostToolUse' && tool === 'mcp__claude_ai_Trello__trelloWriteCard') onMcpWriteCard(input);
});
