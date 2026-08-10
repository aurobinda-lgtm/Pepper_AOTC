// ─────────────────────────────────────────────────────────────────────────
// Team gamification — points, daily streaks, badges.
// LocalStorage-backed for now (same fallback spirit as localDirectory.js).
// Once Supabase is connected this should move to profiles.points/streak +
// a gamification_events table (columns already added to
// supabase/migrations/0001_init.sql) instead of localStorage.
// ─────────────────────────────────────────────────────────────────────────
import { getAllProfiles } from "./localDirectory.js";

const STATE_KEY = "aotc_gamification";

const POINTS = {
  task_complete_on_time: 15,
  task_complete_late: 5,
  bug_resolve: 8,
  blocker_resolve: 12,
  streak_bonus: 2, // added once streak >= 2 consecutive days
};

export const BADGE_DEFS = [
  { key: "first_blood",   label: "First Blood",   icon: "🩸", desc: "Complete your first task",        check: (s) => s.counts.task_complete >= 1 },
  { key: "deadline_hero", label: "Deadline Hero",  icon: "⏱️", desc: "5 on-time completions",            check: (s) => s.counts.on_time >= 5 },
  { key: "bug_squasher",  label: "Bug Squasher",   icon: "🐛", desc: "Resolve 5 bugs",                   check: (s) => s.counts.bug_resolve >= 5 },
  { key: "unblocker",     label: "Unblocker",      icon: "🔓", desc: "Resolve 5 blockers",               check: (s) => s.counts.blocker_resolve >= 5 },
  { key: "on_fire",       label: "On Fire",        icon: "🔥", desc: "3-day streak",                     check: (s) => s.streak >= 3 },
  { key: "unstoppable",   label: "Unstoppable",    icon: "⚡", desc: "7-day streak",                     check: (s) => s.streak >= 7 },
  { key: "century_club",  label: "Century Club",   icon: "💯", desc: "100 total points",                 check: (s) => s.points >= 100 },
];

function loadState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) ?? {}; } catch { return {}; }
}
function saveState(state) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

function emptyEntry() {
  return { points: 0, streak: 0, lastActiveDate: null, counts: { task_complete: 0, on_time: 0, bug_resolve: 0, blocker_resolve: 0 }, badges: [], history: [] };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function recomputeBadges(entry) {
  const earned = new Set(entry.badges);
  const newlyEarned = [];
  for (const b of BADGE_DEFS) {
    if (!earned.has(b.key) && b.check(entry)) {
      earned.add(b.key);
      newlyEarned.push(b);
    }
  }
  entry.badges = [...earned];
  return newlyEarned;
}

/**
 * Records a point-earning action for `email`.
 * action: "task_complete" | "bug_resolve" | "blocker_resolve"
 * meta: { onTime?: boolean } — only relevant for task_complete
 * Returns { pointsAwarded, streak, newBadges } for UI feedback (toast/confetti).
 */
export function awardPoints(email, action, meta = {}) {
  if (!email) return { pointsAwarded: 0, streak: 0, newBadges: [] };
  const state = loadState();
  const entry = state[email] ?? emptyEntry();

  // streak bookkeeping — consecutive calendar days with at least one award
  const today = todayStr();
  if (entry.lastActiveDate === today) {
    // already active today — streak unchanged
  } else if (entry.lastActiveDate && daysBetween(entry.lastActiveDate, today) === 1) {
    entry.streak += 1;
  } else {
    entry.streak = 1;
  }
  entry.lastActiveDate = today;

  let pointsAwarded = 0;
  if (action === "task_complete") {
    pointsAwarded = meta.onTime ? POINTS.task_complete_on_time : POINTS.task_complete_late;
    entry.counts.task_complete += 1;
    if (meta.onTime) entry.counts.on_time += 1;
  } else if (action === "bug_resolve") {
    pointsAwarded = POINTS.bug_resolve;
    entry.counts.bug_resolve += 1;
  } else if (action === "blocker_resolve") {
    pointsAwarded = POINTS.blocker_resolve;
    entry.counts.blocker_resolve += 1;
  }
  if (entry.streak >= 2) pointsAwarded += POINTS.streak_bonus;

  entry.points += pointsAwarded;
  entry.history.push({ action, points: pointsAwarded, date: today });

  const newBadges = recomputeBadges(entry);

  state[email] = entry;
  saveState(state);

  return { pointsAwarded, streak: entry.streak, newBadges };
}

export function getStats(email) {
  if (!email) return emptyEntry();
  const state = loadState();
  return state[email] ?? emptyEntry();
}

/** Stats for every known write-access profile, ranked by points (for the PM leaderboard). */
export function getAllStats() {
  const profiles = getAllProfiles().filter((u) => u.writeAccess);
  return profiles
    .map((u) => ({ email: u.email, name: u.name, role: u.role, ...getStats(u.email) }))
    .sort((a, b) => b.points - a.points);
}
