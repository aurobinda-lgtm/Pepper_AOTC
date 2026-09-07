// Supabase Edge Function — creates a new team member: a real auth account
// with a PM-chosen temporary password (no invite email — the PM relays the
// temp password to the new hire directly), a `profiles` row flagged
// must_reset_password so they're required to set their own password the
// first time they sign in with it, and an `organization_members` row for
// the target org.
//
// Runs server-side because admin.* needs the service-role key, which must
// never reach the browser bundle.
//
// Deploy: supabase functions deploy invite-org-member
// Called via supabase.functions.invoke("invite-org-member", { body: {...} })
// The caller's JWT is checked below: creating a new member is PM-only,
// matching the organization_members_write RLS policy (0005 migration).

import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_ROLES = ["pm"];

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

    const { name, email, role, organizationId, tempPassword } = await req.json();
    if (!name || !email || !role || !organizationId || !tempPassword) {
      return new Response(JSON.stringify({ error: "name, email, role, organizationId, and tempPassword are required" }), { status: 400 });
    }
    if (tempPassword.length < 8) {
      return new Response(JSON.stringify({ error: "Temporary password must be at least 8 characters." }), { status: 400 });
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

    // find or create the auth user for this email. An existing profile (e.g.
    // adding someone already on the team into a second org) is reused as-is —
    // their password is theirs, we don't touch it. A genuinely new person
    // gets a real account created directly with the PM's chosen temporary
    // password (no invite email) and is flagged to set their own on first login.
    let userId;
    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password: tempPassword, email_confirm: true,
      });
      if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400 });
      userId = created.user.id;
      const { error: profileErr } = await admin.from("profiles").insert({ id: userId, name, email, role, must_reset_password: true });
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
