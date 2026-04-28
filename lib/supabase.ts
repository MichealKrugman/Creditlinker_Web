import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
  );
}

/**
 * Browser-safe Supabase client.
 * Uses the anon key — safe to expose publicly.
 * RLS policies + verify_jwt on Edge Functions are the real security layer.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,       // stores session in localStorage
    autoRefreshToken: true,     // refreshes JWT before it expires
    detectSessionInUrl: true,   // handles OAuth redirects
  },
});
