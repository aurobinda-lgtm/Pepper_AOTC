// ─────────────────────────────────────────────────────────────────────────
// Local-browser fallback for the team roster + per-person space access.
// Used until Supabase is connected — once SUPABASE_CONFIGURED is true,
// TeamMembersView prefers live `profiles` data (see queries.js) instead,
// and this should be migrated server-side (a `profiles.scope_projects`
// column exists in the schema for exactly that).
// ─────────────────────────────────────────────────────────────────────────
import { USERS } from "../data/users.js";

const MEMBERS_KEY   = "aotc_custom_team_members";
const SCOPE_KEY      = "aotc_scope_overrides";
const DEACTIVATE_KEY = "aotc_deactivated_emails";

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export function loadCustomMembers() { return loadJSON(MEMBERS_KEY, []); }

export function addLocalMember({ name, email, role }) {
  const initials = name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const member = { id: `local_${Date.now()}`, name, email, role, initials, writeAccess: true, scopeProjects: [], local: true };
  saveJSON(MEMBERS_KEY, [...loadCustomMembers(), member]);
  return member;
}

export function removeLocalMember(email) {
  saveJSON(MEMBERS_KEY, loadCustomMembers().filter((m) => m.email !== email));
}

/** Every login-able profile: built-in USERS plus anyone the PM added locally. */
export function getAllProfiles() {
  return [...USERS, ...loadCustomMembers()];
}

function loadScopeOverrides() { return loadJSON(SCOPE_KEY, {}); }

/** A user's effective project scope: local override if one exists, else their built-in default. null = unrestricted. */
export function getScopeProjects(user) {
  if (!user?.email) return user?.scopeProjects ?? null;
  const overrides = loadScopeOverrides();
  return Object.prototype.hasOwnProperty.call(overrides, user.email) ? overrides[user.email] : (user.scopeProjects ?? null);
}

export function setScopeProjects(email, projects) {
  const overrides = loadScopeOverrides();
  overrides[email] = projects;
  saveJSON(SCOPE_KEY, overrides);
}

function loadDeactivated() { return loadJSON(DEACTIVATE_KEY, []); }

export function isDeactivated(email) { return loadDeactivated().includes(email); }

export function setDeactivated(email, deactivated) {
  const list = loadDeactivated().filter((e) => e !== email);
  if (deactivated) list.push(email);
  saveJSON(DEACTIVATE_KEY, list);
}
