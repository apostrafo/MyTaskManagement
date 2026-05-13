import { createBrowserClient } from "@supabase/ssr";

type SupabaseEnvVar = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function ensureEnv(name: SupabaseEnvVar) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient(ensureEnv("NEXT_PUBLIC_SUPABASE_URL"), ensureEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
