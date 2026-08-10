#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// One-off migration: loads today's pm_seed.js snapshot (already resynced
// from ClickUp) into the real Supabase database, and creates the 7
// write-access accounts (Aurobinda, Indranil, Jeetendra, Caryn, Mahesh,
// Jyoti, Tripti).
//
// Run once, after applying supabase/migrations/0001_init.sql:
//   1. Add SUPABASE_SERVICE_ROLE_KEY=... to .env.local (Project Settings →
//      API → service_role key). Never commit it — it bypasses RLS entirely.
//      It's safe to keep alongside the VITE_ vars: Vite only ever exposes
//      VITE_-prefixed variables to the browser bundle.
//   2. node --env-file=.env.local scripts/migrate-to-supabase.mjs
//
// Safe-ish to re-run: tables with natural (text) primary keys are upserted;
// tables with generated uuids (tasks, sprint, team_capacity) are only ever
// inserted, so re-running will duplicate those — this is meant to run once.
// ─────────────────────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  FEATURES, CURRENT_SPRINT, RELEASES, BUGS, BUG_TREND,
  TEAM_CAPACITY, HEALTH_MATRIX, BLOCKERS, RISKS, DECISIONS,
  CUSTOMER_METRICS, PRODUCT_USAGE, BUSINESS_METRICS, BUDGET,
} from "../src/data/pm_seed.js";
import { USERS } from "../src/data/users.js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Add both to .env.local, then run:\n  node --env-file=.env.local scripts/migrate-to-supabase.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const genPassword = () => randomBytes(9).toString("base64url"); // 12-char url-safe temp password

async function upsert(table, rows, onConflict = "id") {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${rows.length} row(s)`);
}

async function insert(table, rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${data.length} row(s)`);
  return data;
}

async function main() {
  // ── projects ──
  const projectNames = new Set([...FEATURES.map((f) => f.project), ...BUGS.map((b) => b.project)]);
  const projectSlug = new Map([...projectNames].map((name) => [name, slugify(name)]));
  await upsert("projects", [...projectNames].map((name) => ({ id: projectSlug.get(name), name })));

  // ── tasks: FEATURES (type=feature) + BUGS (type=bug) ──
  const featureRows = FEATURES.map((f) => ({
    clickup_id: f.clickupId ?? null,
    project_id: projectSlug.get(f.project) ?? null,
    type: "feature",
    name: f.name,
    status: f.status,
    owner_label: f.owner ?? null,
    target_date: f.targetDate ?? null,
    priority: f.priority ?? null,
    health: f.health ?? "yellow",
    risk_note: f.risk || null,
    blocked: !!f.blocked,
  }));
  const bugRows = BUGS.map((b) => ({
    clickup_id: b.id, // BUGS' pm_seed `id` IS its ClickUp task id
    project_id: projectSlug.get(b.project) ?? null,
    type: "bug",
    name: b.title,
    status: b.status,
    owner_label: b.assignee ?? null,
    priority: b.priority ?? null,
    health: "yellow",
    opened_days: b.openedDays ?? null,
  }));
  const insertedTasks = await insert("tasks", [...featureRows, ...bugRows]);
  const taskIdByClickupId = new Map(insertedTasks.filter((t) => t.clickup_id).map((t) => [t.clickup_id, t.id]));

  // ── sprint + sprint_items ──
  const [sprintRow] = await insert("sprints", [{
    name: CURRENT_SPRINT.name, start_date: CURRENT_SPRINT.startDate, end_date: CURRENT_SPRINT.endDate, velocity: CURRENT_SPRINT.velocity,
  }]);
  const sprintItemRows = [];
  for (const [i, item] of CURRENT_SPRINT.items.entries()) {
    let taskId = taskIdByClickupId.get(item.id);
    if (!taskId) {
      // sprint item has no matching feature/bug row — create a lightweight task for it
      const [chore] = await insert("tasks", [{
        clickup_id: item.id, type: "chore", name: item.title, status: "not_started",
        owner_label: item.assignee, blocked: !!item.blocked,
      }]);
      taskId = chore.id;
      taskIdByClickupId.set(item.id, taskId);
    }
    sprintItemRows.push({ sprint_id: sprintRow.id, task_id: taskId, status: item.status, blocked: !!item.blocked, points: item.points, sort_order: i });
  }
  await insert("sprint_items", sprintItemRows);

  // ── releases / risks / decisions / blockers ──
  // `project`: null = company-wide (PM only); otherwise scopes it to that space for everyone else.
  await upsert("releases", RELEASES.map((r) => ({
    id: r.id, project: r.project ?? null, version: r.version, go_live: r.goLive, readiness: r.readiness, qa_status: r.qaStatus,
    critical_bugs: r.criticalBugs, uat_status: r.uat, rollback: r.rollback, status: r.status,
    features: r.features, deploy_checklist: r.deployChecklist,
  })));
  await upsert("risks", RISKS.map((r) => ({
    id: r.id, project: r.project ?? null, title: r.title, probability: r.probability, impact: r.impact, owner_label: r.owner, mitigation: r.mitigation,
  })));
  await upsert("decisions", DECISIONS.map((d) => ({
    id: d.id, project: d.project ?? null, title: d.title, owner_label: d.owner, impact: d.impact,
    pending_since_days: d.pendingSince, escalation: !!d.escalation, due_date: d.dueDate,
  })));
  await upsert("blockers", BLOCKERS.map((b) => ({
    id: b.id, project: b.project ?? null, title: b.title, owner_label: b.owner, impact: b.impact,
    due_date: b.dueDate, days_open: b.daysOpen, status: b.status, escalated: !!b.escalated,
  })));

  // ── health / bug trend ──
  await upsert("health_matrix", HEALTH_MATRIX.map((h) => ({ area: h.area, status: h.status })), "area");
  await upsert("bug_trend", BUG_TREND.map((w) => ({ week: w.week, opened: w.opened, resolved: w.resolved })), "week");

  // ── business / customer (⚠️ manual fields, just persisted now) ──
  await upsert("customer_metrics", [{
    id: 1, open_tickets: CUSTOMER_METRICS.openTickets, critical_issues: CUSTOMER_METRICS.criticalIssues,
    sla_breaches: CUSTOMER_METRICS.slaBreaches, feature_requests: CUSTOMER_METRICS.featureRequests,
    high_risk_accounts: CUSTOMER_METRICS.highRiskAccounts, csat: CUSTOMER_METRICS.csat,
  }]);
  await upsert("customer_accounts", CUSTOMER_METRICS.accounts.map((a) => ({
    name: a.name, tickets: a.tickets, sla: a.sla, risk: a.risk, mrr: a.mrr,
  })), "name");
  await upsert("product_usage", PRODUCT_USAGE.map((p) => ({
    feature: p.feature, released: p.released, adoption: p.adoption, target: p.target, trend: p.trend, dau: p.dau,
  })), "feature");
  await upsert("business_metrics", [{
    id: 1, arr: BUSINESS_METRICS.arr, mrr: BUSINESS_METRICS.mrr, mrr_growth: BUSINESS_METRICS.mrrGrowth,
    churn: BUSINESS_METRICS.churn, new_customers: BUSINESS_METRICS.newCustomers,
    trial_to_paid: BUSINESS_METRICS.trialToPaid, renewal_risk: BUSINESS_METRICS.renewalRisk, nps: BUSINESS_METRICS.nps,
  }]);
  await upsert("budget", BUDGET.map((b) => ({ team: b.team, planned: b.planned, actual: b.actual })), "team");

  // ── the 7 write-access accounts ──
  const writeUsers = USERS.filter((u) => u.writeAccess);
  const credentials = [];
  const profileRows = [];
  for (const u of writeUsers) {
    const password = genPassword();
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: u.email, password, email_confirm: true,
    });
    if (createErr) throw new Error(`auth.admin.createUser(${u.email}): ${createErr.message}`);
    profileRows.push({ id: created.user.id, name: u.name, email: u.email, role: u.role });
    credentials.push({ name: u.name, email: u.email, password });
  }
  await upsert("profiles", profileRows);

  // ── team_capacity, linked to the new profiles by name where possible ──
  const profileIdByName = new Map(profileRows.map((p) => [p.name, p.id]));
  await insert("team_capacity", TEAM_CAPACITY.map((t) => ({
    profile_id: profileIdByName.get(t.team) ?? null,
    team_label: t.team, capacity: t.capacity, load: t.load, members: t.members, blocked: t.blocked,
  })));

  console.log("\n✅ Migration complete.\n");
  console.log("Temporary passwords — share each with its owner out of band, then have them change it:\n");
  for (const c of credentials) console.log(`  ${c.name.padEnd(20)} ${c.email.padEnd(32)} ${c.password}`);
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
});
