import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MatrixBoard } from "@/components/dashboard/matrix-board";
import { TaskForm } from "@/components/tasks/task-form";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { UserMenu } from "@/components/dashboard/user-menu";
import { TeamSnapshot } from "@/components/dashboard/team-snapshot";
import type { TaskRecord } from "@/types/task";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface WorkspaceMembership {
  role?: string | null;
  workspaces?: {
    id: string;
    name: string;
  } | null;
}

interface WorkspaceMember {
  role?: string | null;
  profiles?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

export default async function DashboardPage() {
  const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";
  const ensureEnv = (name: "DEMO_USER_ID" | "DEMO_WORKSPACE_ID") => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
  };
  const demoContext = AUTH_DISABLED
    ? {
        userId: ensureEnv("DEMO_USER_ID"),
        workspaceId: ensureEnv("DEMO_WORKSPACE_ID"),
        email: process.env.DEMO_USER_EMAIL ?? "demo@mytask.app",
        name: process.env.DEMO_USER_NAME ?? "Demo Workspace",
      }
    : null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!demoContext && !user) {
    redirect("/login");
  }

  const adminClient = AUTH_DISABLED ? createSupabaseAdminClient() : null;

  let workspaceId: string;
  let workspaceName = "Personal workspace";

  if (demoContext) {
    workspaceId = demoContext.workspaceId;
    const { data: workspaceRow } = await adminClient!
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle();
    if (workspaceRow?.name) {
      workspaceName = workspaceRow.name;
    } else {
      workspaceName = "Demo workspace";
    }
  } else {
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("role, workspaces(id,name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });

    const activeWorkspace = (memberships as WorkspaceMembership[] | null)?.[0]?.workspaces;
    workspaceName = activeWorkspace?.name ?? "Personal workspace";
    workspaceId = activeWorkspace?.id ?? user!.id;

    if (!activeWorkspace) {
      const { data: fallbackWorkspaceId } = await supabase.rpc("ensure_personal_workspace");
      workspaceId = (fallbackWorkspaceId as string) ?? user!.id;
      const { data: fallbackWorkspace } = await supabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle();
      if (fallbackWorkspace?.name) {
        workspaceName = fallbackWorkspace.name;
      }
    }
  }

  const fetchClient = demoContext ? adminClient! : supabase;

  const { data: tasksData } = await fetchClient
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  const tasks = (tasksData as TaskRecord[] | null) ?? [];

  const { data: projectsData } = await fetchClient
    .from("projects")
    .select("id,name")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  const projects = projectsData ?? [];

  let members: WorkspaceMember[] = [];
  const { data: membersData } = await fetchClient
    .from("workspace_members")
    .select("role, profiles(id, full_name, email)")
    .eq("workspace_id", workspaceId);
  members = (membersData as WorkspaceMember[] | null) ?? [];

  if (demoContext && members.length === 0) {
    members = [
      {
        role: "owner",
        profiles: {
          id: demoContext.userId,
          full_name: demoContext.name,
          email: demoContext.email,
        },
      },
    ];
  } else if (!demoContext && members.length === 0 && user) {
    members = [
      {
        role: "owner",
        profiles: {
          id: user.id,
          full_name: (user.user_metadata as { full_name?: string })?.full_name ?? user.email,
          email: user.email,
        },
      },
    ];
  }

  const displayName = demoContext?.name ?? (user?.user_metadata as { full_name?: string })?.full_name ?? user?.email ?? "Workspace lead";
  const displayEmail = demoContext?.email ?? user?.email ?? "demo@mytask.app";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Priority Matrix HQ</p>
            <h1 className="mt-2 text-4xl font-semibold text-white">Execution cockpit</h1>
            <p className="text-sm text-indigo-100">Monitor quadrants, unblock owners, and keep the roadmap resilient.</p>
          </div>
          <UserMenu email={displayEmail} name={displayName} />
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <MatrixBoard tasks={tasks} projects={projects} />
          <div className="flex flex-col gap-6">
            <QuickStats tasks={tasks} workspaceName={workspaceName} />
            <TaskForm projects={projects} />
            <TeamSnapshot members={members} />
          </div>
        </div>
      </div>
    </main>
  );
}
