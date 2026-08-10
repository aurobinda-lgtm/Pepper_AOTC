import { supabase } from "./supabaseClient.js";

/** Sign in one of the 7 write-users with a real Supabase account. */
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

/** The profiles row for the currently signed-in user, or null. */
export async function getProfile() {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  if (error) return null;
  return data;
}
