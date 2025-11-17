import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginCard } from "@/components/auth/login-card";

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.4),_transparent_50%)]" />
      <div className="relative flex w-full flex-col items-center gap-6 px-6 py-16">
        <div className="text-center text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">Strategic execution OS</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Welcome to Priority Matrix Cloud</h1>
          <p className="mt-2 text-base text-indigo-100">
            Consolidate tasks, projects, and Eisenhower matrix insights in a single, secure workspace.
          </p>
        </div>

        <LoginCard />
      </div>
    </main>
  );
}
