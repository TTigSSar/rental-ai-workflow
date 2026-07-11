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

  // ---- clear the panel --------------------------------------------------------
  if (req.method === 'POST' && req.url === '/clear') {
    RING.length = 0;
    broadcast({ seq: 0, receivedAt: Date.now(), payload: { hook_event_name: 'PanelCleared' } });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
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
  .brand .sub{color:var(--muted);font-weight:400}
  .dot{width:9px;height:9px;border-radius:50%;background:var(--faint);transition:background .3s}
  .dot.on{background:var(--pass);box-shadow:0 0 0 0 var(--pass);animation:pulse 2.2s infinite}
  .dot.off{background:var(--fail)}
  .stats{display:flex;gap:20px;margin-left:auto;flex-wrap:wrap}
  .stat .n{font-family:var(--mono);font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}
  .stat .l{font-size:11px;color:var(--muted)}
  .stat.live .n{color:var(--accent)}
  main{max-width:1000px;margin:0 auto;padding:18px 22px 60px}
  .region{margin-bottom:26px}
  .rh{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
    margin:0 0 10px;padding:0 2px}
  .note{font-size:11.5px;color:var(--faint);margin-top:9px;padding:0 2px;line-height:1.45}
  .empty{color:var(--muted);text-align:center;padding:34px 20px;font-family:var(--mono);font-size:13px;
    background:var(--surface);border:1px dashed var(--border);border-radius:12px}

  /* ---- NOW panel (hero) ---- */
  .now{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
  .nowcard{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--faint);
    border-radius:14px;padding:16px 18px;position:relative;animation:rise .35s ease}
  .nowcard.running{border-left-color:var(--accent);animation:rise .35s ease,glow 2.4s ease-in-out infinite}
  .nowcard.orch{border-left-color:var(--agent)}
  .nc-top{display:flex;align-items:center;gap:10px;justify-content:space-between}
  .agent-name{font-family:var(--mono);font-weight:700;font-size:15px;color:var(--agent);
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .agent-name.orch{color:var(--agent)}
  .nc-task{font-size:15px;font-weight:600;line-height:1.35;margin-top:9px;color:var(--text)}
  .nc-timer{display:flex;align-items:baseline;gap:7px;margin-top:11px}
  .nc-timer .timer{font-family:var(--mono);font-size:26px;font-weight:600;letter-spacing:.01em;
    font-variant-numeric:tabular-nums;color:var(--accent)}
  .nowcard.orch .nc-timer .timer,.nowcard:not(.running) .nc-timer .timer{color:var(--text)}
  .nc-timer .u{font-size:11px;color:var(--muted)}
  .nc-action{margin-top:12px;padding-top:11px;border-top:1px solid var(--border);
    font-family:var(--mono);font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nc-action .lbl{color:var(--faint);text-transform:uppercase;font-size:9.5px;letter-spacing:.06em;margin-right:6px}
  .nc-action .atool{color:var(--text);font-weight:600}

  .badge{font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
    padding:3px 8px;border-radius:20px;white-space:nowrap;flex:none}
  .badge.run{color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)}
  .badge.done{color:var(--pass);background:color-mix(in srgb,var(--pass) 16%,transparent)}
  .badge.fail{color:var(--fail);background:color-mix(in srgb,var(--fail) 16%,transparent)}
  .badge.idle{color:var(--muted);background:var(--surface2)}

  /* ---- Delegation graph (CSS tree, no libs) ---- */
  .graph{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px 18px}
  .gnode{border:1px solid var(--border);border-radius:11px;padding:10px 13px;background:var(--surface2);
    border-left:4px solid var(--faint)}
  .gnode.orch{border-left-color:var(--agent);background:var(--surface)}
  .gnode.state-running{border-left-color:var(--accent);animation:glow 2.4s ease-in-out infinite}
  .gnode.state-active{border-left-color:var(--accent)}
  .gnode.state-done{border-left-color:var(--pass)}
  .gnode.state-failed{border-left-color:var(--fail)}
  .gn-top{display:flex;align-items:center;gap:9px;justify-content:space-between}
  .gn-name{font-family:var(--mono);font-weight:700;font-size:13.5px;color:var(--agent);
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .gnode.orch .gn-name{color:var(--agent)}
  .gn-task{font-size:12.5px;color:var(--muted);margin-top:5px;line-height:1.35}
  .gn-dur{font-family:var(--mono);font-size:11.5px;color:var(--faint);margin-top:6px;font-variant-numeric:tabular-nums}
  .branches{position:relative;margin:4px 0 0 22px;padding-left:24px;border-left:2px solid var(--border)}
  .branch{position:relative;margin-top:12px}
  .branch::before{content:"";position:absolute;left:-24px;top:20px;width:24px;height:2px;background:var(--border)}
  .branch:last-child::after{content:"";position:absolute;left:-26px;top:21px;bottom:0;width:2px;background:var(--bg)}

  /* ---- Activity log (secondary, collapsed) ---- */
  details.log{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:4px 6px}
  details.log>summary{cursor:pointer;list-style:none;padding:9px 12px;font-size:12px;font-weight:600;
    color:var(--muted);letter-spacing:.02em;user-select:none}
  details.log>summary::-webkit-details-marker{display:none}
  details.log>summary::before{content:"▸ ";color:var(--faint)}
  details.log[open]>summary::before{content:"▾ "}
  .stream{padding:2px 6px 8px}
  .row{display:flex;gap:12px;align-items:flex-start;padding:8px 12px;background:var(--surface2);
    border:1px solid var(--border);border-radius:9px;margin-bottom:6px;animation:rise .3s ease}
  .row.task{border-color:color-mix(in srgb,var(--agent) 45%,var(--border))}
  .row.sub{border-color:color-mix(in srgb,var(--accent) 45%,var(--border))}
  .time{font-family:var(--mono);font-size:10.5px;color:var(--faint);white-space:nowrap;padding-top:2px;
    font-variant-numeric:tabular-nums}
  .ev{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;
    padding:2px 7px;border-radius:6px;white-space:nowrap}
  .ev.pre{color:var(--warn);background:color-mix(in srgb,var(--warn) 16%,transparent)}
  .ev.post{color:var(--pass);background:color-mix(in srgb,var(--pass) 16%,transparent)}
  .ev.subagentstop{color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)}
  .ev.other{color:var(--muted);background:var(--surface)}
  .body{flex:1;min-width:0}
  .tool{font-family:var(--mono);font-weight:600;font-size:12.5px}
  .tool.t{color:var(--agent)}
  .detail{color:var(--muted);font-size:12px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;font-family:var(--mono)}
  .sess{font-family:var(--mono);font-size:10px;color:var(--faint);margin-top:3px}

  @keyframes rise{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--pass) 55%,transparent)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
  @keyframes glow{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 34%,transparent)}50%{box-shadow:0 0 0 5px transparent}}
  @media(prefers-reduced-motion:reduce){.row,.nowcard,.gnode{animation:none!important}.dot.on{animation:none}}
</style></head><body>
<header>
  <div class="brand"><span id="dot" class="dot off"></span> Agent Monitor <span class="sub">· live</span></div>
  <div class="stats">
    <div class="stat live"><div class="n" id="c-active">0</div><div class="l">active agents</div></div>
    <div class="stat"><div class="n" id="c-deleg">0</div><div class="l">delegations</div></div>
    <div class="stat"><div class="n" id="c-events">0</div><div class="l">events</div></div>
  </div>
</header>
<main>
  <section class="region">
    <h2 class="rh">Now working</h2>
    <div id="now" class="now"></div>
    <div class="note" id="now-note"></div>
  </section>
  <section class="region">
    <h2 class="rh">Delegation graph</h2>
    <div id="graph" class="graph"></div>
  </section>
  <details class="region log" id="log">
    <summary>Activity log <span id="log-count">(0)</span></summary>
    <div id="stream" class="stream"></div>
  </details>
</main>
<script>
  var $=function(id){return document.getElementById(id);};
  var dot=$('dot'), streamEl=$('stream');
  var seen=Object.create(null);   // seq -> true (dedupe replayed ring by seq)
  var evtList=[];                 // all events, kept sorted by seq

  function escapeHtml(s){return String(s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]);});}
  function evClass(e){e=(e||'').toLowerCase();if(e==='pretooluse')return'pre';if(e==='posttooluse')return'post';
    if(e==='subagentstop')return'subagentstop';return'other';}
  function fmtDur(ms){if(!(ms>0))ms=0;var s=Math.floor(ms/1000),m=Math.floor(s/60);s=s%60;
    return(m<10?'0':'')+m+':'+(s<10?'0':'')+s;}

  // Defensive: show whatever the payload actually carries (preserved from original client).
  function summarize(p){
    var ti=p.tool_input||{};
    if(typeof ti==='object'){
      if(ti.command)return String(ti.command);
      if(ti.description)return String(ti.description);
      if(ti.subagent_type||ti.agent_type)return('agent: '+(ti.subagent_type||ti.agent_type)+(ti.description?' — '+ti.description:''));
      if(ti.file_path)return String(ti.file_path);
      if(ti.prompt)return String(ti.prompt).slice(0,140);
      var k=Object.keys(ti);if(k.length)return k.map(function(x){return x+'='+JSON.stringify(ti[x]).slice(0,40);}).join(' ').slice(0,160);
    }
    if(p.status||p.stop_reason)return[p.status,p.stop_reason].filter(Boolean).join(' · ');
    if(p.tool_response||p.tool_output){var o=p.tool_response||p.tool_output;return(typeof o==='string'?o:JSON.stringify(o)).slice(0,140);}
    return'';
  }

  // ---- PURE FOLD over the full event list -------------------------------------
  // Rebuilds identical state on every render, so a replayed ring (page reload OR
  // SSE reconnect) reconstructs the same graph. Idempotent because evtList is
  // deduped by seq before we ever get here.
  function computeState(){
    var orch={name:'Orchestrator'};
    var nodes=[];              // agent nodes, in creation order
    var byKey=Object.create(null); // "name\\0task" -> current node for that key
    var runningQ=[];           // ids of still-running nodes, oldest first (FIFO)
    var latest=null;           // most recent non-Agent tool call overall
    var nEvents=0,nDeleg=0;

    function drop(id){var i=runningQ.indexOf(id);if(i>=0)runningQ.splice(i,1);}
    function nodeById(id){for(var i=0;i<nodes.length;i++)if(nodes[i].id===id)return nodes[i];return null;}

    for(var e=0;e<evtList.length;e++){
      var evt=evtList[e]||{}, p=evt.payload||{}, at=evt.receivedAt||0;
      nEvents++;
      var ev=(p.hook_event_name||'').toLowerCase();
      var tool=p.tool_name||p.agent_type||'';
      var isAgent=/^(agent|task)$/i.test(tool);

      if(ev==='pretooluse'&&isAgent){
        // START of a delegation.
        var ti=p.tool_input||{};
        var name=ti.subagent_type||ti.agent_type||'subagent';
        var task=ti.description||'(no description)';
        var key=name+'\\u0000'+task;
        var prior=byKey[key];
        if(prior&&prior.state==='running'){prior.state='done';prior.endedAt=at;drop(prior.id);}
        var node={id:'a'+nodes.length,name:name,task:task,prompt:ti.prompt||'',
          startedAt:at,endedAt:null,lastActionAt:at,lastAction:null,state:'running'};
        nodes.push(node);byKey[key]=node;runningQ.push(node.id);nDeleg++;
        continue;
      }
      if(ev==='subagentstop'){
        // HEURISTIC: SubagentStop carries no subagent_type/description, so it cannot
        // be name-matched. We mark the OLDEST still-running node done (FIFO), which is
        // correct for the usual sequential case but imperfect for parallel background
        // agents (it may attribute a stop to the wrong one).
        var id=runningQ.shift();
        if(id){var n=nodeById(id);if(n){n.state=(p.error||/error|fail/i.test(String(p.stop_reason||'')))?'failed':'done';n.endedAt=at;}}
        continue;
      }
      // PostToolUse(Agent) is NOT a finish signal (fires at launch for background
      // agents) — so it is intentionally ignored here.
      if((ev==='pretooluse'||ev==='posttooluse')&&tool&&!isAgent){
        latest={tool:tool,summary:summarize(p),at:at};
        // Inner sub-agent tool calls arrive WITHOUT agent identity. Only when exactly
        // one agent is running can we honestly attribute the action to it.
        var run=nodes.filter(function(x){return x.state==='running';});
        if(run.length===1){run[0].lastActionAt=at;run[0].lastAction=latest;}
      }
    }
    var running=nodes.filter(function(x){return x.state==='running';});
    return{orch:orch,nodes:nodes,running:running,latest:latest,nEvents:nEvents,nDeleg:nDeleg};
  }

  // ---- rendering --------------------------------------------------------------
  function badge(state){
    if(state==='running')return'<span class="badge run">running</span>';
    if(state==='done')return'<span class="badge done">done</span>';
    if(state==='failed')return'<span class="badge fail">failed</span>';
    return'<span class="badge idle">'+escapeHtml(state)+'</span>';
  }
  function timerSpan(node,now,cls){
    if(node.state==='running')
      return'<span class="timer'+(cls?' '+cls:'')+'" data-started="'+node.startedAt+'" data-running="1">'+fmtDur(now-node.startedAt)+'</span>';
    return'<span class="timer'+(cls?' '+cls:'')+'">'+fmtDur((node.endedAt||now)-node.startedAt)+'</span>';
  }
  function actionLine(a){
    if(!a)return'';
    return'<div class="nc-action"><span class="lbl">latest</span><span class="atool">'+escapeHtml(a.tool)+'</span>'+
      (a.summary?' <span class="asum">'+escapeHtml(a.summary)+'</span>':'')+'</div>';
  }

  function renderStats(st){
    $('c-active').textContent=st.running.length;
    $('c-deleg').textContent=st.nDeleg;
    $('c-events').textContent=st.nEvents;
  }

  function renderNow(st){
    var now=Date.now(),host=$('now'),html='';
    if(st.running.length){
      for(var i=0;i<st.running.length;i++){
        var n=st.running[i];
        // Attribute the global latest action only when exactly one agent runs;
        // otherwise fall back to whatever was attributed while this node was sole runner.
        var act=(st.running.length===1)?st.latest:n.lastAction;
        html+='<div class="nowcard running">'+
          '<div class="nc-top"><span class="agent-name">'+escapeHtml(n.name)+'</span>'+badge('running')+'</div>'+
          '<div class="nc-task">'+escapeHtml(n.task)+'</div>'+
          '<div class="nc-timer">'+timerSpan(n,now)+'<span class="u">elapsed</span></div>'+
          actionLine(act)+
          '</div>';
      }
    }else{
      // No sub-agent running → the Orchestrator is the active worker.
      html+='<div class="nowcard orch">'+
        '<div class="nc-top"><span class="agent-name orch">Orchestrator</span>'+badge('active')+'</div>'+
        '<div class="nc-task">'+(st.nDeleg?'Coordinating — no sub-agent running':'Waiting for a task…')+'</div>'+
        actionLine(st.latest)+
        '</div>';
    }
    host.innerHTML=html;

    var note=$('now-note');
    if(st.running.length>1)
      note.textContent='Multiple agents running. Inner tool calls arrive without agent identity in the hook stream, so the latest action is shown as shared rather than pinned to one agent.';
    else if(st.running.length===1)
      note.textContent='One agent running: the latest tool activity is attributed to it (inner sub-agent calls are otherwise not per-agent-attributable in the hook stream).';
    else
      note.textContent='Inner sub-agent tool calls are not per-agent-attributable in the hook stream; the Orchestrator card shows the latest tool activity overall.';
  }

  function renderGraph(st){
    var now=Date.now(),g=$('graph'),html='';
    var orchState=st.running.length?'idle':'active';
    html+='<div class="gnode orch state-'+orchState+'">'+
      '<div class="gn-top"><span class="gn-name">Orchestrator</span>'+
      badge(st.running.length?'idle':'active')+'</div>'+
      '<div class="gn-task">'+st.nDeleg+' delegation'+(st.nDeleg===1?'':'s')+' · '+st.running.length+' running</div>'+
      '</div>';
    if(!st.nodes.length){
      html+='<div class="branches"><div class="branch"><div class="gn-task" style="margin:6px 0">No delegations yet.</div></div></div>';
    }else{
      html+='<div class="branches">';
      for(var i=0;i<st.nodes.length;i++){
        var n=st.nodes[i];
        html+='<div class="branch"><div class="gnode agent state-'+n.state+'">'+
          '<div class="gn-top"><span class="gn-name">'+escapeHtml(n.name)+'</span>'+badge(n.state)+'</div>'+
          '<div class="gn-task">'+escapeHtml(n.task)+'</div>'+
          '<div class="gn-dur">'+timerSpan(n,now)+(n.state==='running'?' · elapsed':' · total')+'</div>'+
          '</div></div>';
      }
      html+='</div>';
    }
    g.innerHTML=html;
  }

  var _empty=null;
  function appendTimeline(evt){
    var p=evt.payload||{},ev=p.hook_event_name||'event',tool=p.tool_name||p.agent_type||'—';
    var isTask=/^(task|agent)$/i.test(tool),isSub=evClass(ev)==='subagentstop';
    var t=new Date(evt.receivedAt).toLocaleTimeString();
    var detail=summarize(p);
    var row=document.createElement('div');
    row.className='row'+(isTask?' task':'')+(isSub?' sub':'');
    row.innerHTML='<div class="time">'+escapeHtml(t)+'</div>'+
      '<div><span class="ev '+evClass(ev)+'">'+escapeHtml(String(ev).replace(/([a-z])([A-Z])/g,'$1 $2'))+'</span></div>'+
      '<div class="body"><div class="tool '+(isTask?'t':'')+'">'+(isTask?'▸ subagent · ':'')+escapeHtml(tool)+'</div>'+
      (detail?'<div class="detail">'+escapeHtml(detail)+'</div>':'')+
      '<div class="sess">'+escapeHtml(String(p.session_id||'').slice(0,8))+'</div></div>';
    streamEl.prepend(row);
    while(streamEl.children.length>300)streamEl.lastChild.remove();
    $('log-count').textContent='('+evtList.length+')';
  }

  function renderAll(){
    var st=computeState();
    renderStats(st);renderNow(st);renderGraph(st);
  }

  function onEvent(evt){
    if(!evt||typeof evt.seq!=='number')return;
    if(seen[evt.seq])return;          // dedupe replayed ring / reconnect
    seen[evt.seq]=true;
    evtList.push(evt);
    evtList.sort(function(a,b){return a.seq-b.seq;});
    appendTimeline(evt);
    renderAll();
  }

  // Live tick: only update the running timers in place (keeps animations smooth).
  setInterval(function(){
    var now=Date.now(),els=document.querySelectorAll('[data-running="1"]');
    for(var i=0;i<els.length;i++)els[i].textContent=fmtDur(now-Number(els[i].getAttribute('data-started')));
  },1000);

  function connect(){
    var es=new EventSource('/events');
    es.onopen=function(){dot.className='dot on';};
    es.onerror=function(){dot.className='dot off';};
    es.onmessage=function(e){try{onEvent(JSON.parse(e.data));}catch(err){}};
  }
  renderAll();  // paint the empty Orchestrator state immediately
  connect();
</script></body></html>`;
