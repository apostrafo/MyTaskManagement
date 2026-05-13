import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

export default async function Home() {
  if (AUTH_DISABLED) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  redirect(session ? "/dashboard" : "/login");
}
