#!/usr/bin/env node
'use strict';

/**
 * trello-sync — push the project's deferred backlog (backlog.json) into a Trello list.
 *
 * Zero dependencies (Node 18+ global fetch), same spirit as tools/agent-monitor.
 * Idempotent: a card is created only if no card with the same name already exists
 * in the target list, so re-running never duplicates.
 *
 * Usage:
 *   node sync.js --boards            list your boards and their lists (to find TRELLO_LIST_ID)
 *   node sync.js --dry-run           show what would be created, touch nothing
 *   node sync.js                     create the missing cards
 *   node sync.js --move "<name>" --to "<list>"
 *                                    move one card to another list on the same board
 *                                    (<name> may be a unique substring of the card title);
 *                                    moving into the To Do list lands in the priority slot
 *   node sync.js --sort [--dry-run]  re-sort the To Do list by priority (Blocker first)
 *
 * The To Do list is kept sorted by priority: new cards are inserted into their slot.
 *
 * Credentials come from tools/trello-sync/.env (gitignored) or the environment:
 *   TRELLO_KEY, TRELLO_TOKEN, TRELLO_LIST_ID
 */

const fs = require('fs');
const path = require('path');
const { PRIORITIES, isPriority, validateBacklog, canonical, rankOf, slotFor } = require('./priority');

const API = 'https://api.trello.com/1';
const HERE = __dirname;

/** Stamped on every card this tool writes, so AI-authored work is distinguishable on the board. */
const AI_LABEL = 'AI';
const AI_LABEL_COLOR = 'black';

// ── .env (KEY=value, # comments) ─────────────────────────────────────────────
function loadEnv() {
  const file = path.join(HERE, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}

function creds() {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  if (!key || !token) {
    die(
      'Missing TRELLO_KEY / TRELLO_TOKEN.\n' +
        'Get them at https://trello.com/power-ups/admin (key) + "Token" link on that page,\n' +
        'then copy .env.example to .env and fill them in.',
    );
  }
  return { key, token };
}

function die(msg) {
  console.error('\n✖ ' + msg + '\n');
  process.exit(1);
}

/** Trello call. Secrets go in the query string (Trello's scheme) but are never logged. */
async function trello(method, endpoint, params = {}) {
  const { key, token } = creds();
  const url = new URL(API + endpoint);
  for (const [k, v] of Object.entries({ ...params, key, token })) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { method });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Redact so a failing call can't leak the token into logs/CI output.
    const safe = endpoint + ' ' + body.slice(0, 300);
    die(`Trello ${method} ${safe}\nHTTP ${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── commands ─────────────────────────────────────────────────────────────────

async function printBoards() {
  const boards = await trello('GET', '/members/me/boards', { fields: 'name' });
  if (!boards.length) die('No boards on this Trello account.');
  for (const b of boards) {
    console.log(`\n📋 ${b.name}`);
    const lists = await trello('GET', `/boards/${b.id}/lists`, { fields: 'name' });
    for (const l of lists) console.log(`   ${l.id}  ${l.name}`);
  }
  console.log('\nPut the id of the list you want into TRELLO_LIST_ID in .env\n');
}

function readBacklog() {
  const file = path.join(HERE, 'backlog.json');
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  // Checked before any Trello call: one bad item blocks the whole run, so no card
  // ever reaches the board without a priority.
  const errors = validateBacklog(items);
  if (errors.length) die('backlog.json is invalid — nothing was synced:\n  ' + errors.join('\n  '));
  return items;
}

/**
 * Card body = the context, plus (when present) a ready-to-paste agent prompt.
 * Anything deferred should ship with the prompt that will pick it up later —
 * the point of the card is that future-you can start work without re-deriving it.
 */
function bodyOf(item) {
  if (!item.prompt) return item.desc;
  return `${item.desc}\n\n---\n\n**Ready-to-run prompt**\n\n\`\`\`\n${item.prompt.trim()}\n\`\`\``;
}

/** Resolve label names to ids on the board, creating any that don't exist yet. */
async function resolveLabels(boardId, names, { dryRun } = {}) {
  if (!names.size) return new Map();
  const existing = await trello('GET', `/boards/${boardId}/labels`, { fields: 'name,color', limit: 1000 });
  const byName = new Map(existing.filter((l) => l.name).map((l) => [l.name.toLowerCase(), l.id]));
  const palette = ['blue', 'green', 'orange', 'purple', 'red', 'sky', 'lime', 'pink', 'black', 'yellow'];
  let next = 0;
  for (const name of names) {
    if (byName.has(name.toLowerCase())) continue;
    const color = name === AI_LABEL ? AI_LABEL_COLOR : palette[next++ % palette.length];
    if (dryRun) {
      console.log(`  would create label "${name}" (${color})`);
      continue;
    }
    const created = await trello('POST', '/labels', { idBoard: boardId, name, color });
    byName.set(name.toLowerCase(), created.id);
    console.log(`  + label "${name}" (${color})`);
  }
  return byName;
}

/**
 * Labels an item carries: its own, its priority (one of PRIORITIES), plus AI_LABEL —
 * every card this tool writes is AI-authored.
 */
function labelsOf(item) {
  return [...new Set([...(item.labels || []), canonical(item.priority), AI_LABEL])];
}

async function sync({ dryRun }) {
  const listId = process.env.TRELLO_LIST_ID;
  if (!listId) die('Missing TRELLO_LIST_ID. Run `node sync.js --boards` to find it, then set it in .env.');

  const items = readBacklog();
  const list = await trello('GET', `/lists/${listId}`, { fields: 'name,idBoard' });
  const existing = await trello('GET', `/lists/${listId}/cards`, { fields: 'name,labels,pos' });
  const byName = new Map(existing.map((c) => [c.name.trim(), c]));

  const missing = items.filter((it) => !byName.has(it.name.trim()));
  const present = items.filter((it) => byName.has(it.name.trim()));

  console.log(`\nList "${list.name}" — ${existing.length} card(s) already there.`);
  console.log(`Backlog: ${items.length} item(s) → ${missing.length} to create, ${present.length} already present.\n`);

  // Labels are reconciled on EVERY run, not just at creation: adding a label to
  // backlog.json (or introducing AI_LABEL, as happened once) must reach cards
  // that already exist, otherwise the tool silently drifts from its source.
  const labelIds = await resolveLabels(list.idBoard, new Set(items.flatMap(labelsOf)), { dryRun });

  // Diff by label NAME, not id: in a dry run the ids of labels that don't exist
  // yet are unknown, and an id-diff would silently report "nothing to change".
  let relabelled = 0;
  for (const it of present) {
    const card = byName.get(it.name.trim());
    const on = new Set((card.labels || []).map((l) => (l.name || '').toLowerCase()));
    // A priority already on the card was set (or changed) on the board — the board wins.
    // Only a card with no priority at all gets the backlog's.
    const hasPriority = [...on].some(isPriority);
    const add = labelsOf(it).filter((n) => !on.has(n.toLowerCase()) && !(hasPriority && isPriority(n)));
    if (!add.length) continue;
    if (dryRun) {
      console.log(`  would add [${add.join(', ')}] to: ${it.name}`);
    } else {
      for (const n of add) {
        const id = labelIds.get(n.toLowerCase());
        if (id) await trello('POST', `/cards/${card.id}/idLabels`, { value: id });
      }
      console.log(`  ⊕ [${add.join(', ')}] → ${it.name}`);
    }
    relabelled++;
  }

  for (const it of missing) {
    const ids = labelsOf(it)
      .map((n) => labelIds.get(n.toLowerCase()))
      .filter(Boolean);
    if (dryRun) {
      console.log(`  would create: ${it.name}`);
      continue;
    }
    // The list is kept sorted by priority: the new card goes into its priority's slot,
    // and joins `existing` so the next new card in this run is placed relative to it.
    const created = await trello('POST', '/cards', {
      idList: listId,
      name: it.name,
      desc: bodyOf(it),
      idLabels: ids.join(','),
      pos: slotFor(existing, it.priority),
    });
    existing.push(created);
    console.log(`  ✔ [${canonical(it.priority)}] ${it.name}`);
  }

  if (dryRun) {
    console.log('\n(dry run — nothing was created or changed)\n');
  } else if (!missing.length && !relabelled) {
    console.log('Nothing to do — Trello is already in sync.\n');
  } else {
    console.log(`\nCreated ${missing.length} card(s), relabelled ${relabelled}.\n`);
  }
}

/**
 * Overwrite one card's body from backlog.json.
 *
 * Deliberately NOT part of the normal sync: that runs on every invocation and
 * would silently clobber notes a human added on the board. Rewriting a card's
 * body is destructive, so it stays an explicit, one-card-at-a-time command.
 */
async function refresh(needle) {
  const listId = process.env.TRELLO_LIST_ID;
  if (!listId) die('Missing TRELLO_LIST_ID.');
  const items = readBacklog();

  const matches = items.filter((it) => it.name.toLowerCase().includes(needle.toLowerCase()));
  if (!matches.length) die(`No backlog.json item matching "${needle}".`);
  if (matches.length > 1) die(`"${needle}" matches ${matches.length} items:\n  ` + matches.map((i) => i.name).join('\n  '));
  const item = matches[0];

  const home = await trello('GET', `/lists/${listId}`, { fields: 'idBoard' });
  const cards = await trello('GET', `/boards/${home.idBoard}/cards`, { fields: 'name,desc' });
  const card = cards.find((c) => c.name.trim() === item.name.trim());
  if (!card) die(`Backlog item "${item.name}" has no card on the board yet — run a plain sync first.`);

  const body = bodyOf(item);
  if (card.desc === body) {
    console.log(`\n"${card.name}" is already up to date.\n`);
    return;
  }
  await trello('PUT', `/cards/${card.id}`, { desc: body });
  console.log(`\n↻ body rewritten: "${card.name}"\n`);
}

/**
 * Move a card between lists on the same board — the workflow half of the tool:
 * a card that is being worked on should not still read "To Do".
 */
async function move(needle, targetList) {
  const listId = process.env.TRELLO_LIST_ID;
  if (!listId) die('Missing TRELLO_LIST_ID (used to locate the board).');
  const home = await trello('GET', `/lists/${listId}`, { fields: 'idBoard' });

  const lists = await trello('GET', `/boards/${home.idBoard}/lists`, { fields: 'name' });
  const target = lists.find((l) => l.name.toLowerCase() === targetList.toLowerCase());
  if (!target) die(`No list named "${targetList}" on this board. Have: ${lists.map((l) => l.name).join(', ')}`);

  const cards = await trello('GET', `/boards/${home.idBoard}/cards`, { fields: 'name,idList' });
  const hits = cards.filter((c) => c.name.toLowerCase().includes(needle.toLowerCase()));
  if (!hits.length) die(`No card matching "${needle}".`);
  if (hits.length > 1) {
    die(`"${needle}" matches ${hits.length} cards — be more specific:\n  ` + hits.map((c) => c.name).join('\n  '));
  }

  const card = hits[0];
  if (card.idList === target.id) {
    console.log(`\n"${card.name}" is already in "${target.name}".\n`);
    return;
  }
  const from = lists.find((l) => l.id === card.idList);
  const params = { idList: target.id };
  if (target.id === listId) {
    // Back into the priority-sorted list: land in the card's priority slot, not at the top.
    const full = await trello('GET', `/cards/${card.id}`, { fields: 'labels' });
    const rank = rankOf(full);
    const cardsThere = await trello('GET', `/lists/${listId}/cards`, { fields: 'labels,pos' });
    params.pos = rank < PRIORITIES.length ? slotFor(cardsThere, PRIORITIES[rank]) : 'bottom';
  }
  await trello('PUT', `/cards/${card.id}`, params);
  console.log(`\n→ "${card.name}"\n  ${from ? from.name : '?'} → ${target.name}\n`);
}

/**
 * Re-sort the whole list by priority (stable within a priority). Repairs the order after
 * cards were added or re-prioritised by hand on the board, or created through the MCP.
 */
async function sortList({ dryRun }) {
  const listId = process.env.TRELLO_LIST_ID;
  if (!listId) die('Missing TRELLO_LIST_ID.');
  const cards = await trello('GET', `/lists/${listId}/cards`, { fields: 'name,labels,pos' });
  const sorted = cards
    .map((c, i) => ({ c, i, r: rankOf(c) }))
    .sort((a, b) => a.r - b.r || a.i - b.i);
  let moved = 0;
  for (const [n, { c, r }] of sorted.entries()) {
    const pos = (n + 1) * 16384;
    const label = PRIORITIES[r] || 'no priority';
    if (n === cards.indexOf(c) && c.pos === pos) continue;
    if (dryRun) console.log(`  ${n + 1}. [${label}] ${c.name}`);
    else await trello('PUT', `/cards/${c.id}`, { pos });
    moved++;
  }
  console.log(dryRun ? `\n(dry run — ${moved} card(s) would be repositioned)\n` : `\nSorted: ${moved} card(s) repositioned.\n`);
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  loadEnv();
  creds(); // fail on missing key/token before anything else, with the how-to-get-them hint
  const args = process.argv.slice(2);

  if (args.includes('--boards')) return printBoards();
  if (args.includes('--sort')) return sortList({ dryRun: args.includes('--dry-run') });

  const r = args.indexOf('--refresh');
  if (r !== -1) {
    if (!args[r + 1]) die('Usage: node sync.js --refresh "<card name>"');
    return refresh(args[r + 1]);
  }

  const m = args.indexOf('--move');
  if (m !== -1) {
    const t = args.indexOf('--to');
    if (!args[m + 1] || t === -1 || !args[t + 1]) {
      die('Usage: node sync.js --move "<card name>" --to "<list name>"');
    }
    return move(args[m + 1], args[t + 1]);
  }

  return sync({ dryRun: args.includes('--dry-run') });
})().catch((err) => die(err && err.stack ? err.stack : String(err)));
