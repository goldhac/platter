import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** RLS-scoped browser client for client components (the caller's session). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
