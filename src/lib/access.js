// Role scoping — funnel ALL visibility through this module.
// Components never filter data themselves; they call these functions.

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
 */
export function navFor(user) {
  if (user.role === "cto") {
    return [
      { key: "cto",         label: "Command",  icon: "◉" },
      { key: "cto-product", label: "Team",     icon: "◈" },
      { key: "cto-finance", label: "Finance",  icon: "$" },
    ];
  }
  if (user.role === "cdo") {
    return [
      { key: "cdo",          label: "Creative",  icon: "◈" },
      { key: "cdo-projects", label: "Projects",  icon: "◫" },
      { key: "cdo-reviews",  label: "Reviews",   icon: "✓" },
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
  if (user.role === "consultant") {
    return [
      { key: "inbox",    label: "Inbox",    icon: "✉" },
      { key: "tasks",    label: "Tasks",    icon: "✓" },
      { key: "projects", label: "Projects", icon: "◫" },
    ];
  }
  // pm — Operations merges Delivery + Risks + Teams into one command center
  return [
    { key: "pulse",      label: "Pulse",      icon: "◉" },
    { key: "operations", label: "Operations", icon: "◫" },
    { key: "business",   label: "Business",   icon: "$" },
    { key: "requests",   label: "Requests",   icon: "↓" },
  ];
}

/**
 * Default landing view for the given role.
 */
export function landingFor(user) {
  if (user.role === "ceo")    return "ceo";
  if (user.role === "cto")    return "cto";
  if (user.role === "cdo")    return "cdo";
  if (user.role === "pm")     return "pulse";
  if (user.role === "client") return "client-overview";
  return "inbox";
}
