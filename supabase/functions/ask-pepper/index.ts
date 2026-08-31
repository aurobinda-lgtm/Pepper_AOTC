// Contextual search & answers — "ask your workspace a question." No vector
// store: at this data volume, SQL-filtered context stuffed into the prompt
// is real RAG-lite, not a toy (see the Pepper Product Strategy artifact,
// AI layer § Contextual search & answers). Answers only from what's
// actually fetched, and returns exactly which records were considered so
// the UI can show sources — never an answer with no citation trail.
//
// Deploy: supabase functions deploy ask-pepper
// Called via supabase.functions.invoke("ask-pepper", { body: { question, organizationId } })

import { getClients, requireOrgMember, callClaude } from "../_shared/authz.ts";

const SYSTEM_PROMPT = `You are Pepper, an assistant grounded in one company's own workspace data.
Answer ONLY using the JSON context provided in the user message — never invent a project, task, risk, account, or number that isn't in it.
Refer to records by their name, not their id.
If the context doesn't contain enough information to answer, say so plainly rather than guessing.
Keep answers short — 2-4 sentences unless the question genuinely requires a list.`;

Deno.serve(async (req) => {
  try {
    const { question, organizationId } = await req.json();
    if (!question || !organizationId) {
      return new Response(JSON.stringify({ error: "question and organizationId are required" }), { status: 400 });
    }

    const { caller, admin } = getClients(req);
    const authz = await requireOrgMember(caller, admin, organizationId);
    if (!authz.ok) return new Response(JSON.stringify({ error: authz.error }), { status: authz.status });

    // Keyword-filtered task fetch (the "retrieval" half of RAG-lite) plus a
    // fixed baseline of open risk/blocker/pipeline state, so both specific
    // ("what's blocking MUWCI?") and general ("what needs attention?")
    // questions have relevant grounding.
    const keywords = question.toLowerCase().match(/[a-z]{4,}/g)?.slice(0, 8) ?? [];
    let taskQuery = admin.from("tasks").select("id, name, status, priority, target_date, owner_label, projects(name)")
      .eq("organization_id", organizationId).limit(40);
    if (keywords.length) {
      taskQuery = taskQuery.or(
        [...keywords.map((k) => `name.ilike.%${k}%`), "status.eq.delayed", "status.eq.blocked"].join(",")
      );
    } else {
      taskQuery = taskQuery.in("status", ["delayed", "blocked"]);
    }

    const [{ data: projects }, { data: tasks }, { data: risks }, { data: blockers }, { data: accounts }, { data: opportunities }] =
      await Promise.all([
        admin.from("projects").select("id, name, health, client").eq("organization_id", organizationId),
        taskQuery,
        admin.from("risks").select("id, title, project, mitigation, probability, impact").eq("organization_id", organizationId).eq("mitigated", false),
        admin.from("blockers").select("id, title, project, impact, days_open").eq("organization_id", organizationId).eq("status", "open"),
        admin.from("accounts").select("id, name, domain").eq("organization_id", organizationId),
        admin.from("opportunities").select("id, name, stage, amount").eq("organization_id", organizationId).not("stage", "in", "(won,lost)"),
      ]);

    const context = {
      projects: projects ?? [],
      relevantTasks: (tasks ?? []).map((t: any) => ({ ...t, project: t.projects?.name, projects: undefined })),
      openRisks: risks ?? [],
      openBlockers: blockers ?? [],
      accounts: accounts ?? [],
      openOpportunities: opportunities ?? [],
    };

    const answer = await callClaude(
      SYSTEM_PROMPT,
      `Question: ${question}\n\nWorkspace context (JSON):\n${JSON.stringify(context)}`,
    );

    const sources = [
      ...context.projects.map((p: any) => ({ type: "project", id: p.id, name: p.name })),
      ...context.relevantTasks.map((t: any) => ({ type: "task", id: t.id, name: t.name })),
      ...context.openRisks.map((r: any) => ({ type: "risk", id: r.id, name: r.title })),
      ...context.openBlockers.map((b: any) => ({ type: "blocker", id: b.id, name: b.title })),
      ...context.accounts.map((a: any) => ({ type: "account", id: a.id, name: a.name })),
      ...context.openOpportunities.map((o: any) => ({ type: "opportunity", id: o.id, name: o.name })),
    ];

    return new Response(JSON.stringify({ answer, sources }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
