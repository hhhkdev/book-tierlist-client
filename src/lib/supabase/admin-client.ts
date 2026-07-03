import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | undefined;

/**
 * Service-role Supabase client. Bypasses RLS entirely — must only ever be
 * imported from server-only code (this file is `server-only`-guarded so an
 * accidental client-bundle import fails the build instead of leaking the key).
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables are not set. See docs/SUPABASE.md."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}
