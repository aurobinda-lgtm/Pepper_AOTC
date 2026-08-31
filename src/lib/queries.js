// ─────────────────────────────────────────────────────────────────────────
// Live data layer — replaces the static exports from src/data/pm_seed.js.
// Small hand-rolled hooks (no data library, matching the rest of the
// codebase) that return the SAME shapes the 6 dashboard views already
// destructure, so swapping the import is close to mechanical.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import * as local from "./localStore.js";

function useSupabaseQuery(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
  const run = useCallback(async () => {
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
    category: row.category ?? "general",
  };
}

export function useFeatures() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getFeatures(), error: null });
    return supabase.from("tasks").select("*, projects(name), profiles(name)").eq("type", "feature").order("sort_order", { nullsFirst: true }).then(({ data, error }) => ({ data: data?.map(mapTaskRow), error }));
  });
}

export function useBugs() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getBugs(), error: null });
    return supabase.from("tasks").select("*, projects(name), profiles(name)").eq("type", "bug").then(({ data, error }) => ({ data: data?.map(mapTaskRow), error }));
  });
}

export async function updateTask(id, patch) {
  if (!supabase) { local.localUpdateTask(id, patch); return { error: null }; }
  return supabase.from("tasks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * Creates a task from friendly field names (used by AddTaskForm). Every
 * listing that reads tasks — Roadmap table, Board, Bugs, Today, and Sprint
 * (via a linked sprint_items row) — pulls from this same `tasks` table, so a
 * task created anywhere shows up everywhere else it's relevant automatically.
 */
export async function createTask({ project, name, type = "feature", status = "not_started", owner = null, targetDate = null, priority = "P2", health = "yellow", risk = null, blocked = false, openedDays = null, category = "general" }) {
  if (!supabase) return { data: local.localCreateTask({ project, name, type, status, owner, targetDate, priority, health, risk, blocked, openedDays, category }), error: null };
  let projectId = null;
  if (project) {
    projectId = slugify(project);
    const { error: projErr } = await supabase.from("projects").upsert({ id: projectId, name: project }, { onConflict: "id" });
    if (projErr) return { error: projErr };
  }
  return supabase.from("tasks").insert({
    project_id: projectId, type, name, status, owner_label: owner, target_date: targetDate,
    priority, health, risk_note: risk, blocked, opened_days: openedDays, category,
  }).select("*, projects(name), profiles(name)").single();
}

export async function deleteTask(id) {
  if (!supabase) { local.localDeleteTask(id); return { error: null }; }
  return supabase.from("tasks").delete().eq("id", id);
}

// ─── ORGANIZATIONS / WORKSPACE MEMBERSHIP ──────────────────────────────────

export function useMyOrganizations() {
  return useSupabaseQuery(async () => {
    if (!supabase) return { data: local.getMyOrganizations(), error: null };
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { data: [], error: null };
    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations(id, slug, name)")
      .eq("profile_id", auth.user.id).eq("active", true);
    if (error) return { data: null, error };
    return { data: data.map((m) => ({ id: m.organizations.id, slug: m.organizations.slug, name: m.organizations.name, role: m.role })), error: null };
  });
}

/** Sets which org's data the signed-in user sees — RLS reads this via current_org(). */
export async function switchOrganization(orgId) {
  if (!supabase) return { error: null };   // local mode: exactly one org, nothing to switch
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: { message: "Not signed in" } };
  return supabase.from("user_settings").upsert({ profile_id: auth.user.id, current_organization_id: orgId });
}

// ─── PROJECTS ───────────────────────────────────────────────────────────────
// Portfolio metrics (progress/total/done/overdue) are rolled up live from the
// tasks table rather than stored redundantly on `projects`; invoiced/received
// are summed from `invoices` by status. Mirrors local.getProjects()'s shape.

export function useProjects() {
  return useSupabaseQuery(async () => {
    if (!supabase) return { data: local.getProjects(), error: null };
    const [{ data: rows, error: pErr }, { data: tasks, error: tErr }, { data: invoices, error: iErr }] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("tasks").select("project_id, status"),
      supabase.from("invoices").select("project, amount, status"),
    ]);
    if (pErr) return { data: null, error: pErr };
    const data = rows.map((p) => {
      const rows_ = (tasks ?? []).filter((t) => t.project_id === p.id);
      const total = rows_.length;
      const done = rows_.filter((t) => t.status === "completed" || t.status === "resolved").length;
      const overdue = rows_.filter((t) => t.status === "delayed").length;
      const projInvoices = (invoices ?? []).filter((i) => i.project === p.name);
      const invoiced = projInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const received = projInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
      return {
        id: p.id, name: p.name, client: p.client, company: p.company, health: p.health,
        milestone: p.milestone ?? "Not set", due: p.due ?? "TBD", notes: p.notes ?? "",
        progress: total ? Math.round((done / total) * 100) : 0, total, done, overdue,
        invoiced, received, week: 0, lastContact: 0,
        accountId: p.account_id ?? null, opportunityId: p.opportunity_id ?? null,
      };
    });
    return { data, error: tErr || iErr || null };
  });
}

export async function createProject({ name, client = null, company = "aot", health = "green", due = null, notes = null, accountId = null, opportunityId = null }) {
  if (!supabase) return { data: local.localCreateProject({ name, client, company, health, due, notes, accountId, opportunityId }), error: null };
  return supabase.from("projects").insert({
    id: slugify(name), name, client, company, health, due, notes,
    account_id: accountId, opportunity_id: opportunityId,
  }).select().single();
}

export async function updateProject(id, patch) {
  if (!supabase) { local.localUpdateProject(id, patch); return { error: null }; }
  const dbPatch = {};
  for (const k of ["client", "company", "health", "milestone", "due", "notes"]) {
    if (k in patch) dbPatch[k] = patch[k];
  }
  return supabase.from("projects").update(dbPatch).eq("id", id);
}

// ─── AI LAYER (lightweight — no vector store, see ask-pepper/project-brief) ─
// Both call a Supabase Edge Function and need ANTHROPIC_API_KEY set as a
// function secret to actually answer; until then they return a clear
// "not configured" error rather than failing silently. No local-mode
// fallback — there's no LLM to call without Supabase.

export async function askPepper(question, organizationId) {
  if (!supabase) return { data: null, error: { message: "AI features need Supabase configured (see .env.example)." } };
  return supabase.functions.invoke("ask-pepper", { body: { question, organizationId } });
}

/** On-demand, not a live hook — a project brief calls an LLM, so it's
 *  generated only when the user asks for it (or regenerates), never
 *  automatically on every render of every project card. */
export async function getProjectBrief(projectId) {
  if (!supabase) return { data: null, error: { message: "AI features need Supabase configured (see .env.example)." } };
  return supabase.functions.invoke("project-brief", { body: { projectId } });
}

// ─── CRM: ACCOUNTS / CONTACTS / OPPORTUNITIES ──────────────────────────────
// The CRM→delivery bridge lives in updateOpportunity: moving an opportunity
// to "won" calls the same createProject() everything else uses, carrying
// the account forward instead of losing that context at the handoff.

export function useAccounts() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getAccounts(), error: null });
    return supabase.from("accounts").select("*").order("name").then(({ data, error }) => ({
      data: data?.map((a) => ({ id: a.id, name: a.name, domain: a.domain, notes: a.notes })), error,
    }));
  });
}
export async function createAccount({ name, domain = null, notes = null }) {
  if (!supabase) return { data: local.localCreateAccount({ name, domain, notes }), error: null };
  return supabase.from("accounts").insert({ name, domain, notes }).select().single();
}
export async function updateAccount(id, patch) {
  if (!supabase) { local.localUpdateAccount(id, patch); return { error: null }; }
  return supabase.from("accounts").update(patch).eq("id", id);
}

export function useContacts(accountId) {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getContacts(accountId), error: null });
    let q = supabase.from("contacts").select("*").order("name");
    if (accountId) q = q.eq("account_id", accountId);
    return q.then(({ data, error }) => ({
      data: data?.map((c) => ({ id: c.id, accountId: c.account_id, name: c.name, email: c.email, phone: c.phone, title: c.title, roleLabel: c.role_label })),
      error,
    }));
  }, [accountId]);
}
export async function createContact({ accountId = null, name, email = null, phone = null, title = null, roleLabel = null }) {
  if (!supabase) return { data: local.localCreateContact({ accountId, name, email, phone, title, roleLabel }), error: null };
  return supabase.from("contacts").insert({ account_id: accountId, name, email, phone, title, role_label: roleLabel }).select().single();
}
export async function updateContact(id, patch) {
  if (!supabase) { local.localUpdateContact(id, patch); return { error: null }; }
  const dbPatch = {};
  if ("accountId" in patch) dbPatch.account_id = patch.accountId;
  for (const k of ["name", "email", "phone", "title"]) if (k in patch) dbPatch[k] = patch[k];
  if ("roleLabel" in patch) dbPatch.role_label = patch.roleLabel;
  return supabase.from("contacts").update(dbPatch).eq("id", id);
}

function mapOpportunityRow(o) {
  return {
    id: o.id, name: o.name, accountId: o.accountId ?? o.account_id, primaryContactId: o.primaryContactId ?? o.primary_contact_id,
    type: o.type, stage: o.stage, amount: o.amount, owner: o.owner,
    closeDate: o.closeDate ?? o.close_date, notes: o.notes, createdAt: o.createdAt ?? o.created_at,
  };
}
export function useOpportunities() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getOpportunities().map(mapOpportunityRow), error: null });
    return supabase.from("opportunities").select("*").order("created_at", { ascending: false }).then(({ data, error }) => ({
      data: data?.map(mapOpportunityRow), error,
    }));
  });
}
export async function createOpportunity({ name, accountId = null, primaryContactId = null, type = "new_client", stage = "lead", amount = null, owner = null, closeDate = null, notes = null }) {
  if (!supabase) return { data: mapOpportunityRow(local.localCreateOpportunity({ name, accountId, primaryContactId, type, stage, amount, owner, closeDate, notes })), error: null };
  return supabase.from("opportunities").insert({
    name, account_id: accountId, primary_contact_id: primaryContactId, type, stage, amount, owner, close_date: closeDate, notes,
  }).select().single();
}

/** Updates an opportunity; moving `stage` to "won" fires the CRM→delivery
 *  bridge — a linked project is created carrying the account forward, via
 *  the same createProject() every other project-creation path uses. */
export async function updateOpportunity(id, patch) {
  if (!supabase) {
    const { opportunity, createdProject } = local.localUpdateOpportunity(id, patch);
    return { data: { opportunity: mapOpportunityRow(opportunity), createdProject }, error: null };
  }
  const { data: existing, error: fetchErr } = await supabase.from("opportunities").select("*").eq("id", id).single();
  if (fetchErr) return { error: fetchErr };
  const wasOpen = existing.stage !== "won" && existing.stage !== "lost";

  const dbPatch = {};
  if ("accountId" in patch) dbPatch.account_id = patch.accountId;
  if ("primaryContactId" in patch) dbPatch.primary_contact_id = patch.primaryContactId;
  if ("closeDate" in patch) dbPatch.close_date = patch.closeDate;
  for (const k of ["name", "type", "stage", "amount", "owner", "notes"]) if (k in patch) dbPatch[k] = patch[k];
  const { data: updated, error: updateErr } = await supabase.from("opportunities").update(dbPatch).eq("id", id).select().single();
  if (updateErr) return { error: updateErr };

  let createdProject = null;
  if (wasOpen && patch.stage === "won") {
    let accountName = null;
    if (existing.account_id) {
      const { data: acct } = await supabase.from("accounts").select("name").eq("id", existing.account_id).single();
      accountName = acct?.name ?? null;
    }
    const { data: proj } = await createProject({
      name: existing.name, client: accountName, accountId: existing.account_id, opportunityId: id,
    });
    createdProject = proj ?? null;
  }
  return { data: { opportunity: mapOpportunityRow(updated), createdProject }, error: null };
}

// ─── CURRENT SPRINT ─────────────────────────────────────────────────────────

export function useCurrentSprint() {
  return useSupabaseQuery(async () => {
    if (!supabase) return { data: local.getCurrentSprint(), error: null };
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
  if (!supabase) { local.localAddTaskToSprint(sprintId, taskId, opts); return { error: null }; }
  return supabase.from("sprint_items").insert({ sprint_id: sprintId, task_id: taskId, status: opts.status ?? "todo", points: opts.points ?? null });
}

export async function updateSprintItem(sprintItemId, patch) {
  if (!supabase) { local.localUpdateSprintItem(sprintItemId, patch); return { error: null }; }
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
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getReleases(), error: null });
    return supabase.from("releases").select("*").then(({ data, error }) => ({ data: data?.map(mapReleaseRow), error }));
  });
}

export async function updateRelease(id, patch) {
  if (!supabase) {
    const localPatch = {};
    if ("readiness" in patch) localPatch.readiness = patch.readiness;
    if ("qaStatus" in patch) localPatch.qaStatus = patch.qaStatus;
    if ("status" in patch) localPatch.status = patch.status;
    if ("deployChecklist" in patch) localPatch.deployChecklist = patch.deployChecklist;
    local.localUpdateRelease(id, localPatch);
    return { error: null };
  }
  const dbPatch = {};
  if ("readiness" in patch) dbPatch.readiness = patch.readiness;
  if ("qaStatus" in patch) dbPatch.qa_status = patch.qaStatus;
  if ("status" in patch) dbPatch.status = patch.status;
  if ("deployChecklist" in patch) dbPatch.deploy_checklist = patch.deployChecklist;
  return supabase.from("releases").update(dbPatch).eq("id", id);
}

// ─── BUG TREND ──────────────────────────────────────────────────────────────

export function useBugTrend() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getBugTrend(), error: null });
    return supabase.from("bug_trend").select("*").order("week").then(({ data, error }) => ({
      data: data?.map((r) => ({ week: r.week, opened: r.opened, resolved: r.resolved })),
      error,
    }));
  });
}

// ─── TEAM CAPACITY ──────────────────────────────────────────────────────────

export function useTeamCapacity() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getTeamCapacity(), error: null });
    return supabase.from("team_capacity").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ team: r.team_label, capacity: r.capacity, load: r.load, members: r.members, blocked: r.blocked })),
      error,
    }));
  });
}

// ─── HEALTH MATRIX ──────────────────────────────────────────────────────────

export function useHealthMatrix() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getHealthMatrix(), error: null });
    return supabase.from("health_matrix").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ area: r.area, status: r.status })),
      error,
    }));
  });
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
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getBlockers(), error: null });
    return supabase.from("blockers").select("*").then(({ data, error }) => ({ data: data?.map(mapBlockerRow), error }));
  });
}

export async function resolveBlocker(id) {
  if (!supabase) { local.localResolveBlocker(id); return { error: null }; }
  return supabase.from("blockers").update({ status: "resolved" }).eq("id", id);
}

export async function createBlocker({ project = null, title, owner = null, impact = "medium", dueDate = null }) {
  if (!supabase) return { data: local.localCreateBlocker({ project, title, owner, impact, dueDate }), error: null };
  return supabase.from("blockers").insert({
    id: slugify(`blk-${title}-${Date.now()}`), project, title, owner_label: owner, impact, due_date: dueDate, days_open: 0, status: "open", escalated: false,
  }).select().single();
}

// ─── RISKS ──────────────────────────────────────────────────────────────────

export function useRisks() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getRisks(), error: null });
    return supabase.from("risks").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ id: r.id, project: r.project ?? null, title: r.title, probability: r.probability, impact: r.impact, owner: r.owner_label, mitigation: r.mitigation, mitigated: r.mitigated })),
      error,
    }));
  });
}

export async function setRiskMitigated(id, mitigated) {
  if (!supabase) { local.localSetRiskMitigated(id, mitigated); return { error: null }; }
  return supabase.from("risks").update({ mitigated }).eq("id", id);
}

export async function createRisk({ project = null, title, probability = "medium", impact = "medium", owner = null, mitigation = null }) {
  if (!supabase) return { data: local.localCreateRisk({ project, title, probability, impact, owner, mitigation }), error: null };
  return supabase.from("risks").insert({
    id: slugify(`risk-${title}-${Date.now()}`), project, title, probability, impact, owner_label: owner, mitigation, mitigated: false,
  }).select().single();
}

// ─── DECISIONS ──────────────────────────────────────────────────────────────

export function useDecisions() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getDecisions(), error: null });
    return supabase.from("decisions").select("*").eq("closed", false).then(({ data, error }) => ({
      data: data?.map((r) => ({ id: r.id, project: r.project ?? null, title: r.title, owner: r.owner_label, impact: r.impact, pendingSince: r.pending_since_days, escalation: r.escalation, dueDate: r.due_date })),
      error,
    }));
  });
}

export async function closeDecision(id) {
  if (!supabase) { local.localCloseDecision(id); return { error: null }; }
  return supabase.from("decisions").update({ closed: true }).eq("id", id);
}

export async function createDecision({ project = null, title, owner = null, impact = "medium", dueDate = null }) {
  if (!supabase) return { data: local.localCreateDecision({ project, title, owner, impact, dueDate }), error: null };
  return supabase.from("decisions").insert({
    id: slugify(`dec-${title}-${Date.now()}`), project, title, owner_label: owner, impact, due_date: dueDate, pending_since_days: 0, escalation: false, closed: false,
  }).select().single();
}

// ─── BUG RESOLUTION (shared with RisksView "Resolve" buttons) ──────────────

export async function resolveBug(id) {
  return updateTask(id, { status: "resolved" });
}

// ─── CUSTOMER METRICS ───────────────────────────────────────────────────────

export function useCustomerMetrics() {
  return useSupabaseQuery(async () => {
    if (!supabase) return { data: local.getCustomerMetrics(), error: null };
    const [{ data: metrics, error: mErr }, { data: accounts, error: aErr }] = await Promise.all([
      // organization_id is now the PK (one row per org) — RLS already scopes
      // this to the current org, so no explicit filter is needed or possible.
      supabase.from("customer_metrics").select("*").maybeSingle(),
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
  if (!supabase) { local.localUpdateCustomerMetrics(patch); return { error: null }; }
  const dbPatch = {};
  if ("openTickets" in patch) dbPatch.open_tickets = patch.openTickets;
  if ("criticalIssues" in patch) dbPatch.critical_issues = patch.criticalIssues;
  if ("slaBreaches" in patch) dbPatch.sla_breaches = patch.slaBreaches;
  if ("featureRequests" in patch) dbPatch.feature_requests = patch.featureRequests;
  if ("highRiskAccounts" in patch) dbPatch.high_risk_accounts = patch.highRiskAccounts;
  if ("csat" in patch) dbPatch.csat = patch.csat;
  // no .eq() needed: RLS's write policy already restricts this to the
  // current org's single row (organization_id is the PK).
  return supabase.from("customer_metrics").update(dbPatch);
}

export async function updateCustomerAccount(name, patch) {
  if (!supabase) { local.localUpdateCustomerAccount(name, patch); return { error: null }; }
  return supabase.from("customer_accounts").update(patch).eq("name", name);
}

// ─── PRODUCT USAGE ──────────────────────────────────────────────────────────

export function useProductUsage() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getProductUsage(), error: null });
    return supabase.from("product_usage").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ feature: r.feature, released: r.released, adoption: r.adoption, target: r.target, trend: r.trend, dau: r.dau })),
      error,
    }));
  });
}

export async function updateProductUsage(feature, patch) {
  if (!supabase) { local.localUpdateProductUsage(feature, patch); return { error: null }; }
  return supabase.from("product_usage").update(patch).eq("feature", feature);
}

// ─── BUSINESS METRICS ───────────────────────────────────────────────────────

export function useBusinessMetrics() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getBusinessMetrics(), error: null });
    // organization_id is now the PK (one row per org) — RLS already scopes this.
    return supabase.from("business_metrics").select("*").maybeSingle().then(({ data, error }) => ({
      data: data ? {
        arr: data.arr, mrr: data.mrr, mrrGrowth: data.mrr_growth, churn: data.churn,
        newCustomers: data.new_customers, trialToPaid: data.trial_to_paid,
        renewalRisk: data.renewal_risk, nps: data.nps,
      } : null,
      error,
    }));
  });
}

export async function updateBusinessMetrics(patch) {
  if (!supabase) { local.localUpdateBusinessMetrics(patch); return { error: null }; }
  const dbPatch = {};
  if ("arr" in patch) dbPatch.arr = patch.arr;
  if ("mrr" in patch) dbPatch.mrr = patch.mrr;
  if ("mrrGrowth" in patch) dbPatch.mrr_growth = patch.mrrGrowth;
  if ("churn" in patch) dbPatch.churn = patch.churn;
  if ("newCustomers" in patch) dbPatch.new_customers = patch.newCustomers;
  if ("trialToPaid" in patch) dbPatch.trial_to_paid = patch.trialToPaid;
  if ("renewalRisk" in patch) dbPatch.renewal_risk = patch.renewalRisk;
  if ("nps" in patch) dbPatch.nps = patch.nps;
  // no .eq() needed: RLS's write policy already restricts this to the
  // current org's single row (organization_id is the PK).
  return supabase.from("business_metrics").update(dbPatch);
}

// ─── BUDGET ─────────────────────────────────────────────────────────────────

export function useBudget() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getBudget(), error: null });
    return supabase.from("budget").select("*").then(({ data, error }) => ({
      data: data?.map((r) => ({ team: r.team, planned: r.planned, actual: r.actual })),
      error,
    }));
  });
}

export async function updateBudget(team, patch) {
  if (!supabase) { local.localUpdateBudget(team, patch); return { error: null }; }
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

/** Invites someone into an org: creates a real Supabase Auth account (via
 *  Supabase's invite-email flow) if they don't have one yet, plus a profile
 *  + organization_members row. Requires the `invite-org-member` Edge
 *  Function (supabase/functions/invite-org-member) — admin user creation
 *  needs the service-role key, which must never reach the browser. */
export async function inviteTeamMember({ name, email, role, organizationId }) {
  if (!supabase) return { error: { message: "Supabase not configured" } };
  return supabase.functions.invoke("invite-org-member", { body: { name, email, role, organizationId } });
}

// ─── TASK-LEVEL FEATURES: comments, tags, checklist ────────────────────────

export function useTaskComments(taskId) {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getTaskComments(taskId), error: null });
    return supabase.from("task_comments").select("*, profiles(name)").eq("task_id", taskId).order("created_at").then(({ data, error }) => ({
      data: data?.map((c) => ({ id: c.id, body: c.body, author: c.profiles?.name ?? "Unknown", createdAt: c.created_at })),
      error,
    }));
  }, [taskId]);
}

/** In local mode, `authorId` is the display name (see TaskDetailExtras/OperationsView's currentProfile fallback). */
export async function addTaskComment(taskId, authorId, body) {
  if (!supabase) { local.localAddTaskComment(taskId, authorId, body); return { error: null }; }
  return supabase.from("task_comments").insert({ task_id: taskId, author_id: authorId, body });
}

export function useTags() {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getTags(), error: null });
    return supabase.from("tags").select("*").order("name").then(({ data, error }) => ({
      data: data?.map((t) => ({ id: t.id, name: t.name, color: t.color })),
      error,
    }));
  });
}

export function useTaskTags(taskId) {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getTaskTags(taskId), error: null });
    return supabase.from("task_tags").select("tags(id, name, color)").eq("task_id", taskId).then(({ data, error }) => ({
      data: data?.map((r) => r.tags).filter(Boolean),
      error,
    }));
  }, [taskId]);
}

export async function createTag(name, color) {
  if (!supabase) return { data: local.localCreateTag(name, color), error: null };
  return supabase.from("tags").insert({ name, color }).select().single();
}

export async function addTagToTask(taskId, tagId) {
  if (!supabase) { local.localAddTagToTask(taskId, tagId); return { error: null }; }
  return supabase.from("task_tags").insert({ task_id: taskId, tag_id: tagId });
}

export async function removeTagFromTask(taskId, tagId) {
  if (!supabase) { local.localRemoveTagFromTask(taskId, tagId); return { error: null }; }
  return supabase.from("task_tags").delete().eq("task_id", taskId).eq("tag_id", tagId);
}

export function useChecklist(taskId) {
  return useSupabaseQuery(() => {
    if (!supabase) return Promise.resolve({ data: local.getChecklist(taskId), error: null });
    return supabase.from("task_checklist_items").select("*").eq("task_id", taskId).order("sort_order").then(({ data, error }) => ({
      data: data?.map((i) => ({ id: i.id, label: i.label, done: i.done, sortOrder: i.sort_order })),
      error,
    }));
  }, [taskId]);
}

export async function addChecklistItem(taskId, label, sortOrder) {
  if (!supabase) { local.localAddChecklistItem(taskId, label, sortOrder); return { error: null }; }
  return supabase.from("task_checklist_items").insert({ task_id: taskId, label, sort_order: sortOrder });
}

export async function toggleChecklistItem(id, done) {
  if (!supabase) { local.localToggleChecklistItem(id, done); return { error: null }; }
  return supabase.from("task_checklist_items").update({ done }).eq("id", id);
}

export async function deleteChecklistItem(id) {
  if (!supabase) { local.localDeleteChecklistItem(id); return { error: null }; }
  return supabase.from("task_checklist_items").delete().eq("id", id);
}

// ─── SPACES / FOLDERS / LISTS (ClickUp-style navigation) ───────────────────

export function useSpacesTree() {
  return useSupabaseQuery(async () => {
    if (!supabase) return { data: local.getSpacesTree(), error: null };
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
  if (!supabase) return { data: local.localCreateSpace(name), error: null };
  return supabase.from("spaces").insert({ name }).select().single();
}

export async function createFolder(spaceId, name) {
  if (!supabase) return { data: local.localCreateFolder(spaceId, name), error: null };
  return supabase.from("folders").insert({ space_id: spaceId, name }).select().single();
}

export async function createList(name, { spaceId, folderId }) {
  if (!supabase) return { data: local.localCreateList(name, { spaceId, folderId }), error: null };
  return supabase.from("lists").insert({ name, space_id: spaceId ?? null, folder_id: folderId ?? null }).select().single();
}

export async function assignTaskToList(taskId, listId) {
  if (!supabase) { local.localAssignTaskToList(taskId, listId); return { error: null }; }
  return supabase.from("tasks").update({ list_id: listId }).eq("id", taskId);
}
