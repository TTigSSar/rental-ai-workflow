#!/usr/bin/env node
/**
 * Agent Monitor — a zero-dependency live dashboard for a Claude Code multi-agent run.
 *
 * Claude Code hooks (PreToolUse / PostToolUse / SubagentStop) POST each event here;
 * the browser dashboard streams them live over Server-Sent Events.
 *
 *   node server.js            # then open http://localhost:4599
 *
 * Pairs with emit.js (the hook command) and the settings.json snippet in README.md.
 * Pure Node built-ins — no npm install.
 */
'use strict';
const http = require('http');

const PORT = Number(process.env.AGENT_MONITOR_PORT || 4599);
const RING = [];          // recent events, newest last
const RING_MAX = 500;
const clients = new Set(); // SSE responses

function broadcast(evt) {
  const line = `data: ${JSON.stringify(evt)}\n\n`;
  for (const res of clients) {
    try { res.write(line); } catch { /* client gone; cleaned up on close */ }
  }
}

const server = http.createServer((req, res) => {
  // ---- receive a hook event -------------------------------------------------
  if (req.method === 'POST' && req.url === '/hook') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      let raw;
      try { raw = JSON.parse(body); } catch { raw = { parseError: true, body: body.slice(0, 2000) }; }
      const evt = { seq: (RING.at(-1)?.seq || 0) + 1, receivedAt: Date.now(), payload: raw };
      RING.push(evt);
      if (RING.length > RING_MAX) RING.shift();
      broadcast(evt);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}'); // hooks read stdout as JSON on exit 0; empty object = no decision
    });
    return;
  }

  // ---- SSE stream -----------------------------------------------------------
  if (req.method === 'GET' && req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    for (const evt of RING) res.write(`data: ${JSON.stringify(evt)}\n\n`); // replay buffer
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 20000);
    clients.add(res);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  // ---- dashboard ------------------------------------------------------------
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DASHBOARD);
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`\n  Agent Monitor  →  http://localhost:${PORT}`);
  console.log(`  POST hook events to http://localhost:${PORT}/hook`);
  console.log(`  Waiting for Claude Code hooks…\n`);
});

// ---------------------------------------------------------------------------
const DASHBOARD = /* html */ `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agent Monitor · live</title>
<style>
  :root{
    --bg:#F6F5F2;--surface:#fff;--surface2:#FBFAF8;--text:#181A1F;--muted:#6B6C74;--faint:#9A9AA1;
    --border:#E7E4DE;--accent:#FF6008;--agent:#4A5FE3;--pass:#12874A;--fail:#D23A38;--warn:#B7791F;
    --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  }
  @media(prefers-color-scheme:dark){:root{
    --bg:#0D0E12;--surface:#15171D;--surface2:#1A1D24;--text:#E9E9EC;--muted:#9B9CA5;--faint:#6C6E78;
    --border:#252832;--accent:#FF7A2E;--agent:#8A99FF;--pass:#43C980;--fail:#F0605D;--warn:#E0A93F;}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px}
  header{position:sticky;top:0;background:color-mix(in srgb,var(--bg) 88%,transparent);
    backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:14px 22px;
    display:flex;align-items:center;gap:16px;flex-wrap:wrap;z-index:5}
  .brand{font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:9px;font-size:15px}
  .dot{width:9px;height:9px;border-radius:50%;background:var(--faint);transition:background .3s}
  .dot.on{background:var(--pass);box-shadow:0 0 0 0 var(--pass);animation:pulse 2.2s infinite}
  .dot.off{background:var(--fail)}
  .stats{display:flex;gap:20px;margin-left:auto;flex-wrap:wrap}
  .stat .n{font-family:var(--mono);font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}
  .stat .l{font-size:11px;color:var(--muted)}
  .stat.live .n{color:var(--accent)}
  main{max-width:1000px;margin:0 auto;padding:18px 22px 60px}
  .empty{color:var(--muted);text-align:center;padding:60px 20px;font-family:var(--mono);font-size:13px}
  .row{display:flex;gap:12px;align-items:flex-start;padding:11px 14px;background:var(--surface);
    border:1px solid var(--border);border-radius:10px;margin-bottom:8px;animation:rise .35s ease}
  .row.task{border-color:color-mix(in srgb,var(--agent) 45%,var(--border))}
  .row.sub{border-color:color-mix(in srgb,var(--accent) 45%,var(--border))}
  .time{font-family:var(--mono);font-size:11px;color:var(--faint);white-space:nowrap;padding-top:2px;
    font-variant-numeric:tabular-nums}
  .ev{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;
    padding:2px 8px;border-radius:6px;white-space:nowrap}
  .ev.pre{color:var(--warn);background:color-mix(in srgb,var(--warn) 16%,transparent)}
  .ev.post{color:var(--pass);background:color-mix(in srgb,var(--pass) 16%,transparent)}
  .ev.subagentstop{color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)}
  .ev.other{color:var(--muted);background:var(--surface2)}
  .body{flex:1;min-width:0}
  .tool{font-family:var(--mono);font-weight:600;font-size:13px}
  .tool.t{color:var(--agent)}
  .detail{color:var(--muted);font-size:12.5px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;font-family:var(--mono)}
  .sess{font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:3px}
  @keyframes rise{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--pass) 55%,transparent)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  @media(prefers-reduced-motion:reduce){.row{animation:none}.dot.on{animation:none}}
</style></head><body>
<header>
  <div class="brand"><span id="dot" class="dot off"></span> Agent Monitor <span style="color:var(--muted);font-weight:400">· live</span></div>
  <div class="stats">
    <div class="stat"><div class="n" id="c-events">0</div><div class="l">events</div></div>
    <div class="stat"><div class="n" id="c-tools">0</div><div class="l">tool calls</div></div>
    <div class="stat live"><div class="n" id="c-sub">0</div><div class="l">active subagents</div></div>
  </div>
</header>
<main><div id="stream"><div class="empty" id="empty">connecting… run a Claude Code task to see agents work here</div></div></main>
<script>
  const stream=document.getElementById('stream'),dot=document.getElementById('dot'),empty=document.getElementById('empty');
  let nEvents=0,nTools=0,nSubStart=0,nSubStop=0;
  const $=id=>document.getElementById(id);
  const setStat=()=>{$('c-events').textContent=nEvents;$('c-tools').textContent=nTools;
    $('c-sub').textContent=Math.max(0,nSubStart-nSubStop);};
  const evClass=e=>{e=(e||'').toLowerCase();if(e==='pretooluse')return'pre';if(e==='posttooluse')return'post';
    if(e==='subagentstop')return'subagentstop';return'other';};
  function summarize(p){ // defensive: show whatever the payload actually carries
    const ti=p.tool_input||{};
    if(typeof ti==='object'){
      if(ti.command)return String(ti.command);
      if(ti.description)return String(ti.description);
      if(ti.subagent_type||ti.agent_type)return('agent: '+(ti.subagent_type||ti.agent_type)+(ti.description?' — '+ti.description:''));
      if(ti.file_path)return String(ti.file_path);
      if(ti.prompt)return String(ti.prompt).slice(0,140);
      const k=Object.keys(ti);if(k.length)return k.map(x=>x+'='+JSON.stringify(ti[x]).slice(0,40)).join(' ').slice(0,160);
    }
    if(p.status||p.stop_reason)return[p.status,p.stop_reason].filter(Boolean).join(' · ');
    if(p.tool_response||p.tool_output){const o=p.tool_response||p.tool_output;return(typeof o==='string'?o:JSON.stringify(o)).slice(0,140);}
    return'';
  }
  function render(evt){
    if(empty)empty.remove();
    const p=evt.payload||{},ev=p.hook_event_name||'event',tool=p.tool_name||p.agent_type||'—';
    const isTask=/^task$/i.test(tool),isSub=evClass(ev)==='subagentstop';
    nEvents++; if(/tooluse/i.test(ev)&&/pre/i.test(ev))nTools++;
    if(/pretooluse/i.test(ev)&&isTask)nSubStart++; if(isSub)nSubStop++;
    setStat();
    const row=document.createElement('div');
    row.className='row'+(isTask?' task':'')+(isSub?' sub':'');
    const t=new Date(evt.receivedAt).toLocaleTimeString();
    const detail=summarize(p);
    row.innerHTML=\`<div class="time">\${t}</div>
      <div><span class="ev \${evClass(ev)}">\${ev.replace(/([a-z])([A-Z])/g,'$1 $2')}</span></div>
      <div class="body"><div class="tool \${isTask?'t':''}">\${isTask?'▸ subagent · ':''}\${escapeHtml(tool)}</div>
      \${detail?\`<div class="detail">\${escapeHtml(detail)}</div>\`:''}
      <div class="sess">\${escapeHtml((p.session_id||'').slice(0,8))}</div></div>\`;
    stream.prepend(row);
    while(stream.children.length>400)stream.lastChild.remove();
  }
  function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function connect(){
    const es=new EventSource('/events');
    es.onopen=()=>{dot.className='dot on';};
    es.onerror=()=>{dot.className='dot off';};
    es.onmessage=e=>{try{render(JSON.parse(e.data));}catch{}};
  }
  connect();
</script></body></html>`;
