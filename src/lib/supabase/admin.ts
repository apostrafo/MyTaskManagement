import { createClient } from "@supabase/supabase-js";

type SupabaseEnvVar = "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY";

const ensureEnv = (name: SupabaseEnvVar) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const createSupabaseAdminClient = () => createClient(ensureEnv("NEXT_PUBLIC_SUPABASE_URL"), ensureEnv("SUPABASE_SERVICE_ROLE_KEY"));
