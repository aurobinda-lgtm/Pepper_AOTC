// ─────────────────────────────────────────────────────────────────────────
// Local-storage mirror of the Supabase tables in queries.js, seeded once
// from src/data/pm_seed.js. Used only when Supabase isn't configured, so
// the app is fully interactive (add/edit/resolve, persisted across a
// refresh) before a real project is connected — same fallback spirit as
// localDirectory.js (team scoping) and gamification.js (points/streaks).
//
// Each getX()/mutateX() pair returns exactly the shape the corresponding
// queries.js hook/mutation already produces from Supabase, so no consuming
// component needs to know or care which source is active.
// ─────────────────────────────────────────────────────────────────────────
import {
  FEATURES, BUGS, CURRENT_SPRINT, RELEASES, BLOCKERS, RISKS, DECISIONS,
  BUG_TREND, TEAM_CAPACITY, HEALTH_MATRIX, CUSTOMER_METRICS, PRODUCT_USAGE,
  BUSINESS_METRICS, BUDGET,
} from "../data/pm_seed.js";

const KEY = "aotc_local_store";

const makeId = () => `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function seed() {
  const tasks = [
    ...FEATURES.map((f) => ({ ...f, type: "feature", category: f.category ?? "general" })),
    ...BUGS.map((b) => ({ ...b, name: b.title, type: "bug", category: b.category ?? "general" })),
  ];
  const knownIds = new Set(tasks.map((t) => t.clickupId).filter(Boolean));
  const sprintItems = [];
  for (const item of CURRENT_SPRINT.items) {
    let task = tasks.find((t) => t.clickupId === item.id);
    if (!task) {
      task = { id: makeId(), clickupId: item.id, type: "chore", category: "general", name: item.title,
                project: null, status: "not_started", owner: item.assignee, targetDate: null,
                risk: "", health: "yellow", priority: "P2", blocked: !!item.blocked, openedDays: null };
      tasks.push(task);
      knownIds.add(item.id);
    }
    sprintItems.push({ id: makeId(), taskId: task.id, status: item.status, points: item.points, blocked: !!item.blocked, sortOrder: sprintItems.length });
  }
  return {
    tasks,
    sprint: { id: "local-sprint", name: CURRENT_SPRINT.name, startDate: CURRENT_SPRINT.startDate, endDate: CURRENT_SPRINT.endDate, velocity: CURRENT_SPRINT.velocity },
    sprintItems,
    releases: RELEASES.map((r) => ({ ...r })),
    blockers: BLOCKERS.map((b) => ({ ...b })),
    risks: RISKS.map((r) => ({ ...r, mitigated: false })),
    decisions: DECISIONS.map((d) => ({ ...d, closed: false })),
    teamCapacity: TEAM_CAPACITY.map((t) => ({ ...t })),
    healthMatrix: HEALTH_MATRIX.map((h) => ({ ...h })),
    bugTrend: BUG_TREND.map((w) => ({ ...w })),
    customerMetrics: { openTickets: CUSTOMER_METRICS.openTickets, criticalIssues: CUSTOMER_METRICS.criticalIssues, slaBreaches: CUSTOMER_METRICS.slaBreaches, featureRequests: CUSTOMER_METRICS.featureRequests, highRiskAccounts: CUSTOMER_METRICS.highRiskAccounts, csat: CUSTOMER_METRICS.csat },
    customerAccounts: CUSTOMER_METRICS.accounts.map((a) => ({ ...a })),
    productUsage: PRODUCT_USAGE.map((p) => ({ ...p })),
    businessMetrics: { ...BUSINESS_METRICS },
    budget: BUDGET.map((b) => ({ ...b })),
    tags: [],
    taskTags: [],
    taskComments: [],
    checklist: [],
    spaces: [],
    folders: [],
    lists: [],
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw) return raw;
  } catch { /* fall through to reseed */ }
  const fresh = seed();
  save(fresh);
  return fresh;
}
function save(store) { localStorage.setItem(KEY, JSON.stringify(store)); }

// ─── TASKS (features + bugs) ────────────────────────────────────────────────

function mapLocalTask(t) {
  return {
    id: t.id, name: t.name, title: t.name, project: t.project ?? null, listId: t.listId ?? null,
    status: t.status, owner: t.owner ?? "Unassigned", assignee: t.owner ?? "Unassigned",
    targetDate: t.targetDate ?? null, dueDate: t.targetDate ?? null, risk: t.risk ?? "",
    health: t.health, priority: t.priority, blocked: !!t.blocked, clickupId: t.clickupId ?? null,
    openedDays: t.openedDays ?? null, category: t.category ?? "general",
  };
}
export function getFeatures() {
  return load().tasks.filter((t) => t.type === "feature").map(mapLocalTask);
}
export function getBugs() {
  return load().tasks.filter((t) => t.type === "bug").map(mapLocalTask);
}
export function localUpdateTask(id, patch) {
  const store = load();
  store.tasks = store.tasks.map((t) => (t.id === id ? { ...t,
    ...("owner_label" in patch ? { owner: patch.owner_label } : {}),
    ...("target_date" in patch ? { targetDate: patch.target_date } : {}),
    ...("risk_note" in patch ? { risk: patch.risk_note } : {}),
    ...("status" in patch ? { status: patch.status } : {}),
    ...("priority" in patch ? { priority: patch.priority } : {}),
    ...("health" in patch ? { health: patch.health } : {}),
    ...("blocked" in patch ? { blocked: patch.blocked } : {}),
  } : t));
  save(store);
}
export function localCreateTask({ project, name, type = "feature", status = "not_started", owner = null, targetDate = null, priority = "P2", health = "yellow", risk = null, blocked = false, openedDays = null, category = "general" }) {
  const store = load();
  const row = { id: makeId(), project: project ?? null, name, type, status, owner, targetDate, priority, health, risk: risk ?? "", blocked, openedDays, category, clickupId: null };
  store.tasks.push(row);
  save(store);
  return row;
}
export function localDeleteTask(id) {
  const store = load();
  store.tasks = store.tasks.filter((t) => t.id !== id);
  save(store);
}

// ─── SPRINT ─────────────────────────────────────────────────────────────────

export function getCurrentSprint() {
  const store = load();
  const taskById = new Map(store.tasks.map((t) => [t.id, t]));
  return {
    id: store.sprint.id,
    name: store.sprint.name,
    startDate: store.sprint.startDate,
    endDate: store.sprint.endDate,
    velocity: store.sprint.velocity,
    items: store.sprintItems.map((it) => {
      const t = taskById.get(it.taskId);
      return { id: it.taskId, sprintItemId: it.id, title: t?.name ?? "", project: t?.project ?? null, points: it.points, status: it.status, assignee: t?.owner ?? "Unassigned", blocked: it.blocked };
    }),
  };
}
export function localAddTaskToSprint(sprintId, taskId, opts = {}) {
  const store = load();
  store.sprintItems.push({ id: makeId(), taskId, status: opts.status ?? "todo", points: opts.points ?? null, blocked: false, sortOrder: store.sprintItems.length });
  save(store);
}
export function localUpdateSprintItem(sprintItemId, patch) {
  const store = load();
  store.sprintItems = store.sprintItems.map((it) => (it.id === sprintItemId ? { ...it, ...patch } : it));
  save(store);
}

// ─── RELEASES ───────────────────────────────────────────────────────────────

export function getReleases() { return load().releases; }
export function localUpdateRelease(id, patch) {
  const store = load();
  store.releases = store.releases.map((r) => (r.id === id ? { ...r, ...patch } : r));
  save(store);
}

// ─── BLOCKERS / RISKS / DECISIONS ───────────────────────────────────────────

export function getBlockers() { return load().blockers; }
export function localResolveBlocker(id) {
  const store = load();
  store.blockers = store.blockers.map((b) => (b.id === id ? { ...b, status: "resolved" } : b));
  save(store);
}
export function localCreateBlocker({ project = null, title, owner = null, impact = "medium", dueDate = null }) {
  const store = load();
  const row = { id: makeId(), project, title, owner, impact, dueDate, daysOpen: 0, status: "open", escalated: false };
  store.blockers.push(row);
  save(store);
  return row;
}

export function getRisks() { return load().risks; }
export function localSetRiskMitigated(id, mitigated) {
  const store = load();
  store.risks = store.risks.map((r) => (r.id === id ? { ...r, mitigated } : r));
  save(store);
}
export function localCreateRisk({ project = null, title, probability = "medium", impact = "medium", owner = null, mitigation = null }) {
  const store = load();
  const row = { id: makeId(), project, title, probability, impact, owner, mitigation, mitigated: false };
  store.risks.push(row);
  save(store);
  return row;
}

export function getDecisions() { return load().decisions.filter((d) => !d.closed); }
export function localCloseDecision(id) {
  const store = load();
  store.decisions = store.decisions.map((d) => (d.id === id ? { ...d, closed: true } : d));
  save(store);
}
export function localCreateDecision({ project = null, title, owner = null, impact = "medium", dueDate = null }) {
  const store = load();
  const row = { id: makeId(), project, title, owner, impact, pendingSince: 0, escalation: false, dueDate, closed: false };
  store.decisions.push(row);
  save(store);
  return row;
}

// ─── TEAM CAPACITY / HEALTH / BUG TREND (read-only summaries) ─────────────

export function getTeamCapacity() { return load().teamCapacity; }
export function getHealthMatrix() { return load().healthMatrix; }
export function getBugTrend() { return load().bugTrend; }

// ─── CUSTOMER / PRODUCT / BUSINESS / BUDGET ────────────────────────────────

export function getCustomerMetrics() {
  const store = load();
  return { ...store.customerMetrics, accounts: store.customerAccounts };
}
export function localUpdateCustomerMetrics(patch) {
  const store = load();
  store.customerMetrics = { ...store.customerMetrics, ...patch };
  save(store);
}
export function localUpdateCustomerAccount(name, patch) {
  const store = load();
  store.customerAccounts = store.customerAccounts.map((a) => (a.name === name ? { ...a, ...patch } : a));
  save(store);
}

export function getProductUsage() { return load().productUsage; }
export function localUpdateProductUsage(feature, patch) {
  const store = load();
  store.productUsage = store.productUsage.map((p) => (p.feature === feature ? { ...p, ...patch } : p));
  save(store);
}

export function getBusinessMetrics() { return load().businessMetrics; }
export function localUpdateBusinessMetrics(patch) {
  const store = load();
  store.businessMetrics = { ...store.businessMetrics, ...patch };
  save(store);
}

export function getBudget() { return load().budget; }
export function localUpdateBudget(team, patch) {
  const store = load();
  store.budget = store.budget.map((b) => (b.team === team ? { ...b, ...patch } : b));
  save(store);
}

// ─── TASK-LEVEL: tags / comments / checklist ───────────────────────────────

export function getTags() { return load().tags; }
export function localCreateTag(name, color) {
  const store = load();
  const tag = { id: makeId(), name, color };
  store.tags.push(tag);
  save(store);
  return tag;
}
export function getTaskTags(taskId) {
  const store = load();
  const tagIds = new Set(store.taskTags.filter((tt) => tt.taskId === taskId).map((tt) => tt.tagId));
  return store.tags.filter((t) => tagIds.has(t.id));
}
export function localAddTagToTask(taskId, tagId) {
  const store = load();
  store.taskTags.push({ taskId, tagId });
  save(store);
}
export function localRemoveTagFromTask(taskId, tagId) {
  const store = load();
  store.taskTags = store.taskTags.filter((tt) => !(tt.taskId === taskId && tt.tagId === tagId));
  save(store);
}

export function getTaskComments(taskId) {
  return load().taskComments.filter((c) => c.taskId === taskId);
}
export function localAddTaskComment(taskId, authorName, body) {
  const store = load();
  store.taskComments.push({ id: makeId(), taskId, author: authorName || "You", body, createdAt: new Date().toISOString() });
  save(store);
}

export function getChecklist(taskId) {
  return load().checklist.filter((i) => i.taskId === taskId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
export function localAddChecklistItem(taskId, label, sortOrder) {
  const store = load();
  store.checklist.push({ id: makeId(), taskId, label, done: false, sortOrder });
  save(store);
}
export function localToggleChecklistItem(id, done) {
  const store = load();
  store.checklist = store.checklist.map((i) => (i.id === id ? { ...i, done } : i));
  save(store);
}
export function localDeleteChecklistItem(id) {
  const store = load();
  store.checklist = store.checklist.filter((i) => i.id !== id);
  save(store);
}

// ─── SPACES / FOLDERS / LISTS ───────────────────────────────────────────────

export function getSpacesTree() {
  const store = load();
  return store.spaces.map((s) => ({
    id: s.id, name: s.name,
    lists: store.lists.filter((l) => l.spaceId === s.id && !l.folderId),
    folders: store.folders.filter((f) => f.spaceId === s.id).map((f) => ({
      id: f.id, name: f.name, lists: store.lists.filter((l) => l.folderId === f.id),
    })),
  }));
}
export function localCreateSpace(name) {
  const store = load();
  const row = { id: makeId(), name };
  store.spaces.push(row);
  save(store);
  return row;
}
export function localCreateFolder(spaceId, name) {
  const store = load();
  const row = { id: makeId(), spaceId, name };
  store.folders.push(row);
  save(store);
  return row;
}
export function localCreateList(name, { spaceId, folderId }) {
  const store = load();
  const row = { id: makeId(), name, spaceId: spaceId ?? null, folderId: folderId ?? null };
  store.lists.push(row);
  save(store);
  return row;
}
export function localAssignTaskToList(taskId, listId) {
  const store = load();
  store.tasks = store.tasks.map((t) => (t.id === taskId ? { ...t, listId } : t));
  save(store);
}
