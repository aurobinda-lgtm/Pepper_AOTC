// Shared by ask-pepper and project-brief: verify the caller is signed in and
// an active member of the org they're asking about, before any org data
// (or an LLM call paid for by the org) is touched. Same JWT-check pattern
// invite-org-member already established.

import { createClient } from "npm:@supabase/supabase-js@2";

export function getClients(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(supabaseUrl, serviceKey);
  return { caller, admin };
}

export async function requireOrgMember(
  caller: ReturnType<typeof createClient>,
  admin: ReturnType<typeof createClient>,
  organizationId: string,
) {
  const { data: callerAuth } = await caller.auth.getUser();
  if (!callerAuth?.user) return { ok: false as const, status: 401, error: "Not signed in" };

  const { data: membership } = await admin
    .from("organization_members")
    .select("active")
    .eq("organization_id", organizationId)
    .eq("profile_id", callerAuth.user.id)
    .maybeSingle();
  if (!membership?.active) return { ok: false as const, status: 403, error: "Not a member of this workspace" };

  return { ok: true as const, profileId: callerAuth.user.id };
}

/** Thin wrapper around the Anthropic Messages API. Model is overridable via
 *  the ANTHROPIC_MODEL secret; defaults to Haiku since these are short,
 *  grounded, high-volume calls, not open-ended reasoning. */
export async function callClaude(system: string, userMessage: string, maxTokens = 1024) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — run `supabase secrets set ANTHROPIC_API_KEY=...`");
  const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}
