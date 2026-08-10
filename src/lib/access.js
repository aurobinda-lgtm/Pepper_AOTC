// Role scoping — funnel ALL visibility through this module.
// Components never filter data themselves; they call these functions.
import { getScopeProjects } from "./localDirectory.js";

// Every project/client "space" known to the app — used both for scoping
// (Team Members' Spaces editor) and for the project picker when creating a
// new task, so a new task can always be filed somewhere everyone recognizes.
export const ALL_PROJECTS = ["MUWCI", "VenueSage", "UFO Buzz", "UFO Emotive", "UFO Aurora", "Carer", "Campus OS", "AOTC Website", "VIBE", "NAIN"];

/**
 * Projects visible to the given user.
 * @param {object} user  - from users.js
 * @param {Array}  projects - from seed.js (or mutable state copy)
 */
export function visibleProjects(user, projects) {
  if (user.role === "consultant" || user.role === "cto" || user.role === "cdo" || user.role === "client") {
    return projects.filter(p => user.projects.includes(p.id));
  }
  return projects;
}

/**
 * Client projects visible to the user (excludes Internal).
 */
export function visibleClients(user, projects) {
  return visibleProjects(user, projects).filter(p => p.client !== "Internal");
}

/**
 * Tasks visible to the user.
 * CEO has no task view — returns [].
 * Consultant sees only tasks assigned to them.
 */
export function visibleTasks(user, tasks) {
  if (user.role === "ceo") return [];
  if (user.role === "consultant" || user.role === "cto" || user.role === "cdo") return tasks.filter(t => t.assignee === user.name);
  return tasks;
}

/**
 * Inbox actions visible to the user.
 * CEO has no inbox — returns [].
 * Consultant sees only actions assigned to them.
 */
export function visibleInbox(user, actions) {
  if (user.role === "ceo") return [];
  if (user.role === "consultant" || user.role === "cto" || user.role === "cdo") return actions.filter(a => a.assignee === user.name);
  return actions;
}

/**
 * Team members visible to the user.
 * Only PM sees team workload.
 */
export function visibleTeam(user, team) {
  if (user.role !== "pm") return [];
  return team;
}

/**
 * Feature gates.
 */
export function can(user, action) {
  switch (action) {
    case "rebalance":     return user.role === "pm";
    case "companyToggle": return user.role === "pm" || user.role === "ceo";
    case "atRisk":        return user.role === "pm" || user.role === "ceo";
    default:              return false;
  }
}

/**
 * Nav tabs for the given user.
 *
 * pm sees everything (all spaces). cto/cdo/delivery are the real
 * write-access delivery team — they get the live Supabase-backed command
 * center (Operations/Team), scoped to their own project(s) via
 * scopeByProject() below; the portfolio-wide Pulse/Business/Requests tabs
 * are PM-only for now. The Board (Kanban) view lives inside Operations as a
 * view toggle rather than its own tab, to keep navigation short. ceo/client/
 * consultant keep their original (unrelated, seed.js-driven) nav untouched.
 */
export function navFor(user) {
  if (user.role === "pm") {
    return [
      { key: "pulse",      label: "Pulse",      icon: "◉" },
      { key: "operations", label: "Operations", icon: "◫" },
      { key: "business",   label: "Business",   icon: "$" },
      { key: "requests",   label: "Requests",   icon: "↓" },
      { key: "team",       label: "Team",       icon: "◈" },
    ];
  }
  if (user.role === "cto" || user.role === "cdo" || user.role === "delivery") {
    return [
      { key: "operations", label: "Operations", icon: "◫" },
      { key: "team",       label: "Team",       icon: "◈" },
    ];
  }
  if (user.role === "ceo") {
    return [
      { key: "ceo",           label: "Command",   icon: "⌂" },
      { key: "ceo-portfolio", label: "Portfolio", icon: "◫" },
      { key: "atrisk",        label: "At Risk",   icon: "⚑" },
    ];
  }
  if (user.role === "client") {
    return [
      { key: "client-overview",  label: "My Project", icon: "◫" },
      { key: "client-requests",  label: "Requests",   icon: "↑" },
    ];
  }
  // consultant (legacy/unused today)
  return [
    { key: "inbox",    label: "Inbox",    icon: "✉" },
    { key: "tasks",    label: "Tasks",    icon: "✓" },
    { key: "projects", label: "Projects", icon: "◫" },
  ];
}

/**
 * Default landing view for the given role.
 */
export function landingFor(user) {
  if (user.role === "pm")     return "pulse";
  if (user.role === "cto" || user.role === "cdo" || user.role === "delivery") return "operations";
  if (user.role === "ceo")    return "ceo";
  if (user.role === "client") return "client-overview";
  return "inbox";
}

/**
 * Scopes rows to the signed-in user's assigned project(s) ("their space").
 * `user.scopeProjects` is an array of project display names, or
 * null/undefined for unrestricted access (the PM, for now).
 * Rows with no project (company-wide items) are only visible when unrestricted.
 */
export function scopeByProject(user, rows, projectKey = "project") {
  if (!rows) return rows;
  const scope = getScopeProjects(user);
  if (!scope) return rows; // PM / unrestricted
  return rows.filter((r) => r[projectKey] && scope.includes(r[projectKey]));
}
