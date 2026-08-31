// Automated status intelligence — compute health facts first (SQL), then
// call the LLM only to narrate those already-computed numbers. Never the
// reverse: every number in the narrative must trace back to `facts` in the
// response, matching the Tableau-Pulse "compute first, narrate second"
// pattern the Pepper Product Strategy artifact calls out as the credible
// approach (vs. an LLM describing a dashboard from memory).
//
// Deploy: supabase functions deploy project-brief
// Called via supabase.functions.invoke("project-brief", { body: { projectId } })

import { getClients, requireOrgMember, callClaude } from "../_shared/authz.ts";

const SYSTEM_PROMPT = `You are Pepper, writing a one-project status brief for a project manager.
You will be given a JSON object of already-computed facts. Do not invent, estimate, or round any
number that isn't in the facts — only narrate what's there. Name the specific contributing factors
(which tasks are overdue/blocked, how many days since activity) rather than being vague. If a
recommended action is obvious from the facts (e.g. reassign a blocked task, follow up on a stale
approval), suggest exactly one. Keep it to 2-4 sentences.`;

Deno.serve(async (req) => {
  try {
    const { projectId } = await req.json();
    if (!projectId) return new Response(JSON.stringify({ error: "projectId is required" }), { status: 400 });

    const { caller, admin } = getClients(req);
    const { data: callerAuth } = await caller.auth.getUser();
    if (!callerAuth?.user) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });

    const { data: project, error: projErr } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();
    if (projErr || !project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });

    const authz = await requireOrgMember(caller, admin, project.organization_id);
    if (!authz.ok) return new Response(JSON.stringify({ error: authz.error }), { status: authz.status });

    const [{ data: tasks }, { data: blockers }, { data: risks }] = await Promise.all([
      admin.from("tasks").select("status, target_date, updated_at").eq("project_id", projectId),
      admin.from("blockers").select("title").eq("organization_id", project.organization_id).eq("project", project.name).eq("status", "open"),
      admin.from("risks").select("title").eq("organization_id", project.organization_id).eq("project", project.name).eq("mitigated", false),
    ]);

    const rows = tasks ?? [];
    const total = rows.length;
    const done = rows.filter((t) => t.status === "completed" || t.status === "resolved").length;
    const overdue = rows.filter((t) => t.status === "delayed").length;
    const blockedTasks = rows.filter((t) => t.status === "blocked").length;
    const lastActivity = rows.reduce((max, t) => (t.updated_at && t.updated_at > (max ?? "") ? t.updated_at : max), null);
    const daysSinceActivity = lastActivity ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000) : null;

    const facts = {
      project: project.name,
      health: project.health,
      milestone: project.milestone,
      due: project.due,
      totalTasks: total,
      doneTasks: done,
      progressPct: total ? Math.round((done / total) * 100) : 0,
      overdueTasks: overdue,
      blockedTasks,
      daysSinceLastActivity: daysSinceActivity,
      openBlockers: (blockers ?? []).map((b) => b.title),
      openRisks: (risks ?? []).map((r) => r.title),
    };

    const narrative = await callClaude(SYSTEM_PROMPT, `Facts (JSON):\n${JSON.stringify(facts)}`, 400);

    return new Response(JSON.stringify({ narrative, facts }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
