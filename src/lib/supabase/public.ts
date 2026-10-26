import "server-only";
import { io } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Stateless public client that runs queries strictly as `anon`, without reading
 * user session cookies. Used for public marketplace projections (`catalog_listings`,
 * `catalog_plan_rates`, `list_catalog_apps`) so user privileges can never leak
 * non-public records into public pages.
 */
export async function createPublicClient() {
  await io();
  const env = getPublicEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      // Anonymous reads do not need Auth initialization or session timers.
      accessToken: async () => null,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
