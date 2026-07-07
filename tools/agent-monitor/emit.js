#!/usr/bin/env node
/**
 * Hook emitter — the command Claude Code hooks run.
 *
 * Reads the hook event JSON from stdin and forwards it to the Agent Monitor
 * server. FAIL-SAFE by design: it must never block or slow a Claude Code
 * session, so it fires-and-forgets with a short timeout and ALWAYS exits 0,
 * even if the monitor server is down.
 *
 * Wired via .claude/settings.json (see README.md).
 */
'use strict';
const http = require('http');

const PORT = Number(process.env.AGENT_MONITOR_PORT || 4599);
let body = '';
process.stdin.on('data', (c) => { body += c; });
process.stdin.on('end', () => forward(body));
process.stdin.on('error', () => done());
// Hard safety net: never hang the session.
setTimeout(done, 900).unref?.();

function forward(payload) {
  try {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: '/hook', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload || '{}') },
        timeout: 700 },
      (res) => { res.resume(); res.on('end', done); }
    );
    req.on('error', done);   // server not running → silently ignore
    req.on('timeout', () => { req.destroy(); done(); });
    req.end(payload || '{}');
  } catch { done(); }
}

let finished = false;
function done() {
  if (finished) return;
  finished = true;
  process.stdout.write('{}');  // exit-0 JSON: no hook decision, non-blocking
  process.exit(0);
}
