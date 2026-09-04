// Supabase Edge Function — invites someone into an organization: creates a
// real auth account if they don't have one yet (via Supabase's built-in
// invite-email flow, so they set their own password), upserts their
// `profiles` row, and adds an `organization_members` row for the target org.
//
// Replaces create-team-member (single-org, generated-password model) now
// that orgs/organization_members exist — see this repo's Phase 1 plan.
// Runs server-side because admin.* needs the service-role key, which must
// never reach the browser bundle.
//
// Deploy: supabase functions deploy invite-org-member
// Called via supabase.functions.invoke("invite-org-member", { body: {...} })
// The caller's JWT is checked below: only an existing active member with an
// admin-ish role (owner/pm) *in that org* can invite into it.

import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_ROLES = ["owner", "pm"];

// Staff accounts are restricted to Art of Tech's own company domains — kept
// in sync by hand with src/lib/session.js's ALLOWED_EMAIL_DOMAINS (Deno and
// the Vite frontend are separate runtimes, so this can't be a shared
// import). This function is staff-only today (invited via TeamMembersView,
// whose ROLE_OPTIONS is pm/cto/cdo/delivery) — if a client-invite flow is
// ever added, it should call a separate path rather than loosening this.
const ALLOWED_EMAIL_DOMAINS = ["artoftechconsulting.com", "artoftech.in"];
function isAllowedEmailDomain(email: string) {
  const domain = email?.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // verify the caller is signed in
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth } = await callerClient.auth.getUser();
    if (!callerAuth?.user) {
      return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });
    }

    const { name, email, role, organizationId } = await req.json();
    if (!name || !email || !role || !organizationId) {
      return new Response(JSON.stringify({ error: "name, email, role, and organizationId are required" }), { status: 400 });
    }
    if (!isAllowedEmailDomain(email)) {
      return new Response(JSON.stringify({ error: "Only Art of Tech company email addresses can be invited." }), { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // verify the caller has an admin-ish role in *this* org
    const { data: callerMembership } = await admin
      .from("organization_members")
      .select("role, active")
      .eq("organization_id", organizationId)
      .eq("profile_id", callerAuth.user.id)
      .maybeSingle();
    if (!callerMembership?.active || !ADMIN_ROLES.includes(callerMembership.role)) {
      return new Response(JSON.stringify({ error: "Not authorized to invite into this workspace" }), { status: 403 });
    }

    // find or create the auth user for this email
    let userId;
    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) {
      userId = existing.id;
    } else {
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email);
      if (inviteErr) return new Response(JSON.stringify({ error: inviteErr.message }), { status: 400 });
      userId = invited.user.id;
      const { error: profileErr } = await admin.from("profiles").insert({ id: userId, name, email, role });
      if (profileErr) return new Response(JSON.stringify({ error: profileErr.message }), { status: 400 });
    }

    const { error: memberErr } = await admin
      .from("organization_members")
      .upsert({ organization_id: organizationId, profile_id: userId, role, active: true }, { onConflict: "organization_id,profile_id" });
    if (memberErr) return new Response(JSON.stringify({ error: memberErr.message }), { status: 400 });

    return new Response(JSON.stringify({ ok: true, invitedExistingAccount: !!existing }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
