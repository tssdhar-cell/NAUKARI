import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | undefined;

/** Server-only Supabase client using the secret key (bypasses RLS). */
export function db() {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_SECRET_KEY } = env();
    client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
