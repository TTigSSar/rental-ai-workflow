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

module.exports = { PRIORITIES, LEGACY_PRIORITY_LABELS, isPriority, validateBacklog, canonical };
