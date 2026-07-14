import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars aren't set yet (e.g. first run before Supabase setup),
// `supabase` will be null and the app quietly falls back to the
// built-in sample articles instead of crashing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);
