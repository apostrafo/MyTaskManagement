"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuadrantKey } from "@/types/task";

const taskSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).nullable().optional(),
  due_date: z.string().nullable().optional(),
  is_urgent: z.boolean(),
  is_important: z.boolean(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["backlog", "in_progress", "blocked", "done"]),
  project_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(32)).max(6).optional(),
});

const statusSchema = z.enum(["backlog", "in_progress", "blocked", "done"]);
const idSchema = z.string().uuid();

export type CreateTaskInput = z.infer<typeof taskSchema>;

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

const ensureDemoContext = () => {
  const userId = process.env.DEMO_USER_ID;
  const workspaceId = process.env.DEMO_WORKSPACE_ID;
  if (!userId || !workspaceId) {
    throw new Error("Demo mode requires DEMO_USER_ID and DEMO_WORKSPACE_ID env vars.");
  }
  return {
    userId,
    workspaceId,
  };
};

async function getActiveWorkspaceId(userId: string) {
  if (AUTH_DISABLED) {
    return ensureDemoContext().workspaceId;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw new Error(error.message);

  if (data?.workspace_id) return data.workspace_id;

  const { data: fallbackWorkspaceId, error: rpcError } = await supabase.rpc("ensure_personal_workspace");
  if (rpcError) throw new Error(rpcError.message);

  return fallbackWorkspaceId as string;
}

export async function createTaskAction(payload: CreateTaskInput) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const isDemo = AUTH_DISABLED && !user;

  if ((userError || !user) && !isDemo) {
    return { success: false, error: "You need to be signed in." };
  }

  const parsed = taskSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Validation failed." };
  }

  try {
    if (isDemo) {
      const admin = createSupabaseAdminClient();
      const { userId, workspaceId } = ensureDemoContext();
      const insertPayload = {
        ...parsed.data,
        project_id: parsed.data.project_id ?? null,
        due_date: parsed.data.due_date ?? null,
        tags: parsed.data.tags ?? [],
        workspace_id: workspaceId,
        created_by: userId,
        assignee_id: userId,
      };
      const { error } = await admin.from("tasks").insert(insertPayload);
      if (error) throw new Error(error.message);
    } else if (user) {
      const workspaceId = await getActiveWorkspaceId(user.id);
      const insertPayload = {
        ...parsed.data,
        project_id: parsed.data.project_id ?? null,
        due_date: parsed.data.due_date ?? null,
        tags: parsed.data.tags ?? [],
        workspace_id: workspaceId,
        created_by: user.id,
        assignee_id: user.id,
      };
      const { error } = await supabase.from("tasks").insert(insertPayload);
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Unable to create task." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: z.infer<typeof statusSchema>) {
  const supabase = createSupabaseServerClient();
  const idParse = idSchema.safeParse(taskId);
  const statusParse = statusSchema.safeParse(status);

  if (!idParse.success || !statusParse.success) {
    return { success: false, error: "Invalid payload." };
  }

  const client = AUTH_DISABLED ? createSupabaseAdminClient() : supabase;

  const { error } = await client.from("tasks").update({ status: statusParse.data }).eq("id", idParse.data);
  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveTaskToQuadrantAction(taskId: string, quadrant: QuadrantKey) {
  const supabase = createSupabaseServerClient();
  const idParse = idSchema.safeParse(taskId);
  if (!idParse.success) {
    return { success: false, error: "Invalid task id." };
  }

  const quadrantMap: Record<QuadrantKey, { is_urgent: boolean; is_important: boolean }> = {
    focus: { is_important: true, is_urgent: true },
    schedule: { is_important: true, is_urgent: false },
    delegate: { is_important: false, is_urgent: true },
    eliminate: { is_important: false, is_urgent: false },
  };

  const client = AUTH_DISABLED ? createSupabaseAdminClient() : supabase;

  const { error } = await client.from("tasks").update(quadrantMap[quadrant]).eq("id", idParse.data);
  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const supabase = createSupabaseServerClient();
  const idParse = idSchema.safeParse(taskId);
  if (!idParse.success) {
    return { success: false, error: "Invalid task id." };
  }

  const client = AUTH_DISABLED ? createSupabaseAdminClient() : supabase;

  const { error } = await client.from("tasks").delete().eq("id", idParse.data);
  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function signOutAction() {
  if (AUTH_DISABLED) {
    revalidatePath("/");
    return { success: true };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
