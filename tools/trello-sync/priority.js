'use strict';

/**
 * The board's priority scale — every card carries exactly one of these labels.
 * Shared by sync.js (the gate) and priority-guard.js (the Claude Code hook),
 * so the two can never disagree about what counts as a priority.
 */
const PRIORITIES = ['Blocker', 'Highest', 'High', 'Medium', 'Low', 'Lowest'];

/** Pre-scale labels; kept out of backlog.json so a card can't end up with two priorities. */
const LEGACY_PRIORITY_LABELS = ['high-priority', 'low-priority'];

const isPriority = (name) => PRIORITIES.some((p) => p.toLowerCase() === String(name || '').toLowerCase());

/** Every problem in backlog.json as a readable line; empty array means valid. */
function validateBacklog(items) {
  if (!Array.isArray(items)) return ['backlog.json must be a JSON array of items'];
  const errors = [];
  items.forEach((it, i) => {
    const who = `#${i} "${(it && it.name) || '?'}"`;
    if (!it || !it.name || !it.desc) errors.push(`${who}: needs "name" and "desc"`);
    if (!it || !it.priority) errors.push(`${who}: missing "priority" — one of ${PRIORITIES.join(' / ')}`);
    else if (!isPriority(it.priority)) errors.push(`${who}: priority "${it.priority}" is not one of ${PRIORITIES.join(' / ')}`);
    const labels = (it && it.labels) || [];
    const stray = labels.filter((l) => isPriority(l) || LEGACY_PRIORITY_LABELS.includes(String(l).toLowerCase()));
    if (stray.length) errors.push(`${who}: priority belongs in "priority", not in "labels" (found ${stray.join(', ')})`);
  });
  return errors;
}

/** Canonical spelling of a priority, so "high" in backlog.json still matches the board's "High" label. */
const canonical = (name) => PRIORITIES.find((p) => p.toLowerCase() === String(name).toLowerCase());

/** Rank of a card by its priority label (0 = Blocker); a card without one sorts after Lowest. */
function rankOf(card) {
  const ranks = (card.labels || [])
    .map((l) => PRIORITIES.findIndex((p) => p.toLowerCase() === String(l.name || '').toLowerCase()))
    .filter((i) => i >= 0);
  return ranks.length ? Math.min(...ranks) : PRIORITIES.length;
}

/**
 * Trello `pos` that puts a card of `priority` into its slot in a list sorted by priority:
 * after the last card of the same or higher priority, before the first lower one.
 * `cards` are the list's cards with `pos` and `labels`.
 */
function slotFor(cards, priority) {
  const rank = PRIORITIES.findIndex((p) => p.toLowerCase() === String(priority).toLowerCase());
  const sorted = [...cards].sort((a, b) => a.pos - b.pos);
  const next = sorted.findIndex((c) => rankOf(c) > rank);
  if (next === -1) return sorted.length ? sorted[sorted.length - 1].pos + 16384 : 16384;
  const before = next > 0 ? sorted[next - 1].pos : 0;
  return (before + sorted[next].pos) / 2;
}

module.exports = { PRIORITIES, LEGACY_PRIORITY_LABELS, isPriority, validateBacklog, canonical, rankOf, slotFor };
