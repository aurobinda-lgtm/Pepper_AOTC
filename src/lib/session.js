import { supabase } from "./supabaseClient.js";

// Access is restricted to Art of Tech's own company domains — the only
// account-creation path today (invite-org-member) is staff-only, so this is
// a safe, correct gate for the current system. If a real client-facing
// sign-in is ever built (clients today only use the local-dev persona
// picker — see AccessGate.jsx), that flow will need to special-case this
// check by org role rather than removing it wholesale.
const ALLOWED_EMAIL_DOMAINS = ["artoftechconsulting.com", "artoftech.in"];

export function isAllowedEmailDomain(email) {
  const domain = email?.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}

/** Sign in with a real Supabase account (Art of Tech company emails only). */
export async function signInWithPassword(email, password) {
  if (!supabase) return { error: { message: "Supabase is not configured yet." } };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Fires immediately with the current session, then on every change. */
export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  supabase.auth.getSession().then(({ data }) => callback(data.session));
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => sub.subscription.unsubscribe();
}

/** The profiles row for the currently signed-in user, or null. Also acts as
 *  a defense-in-depth domain gate on session restore (page refresh) — not
 *  just at the login form — so a disallowed account can never stay signed
 *  in via a cached session. */
export async function getProfile() {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;
  if (!isAllowedEmailDomain(auth.user.email)) {
    await supabase.auth.signOut();
    return null;
  }
  const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  if (error) return null;
  return data;
}
