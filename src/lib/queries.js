// ─────────────────────────────────────────────────────────────────────────
// Live data layer — replaces the static exports from src/data/pm_seed.js.
// Small hand-rolled hooks (no data library, matching the rest of the
// codebase) that return the SAME shapes the 6 dashboard views already
// destructure, so swapping the import is close to mechanical.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";

function useSupabaseQuery(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
  const run = useCallback(async () => {
    if (!supabase) { setState({ data: null, loading: false, error: null }); return; }
    setState((s) => ({ ...s, loading: true }));
    const { data, error } = await fetcher();
    setState({ data: error ? null : data, loading: false, error });
  }, deps);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/immutability */

  useEffect(() => { run(); }, [run]);

  return { ...state, refetch: run };
}

// ─── FEATURES / BUGS (tasks table) ─────────────────────────────────────────

function mapTaskRow(row) {
  return {
    id: row.id,
    name: row.name,
    title: row.name, // BUGS view reads `title`, FEATURES reads `name` — keep both
    project: row.projects?.name ?? row.project_id,
    listId: row.list_id ?? null,
    status: row.status,
    owner: row.owner_label ?? row.profiles?.name ?? "Unassigned",
    assignee: row.owner_label ?? row.profiles?.name ?? "Unassigned",
    targetDate: row.target_date,
    dueDate: row.target_date,
    risk: row.risk_note ?? "",
    health: row.health,
    priority: row.priority,
    blocked: row.blocked,
    clickupId: row.clickup_id,
    openedDays: row.opened_days,
  };
}

export function useFeatures() {
  return useSupabaseQuery(() =>
    supabase.from("tasks").select("*, projects(name), profiles(name)").eq("type", "feature").order("sort_order", { nullsFirst: true }).then(({ data, error }) => ({ data: data?.map(mapTaskRow), error }))
  );
}

export function useBugs() {
  return useSupabaseQuery(() =>
    supabase.from("tasks").select("*, projects(name), profiles(name)").eq("type", "bug").then(({ data, error }) => ({ data: data?.map(mapTaskRow), error }))
  );
}

export async function updateTask(id, patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("tasks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Creates a task from friendly field names (used by AddTaskForm). Every
 * listing that reads tasks — Roadmap table, Board, Bugs, Today, and Sprint
 * (via a linked sprint_items row) — pulls from this same `tasks` table, so a
 * task created anywhere shows up everywhere else it's relevant automatically.
 */
export async function createTask({ project, name, type = "feature", status = "not_started", owner = null, targetDate = null, priority = "P2", health = "yellow", risk = null, blocked = false, openedDays = null }) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  let projectId = null;
  if (project) {
    projectId = slugify(project);
    const { error: projErr } = await supabase.from("projects").upsert({ id: projectId, name: project }, { onConflict: "id" });
    if (projErr) return { error: projErr };
  }
  return supabase.from("tasks").insert({
    project_id: projectId, type, name, status, owner_label: owner, target_date: targetDate,
    priority, health, risk_note: risk, blocked, opened_days: openedDays,
  }).select("*, projects(name), profiles(name)").single();
}

export async function deleteTask(id) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("tasks").delete().eq("id", id);
}

// ─── CURRENT SPRINT ─────────────────────────────────────────────────────────

export function useCurrentSprint() {
  return useSupabaseQuery(async () => {
    const { data: sprint, error: sprintErr } = await supabase
      .from("sprints").select("*").order("start_date", { ascending: false }).limit(1).maybeSingle();
    if (sprintErr || !sprint) return { data: null, error: sprintErr };
    const { data: items, error: itemsErr } = await supabase
      .from("sprint_items").select("*, tasks(id, name, owner_label, projects(name))")
      .eq("sprint_id", sprint.id).order("sort_order", { nullsFirst: true });
    if (itemsErr) return { data: null, error: itemsErr };
    return {
      data: {
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
        velocity: sprint.velocity,
        items: items.map((it) => ({
          id: it.tasks?.id ?? it.id,
          sprintItemId: it.id,
          title: it.tasks?.name ?? "",
          project: it.tasks?.projects?.name ?? null,
          points: it.points,
          status: it.status,
          assignee: it.tasks?.owner_label ?? "Unassigned",
          blocked: it.blocked,
        })),
      },
      error: null,
    };
  });
}

/** Links an existing task into the current sprint (used when a task is created from the Sprint section). */
export async function addTaskToSprint(sprintId, taskId, opts = {}) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("sprint_items").insert({ sprint_id: sprintId, task_id: taskId, status: opts.status ?? "todo", points: opts.points ?? null });
}

export async function updateSprintItem(sprintItemId, patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("sprint_items").update(patch).eq("id", sprintItemId);
}

// ─── RELEASES ───────────────────────────────────────────────────────────────

function mapReleaseRow(row) {
  return {
    id: row.id,
    project: row.project ?? null,
    version: row.version,
    goLive: row.go_live,
    readiness: row.readiness,
    qaStatus: row.qa_status,
    criticalBugs: row.critical_bugs,
    uat: row.uat_status,
    rollback: row.rollback,
    status: row.status,
    features: row.features ?? [],
    deployChecklist: row.deploy_checklist ?? {},
  };
}

export function useReleases() {
  return useSupabaseQuery(() =>
    supabase.from("releases").select("*").then(({ data, error }) => ({ data: data?.map(mapReleaseRow), error }))
  );
}

export async function updateRelease(id, patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  const dbPatch = {};
  if ("readiness" in patch) dbPatch.readiness = patch.readiness;
  if ("qaStatus" in patch) dbPatch.qa_status = patch.qaStatus;
  if ("status" in patch) dbPatch.status = patch.status;
  if ("deployChecklist" in patch) dbPatch.deploy_checklist = patch.deployChecklist;
  return supabase.from("releases").update(dbPatch).eq("id", id);
}

// ─── BUG TREND ──────────────────────────────────────────────────────────────

export function useBugTrend() {
  return useSupabaseQuery(() =>
    supabase.from("bug_trend").select("*").order("week").then(({ data, error }) => ({
      data: data?.map((r) => ({ week: r.week, opened: r.opened, resolved: r.resolved })),
      error,
    }))
  );
}

// ─── TEAM CAPACITY ──────────────────────────────────────────────────────────

export function useTeamCapacity() {
  return useSupabaseQuery(() =>
    supabase.from("team_capacity").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ team: r.team_label, capacity: r.capacity, load: r.load, members: r.members, blocked: r.blocked })),
      error,
    }))
  );
}

// ─── HEALTH MATRIX ──────────────────────────────────────────────────────────

export function useHealthMatrix() {
  return useSupabaseQuery(() =>
    supabase.from("health_matrix").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ area: r.area, status: r.status })),
      error,
    }))
  );
}

// ─── BLOCKERS ───────────────────────────────────────────────────────────────

function mapBlockerRow(row) {
  return {
    id: row.id,
    project: row.project ?? null,
    title: row.title,
    owner: row.owner_label,
    impact: row.impact,
    dueDate: row.due_date,
    daysOpen: row.days_open,
    status: row.status,
    escalated: row.escalated,
  };
}

export function useBlockers() {
  return useSupabaseQuery(() =>
    supabase.from("blockers").select("*").then(({ data, error }) => ({ data: data?.map(mapBlockerRow), error }))
  );
}

export async function resolveBlocker(id) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("blockers").update({ status: "resolved" }).eq("id", id);
}

// ─── RISKS ──────────────────────────────────────────────────────────────────

export function useRisks() {
  return useSupabaseQuery(() =>
    supabase.from("risks").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ id: r.id, project: r.project ?? null, title: r.title, probability: r.probability, impact: r.impact, owner: r.owner_label, mitigation: r.mitigation, mitigated: r.mitigated })),
      error,
    }))
  );
}

export async function setRiskMitigated(id, mitigated) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("risks").update({ mitigated }).eq("id", id);
}

// ─── DECISIONS ──────────────────────────────────────────────────────────────

export function useDecisions() {
  return useSupabaseQuery(() =>
    supabase.from("decisions").select("*").eq("closed", false).then(({ data, error }) => ({
      data: data?.map((r) => ({ id: r.id, project: r.project ?? null, title: r.title, owner: r.owner_label, impact: r.impact, pendingSince: r.pending_since_days, escalation: r.escalation, dueDate: r.due_date })),
      error,
    }))
  );
}

export async function closeDecision(id) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("decisions").update({ closed: true }).eq("id", id);
}

// ─── BUG RESOLUTION (shared with RisksView "Resolve" buttons) ──────────────

export async function resolveBug(id) {
  return updateTask(id, { status: "resolved" });
}

// ─── CUSTOMER METRICS ───────────────────────────────────────────────────────

export function useCustomerMetrics() {
  return useSupabaseQuery(async () => {
    const [{ data: metrics, error: mErr }, { data: accounts, error: aErr }] = await Promise.all([
      supabase.from("customer_metrics").select("*").eq("id", 1).maybeSingle(),
      supabase.from("customer_accounts").select("*"),
    ]);
    if (mErr || aErr) return { data: null, error: mErr || aErr };
    return {
      data: {
        openTickets: metrics?.open_tickets ?? 0,
        criticalIssues: metrics?.critical_issues ?? 0,
        slaBreaches: metrics?.sla_breaches ?? 0,
        featureRequests: metrics?.feature_requests ?? 0,
        highRiskAccounts: metrics?.high_risk_accounts ?? 0,
        csat: metrics?.csat ?? null,
        accounts: (accounts ?? []).map((a) => ({ name: a.name, tickets: a.tickets, sla: a.sla, risk: a.risk, mrr: a.mrr })),
      },
      error: null,
    };
  });
}

export async function updateCustomerMetrics(patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  const dbPatch = {};
  if ("openTickets" in patch) dbPatch.open_tickets = patch.openTickets;
  if ("criticalIssues" in patch) dbPatch.critical_issues = patch.criticalIssues;
  if ("slaBreaches" in patch) dbPatch.sla_breaches = patch.slaBreaches;
  if ("featureRequests" in patch) dbPatch.feature_requests = patch.featureRequests;
  if ("highRiskAccounts" in patch) dbPatch.high_risk_accounts = patch.highRiskAccounts;
  if ("csat" in patch) dbPatch.csat = patch.csat;
  return supabase.from("customer_metrics").update(dbPatch).eq("id", 1);
}

export async function updateCustomerAccount(name, patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("customer_accounts").update(patch).eq("name", name);
}

// ─── PRODUCT USAGE ──────────────────────────────────────────────────────────

export function useProductUsage() {
  return useSupabaseQuery(() =>
    supabase.from("product_usage").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ feature: r.feature, released: r.released, adoption: r.adoption, target: r.target, trend: r.trend, dau: r.dau })),
      error,
    }))
  );
}

export async function updateProductUsage(feature, patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("product_usage").update(patch).eq("feature", feature);
}

// ─── BUSINESS METRICS ───────────────────────────────────────────────────────

export function useBusinessMetrics() {
  return useSupabaseQuery(() =>
    supabase.from("business_metrics").select("*").eq("id", 1).maybeSingle().then(({ data, error }) => ({
      data: data ? {
        arr: data.arr, mrr: data.mrr, mrrGrowth: data.mrr_growth, churn: data.churn,
        newCustomers: data.new_customers, trialToPaid: data.trial_to_paid,
        renewalRisk: data.renewal_risk, nps: data.nps,
      } : null,
      error,
    }))
  );
}

export async function updateBusinessMetrics(patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  const dbPatch = {};
  if ("arr" in patch) dbPatch.arr = patch.arr;
  if ("mrr" in patch) dbPatch.mrr = patch.mrr;
  if ("mrrGrowth" in patch) dbPatch.mrr_growth = patch.mrrGrowth;
  if ("churn" in patch) dbPatch.churn = patch.churn;
  if ("newCustomers" in patch) dbPatch.new_customers = patch.newCustomers;
  if ("trialToPaid" in patch) dbPatch.trial_to_paid = patch.trialToPaid;
  if ("renewalRisk" in patch) dbPatch.renewal_risk = patch.renewalRisk;
  if ("nps" in patch) dbPatch.nps = patch.nps;
  return supabase.from("business_metrics").update(dbPatch).eq("id", 1);
}

// ─── BUDGET ─────────────────────────────────────────────────────────────────

export function useBudget() {
  return useSupabaseQuery(() =>
    supabase.from("budget").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ team: r.team, planned: r.planned, actual: r.actual })),
      error,
    }))
  );
}

export async function updateBudget(team, patch) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("budget").update(patch).eq("team", team);
}

// ─── TEAM MEMBERS (profiles) ────────────────────────────────────────────────

export function useProfiles() {
  return useSupabaseQuery(() =>
    supabase.from("profiles").select("*").order("created_at").then(({ data, error }) => ({
      data: data?.map((p) => ({ id: p.id, name: p.name, email: p.email, role: p.role, active: p.active })),
      error,
    }))
  );
}

export async function setProfileActive(id, active) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("profiles").update({ active }).eq("id", id);
}

/** Creates a real Supabase Auth account + profile row for a new team member.
 *  Requires the `create-team-member` Edge Function (supabase/functions/create-team-member) —
 *  admin user creation needs the service-role key, which must never reach the browser. */
export async function inviteTeamMember({ name, email, role }) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.functions.invoke("create-team-member", { body: { name, email, role } });
}

// ─── TASK-LEVEL FEATURES: comments, tags, checklist ────────────────────────

export function useTaskComments(taskId) {
  return useSupabaseQuery(() =>
    supabase.from("task_comments").select("*, profiles(name)").eq("task_id", taskId).order("created_at").then(({ data, error }) => ({
      data: data?.map((c) => ({ id: c.id, body: c.body, author: c.profiles?.name ?? "Unknown", createdAt: c.created_at })),
      error,
    })), [taskId]
  );
}

export async function addTaskComment(taskId, authorId, body) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("task_comments").insert({ task_id: taskId, author_id: authorId, body });
}

export function useTags() {
  return useSupabaseQuery(() =>
    supabase.from("tags").select("*").order("name").then(({ data, error }) => ({
      data: data?.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      error,
    }))
  );
}

export function useTaskTags(taskId) {
  return useSupabaseQuery(() =>
    supabase.from("task_tags").select("tags(id, name, color)").eq("task_id", taskId).then(({ data, error }) => ({
      data: data?.map((r) => r.tags).filter(Boolean),
      error,
    })), [taskId]
  );
}

export async function createTag(name, color) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("tags").insert({ name, color }).select().single();
}

export async function addTagToTask(taskId, tagId) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("task_tags").insert({ task_id: taskId, tag_id: tagId });
}

export async function removeTagFromTask(taskId, tagId) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("task_tags").delete().eq("task_id", taskId).eq("tag_id", tagId);
}

export function useChecklist(taskId) {
  return useSupabaseQuery(() =>
    supabase.from("task_checklist_items").select("*").eq("task_id", taskId).order("sort_order").then(({ data, error }) => ({
      data: data?.map((i) => ({ id: i.id, label: i.label, done: i.done, sortOrder: i.sort_order })),
      error,
    })), [taskId]
  );
}

export async function addChecklistItem(taskId, label, sortOrder) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("task_checklist_items").insert({ task_id: taskId, label, sort_order: sortOrder });
}

export async function toggleChecklistItem(id, done) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("task_checklist_items").update({ done }).eq("id", id);
}

export async function deleteChecklistItem(id) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("task_checklist_items").delete().eq("id", id);
}

// ─── SPACES / FOLDERS / LISTS (ClickUp-style navigation) ───────────────────

export function useSpacesTree() {
  return useSupabaseQuery(async () => {
    const [{ data: spaces, error: e1 }, { data: folders, error: e2 }, { data: lists, error: e3 }] = await Promise.all([
      supabase.from("spaces").select("*").order("name"),
      supabase.from("folders").select("*").order("name"),
      supabase.from("lists").select("*").order("name"),
    ]);
    if (e1 || e2 || e3) return { data: null, error: e1 || e2 || e3 };
    const tree = (spaces ?? []).map((s) => ({
      id: s.id, name: s.name,
      lists: (lists ?? []).filter((l) => l.space_id === s.id && !l.folder_id),
      folders: (folders ?? []).filter((f) => f.space_id === s.id).map((f) => ({
        id: f.id, name: f.name,
        lists: (lists ?? []).filter((l) => l.folder_id === f.id),
      })),
    }));
    return { data: tree, error: null };
  });
}

export async function createSpace(name) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("spaces").insert({ name }).select().single();
}

export async function createFolder(spaceId, name) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("folders").insert({ space_id: spaceId, name }).select().single();
}

export async function createList(name, { spaceId, folderId }) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("lists").insert({ name, space_id: spaceId ?? null, folder_id: folderId ?? null }).select().single();
}

export async function assignTaskToList(taskId, listId) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.from("tasks").update({ list_id: listId }).eq("id", taskId);
}
