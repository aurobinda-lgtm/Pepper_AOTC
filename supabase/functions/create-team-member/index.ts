// Supabase Edge Function — creates a real auth account + profile row for a
// new team member. Runs server-side because admin.createUser() needs the
// service-role key, which must never reach the browser bundle.
//
// Deploy: supabase functions deploy create-team-member
// Called from the app via supabase.functions.invoke("create-team-member", { body: {...} })
// The caller's JWT is checked below so only an existing signed-in team
// member (one of the 7 write-access profiles) can invite another.

import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ROLES = ["pm", "cto", "cdo", "delivery"];

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // verify the caller is a signed-in, active team member
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth } = await callerClient.auth.getUser();
    if (!callerAuth?.user) {
      return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await admin.from("profiles").select("active").eq("id", callerAuth.user.id).single();
    if (!callerProfile?.active) {
      return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403 });
    }

    const { name, email, role } = await req.json();
    if (!name || !email || !ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: "name, email, and a valid role are required" }), { status: 400 });
    }

    const password = crypto.randomUUID().slice(0, 12);
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) return new Response(JSON.stringify({ error: createErr.message }), { status: 400 });

    const { error: profileErr } = await admin.from("profiles").insert({ id: created.user.id, name, email, role });
    if (profileErr) return new Response(JSON.stringify({ error: profileErr.message }), { status: 400 });

    return new Response(JSON.stringify({ email, password }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
