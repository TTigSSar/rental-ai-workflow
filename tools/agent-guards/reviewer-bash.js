#!/usr/bin/env node
'use strict';

/**
 * PreToolUse hook for the `reviewer` agent (wired in .claude/agents/reviewer.md frontmatter).
 *
 * The reviewer is read-only (ADR-026). `tools:` cannot narrow Bash, so this hook does:
 * the ONLY Bash it allows is a single read-only git command against an explicit repo,
 *
 *   git -C <repo> status|diff|log|show|ls-files|rev-parse|merge-base|blame|branch --show-current …
 *
 * FAIL-CLOSED by design — the opposite of tools/agent-monitor/emit.js. Anything it does not
 * positively recognise, and any error while deciding, is a deny. (A hook that crashes with
 * exit 1 is a NON-blocking error in Claude Code, i.e. fail-open, so every path here ends in
 * an explicit JSON decision and exit 0.)
 */

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

function decide(input) {
  if (!input || input.tool_name !== 'Bash') {
    // Matcher is "Bash"; anything else reaching us is unexpected — deny.
    return deny('reviewer-bash guard received a non-Bash tool call');
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
  return allowThrough();
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

// No decision: the normal permission rules (including settings.json deny) still apply.
function allowThrough() {
  return {};
}

let raw = '';
let finished = false;
function finish(obj) {
  if (finished) return;
  finished = true;
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

// Fail closed if stdin never ends.
setTimeout(() => finish(deny('guard timed out reading the hook payload')), 3000).unref?.();
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('error', () => finish(deny('guard could not read the hook payload')));
process.stdin.on('end', () => {
  try {
    finish(decide(JSON.parse(raw)));
  } catch (e) {
    finish(deny('guard failed to parse the hook payload'));
  }
});
