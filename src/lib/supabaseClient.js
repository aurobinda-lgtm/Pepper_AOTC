import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Missing env vars shouldn't crash the whole app at import time (e.g. before
// Phase 1 setup is done) — callers should treat a null client as "not configured".
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const SUPABASE_CONFIGURED = Boolean(supabase);
