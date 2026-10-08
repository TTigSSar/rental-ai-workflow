#!/usr/bin/env node
'use strict';

/**
 * PreToolUse hook (Bash|PowerShell) wired in the PROJECT .claude/settings.json — not in the agent's
 * frontmatter: a frontmatter hook was verified on 2026-10-07 to never be invoked in this setup.
 *
 * It only acts on calls made by the `reviewer` subagent (hook payload `agent_type`, which Claude Code
 * sets on tool events fired inside a subagent). Every other caller gets no decision ({}), so the
 * normal permission rules apply unchanged.
 *
 * For the reviewer it is FAIL-CLOSED (ADR-026): the ONLY shell command allowed is a single read-only
 * git command against an explicit repo,
 *
 *   git -C <repo> status|diff|log|show|ls-files|rev-parse|merge-base|blame|branch --show-current …
 *
 * and any doubt is a deny. (A hook that crashes with exit 1 is a NON-blocking error in Claude Code —
 * fail-open — so every path here ends in an explicit JSON decision and exit 0.)
 */

const REVIEWER = 'reviewer';

const READ_ONLY_SUBCOMMANDS = [
  'status', 'diff', 'log', 'show', 'ls-files', 'rev-parse', 'merge-base', 'blame',
];

// git -C <repo> <subcommand> [args] — repo may be quoted; no other global options (e.g. -c).
const ALLOWED = new RegExp(
  '^git\\s+-C\\s+("[^"]+"|\'[^\']+\'|[^\\s"\']+)\\s+' +
    '(' + READ_ONLY_SUBCOMMANDS.join('|') + '|branch\\s+--show-current)' +
    '(\\s|$)'
);

// Shell metacharacters that could chain, redirect or substitute a second command.
const SHELL_META = /[;&|<>`\n\r]|\$\(/;

// Read-only subcommands that can still write files or run external programs.
const DANGEROUS_ARGS = /(^|\s)(--output(=|\s|$)|--ext-diff|--textconv|-c\s|--exec)/;

// Used only when the payload is not valid JSON: is this possibly the reviewer?
const RAW_REVIEWER = /"agent_type"\s*:\s*"reviewer"/;

function decideForReviewer(input) {
  if (input.tool_name !== 'Bash') {
    return deny('the reviewer may not use ' + (input.tool_name || 'this tool') + ' for shell commands');
  }
  const cmd = String((input.tool_input && input.tool_input.command) || '').trim();
  if (!cmd) return deny('empty command');
  if (SHELL_META.test(cmd)) {
    return deny('shell chaining, redirection or substitution is not allowed for the reviewer');
  }
  if (!ALLOWED.test(cmd)) {
    return deny(
      'the reviewer may only run single read-only git commands of the form ' +
        '`git -C <repo> ' + READ_ONLY_SUBCOMMANDS.join('|') + ' …`'
    );
  }
  if (DANGEROUS_ARGS.test(cmd)) {
    return deny('--output, --ext-diff, --textconv, --exec and -c are not allowed for the reviewer');
  }
  return {};
}

function decide(raw) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch (e) {
    // Unknown caller: deny only if it might be the reviewer, otherwise stay out of the way.
    return RAW_REVIEWER.test(raw) ? deny('guard could not parse the hook payload') : {};
  }
  if (!input || input.agent_type !== REVIEWER) return {};
  return decideForReviewer(input);
}

function deny(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'reviewer is read-only (ADR-026): ' + reason,
    },
  };
}

let raw = '';
let finished = false;
function finish(obj) {
  if (finished) return;
  finished = true;
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

setTimeout(() => finish(RAW_REVIEWER.test(raw) ? deny('guard timed out') : {}), 3000).unref?.();
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('error', () => finish(RAW_REVIEWER.test(raw) ? deny('guard could not read the payload') : {}));
process.stdin.on('end', () => {
  try {
    finish(decide(raw));
  } catch (e) {
    finish(RAW_REVIEWER.test(raw) ? deny('guard failed') : {});
  }
});
