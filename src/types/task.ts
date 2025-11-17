export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type Status = "backlog" | "in_progress" | "blocked" | "done";

export type QuadrantKey = "focus" | "schedule" | "delegate" | "eliminate";

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_urgent: boolean;
  is_important: boolean;
  priority: PriorityLevel;
  status: Status;
  assignee_id: string | null;
  created_by: string;
  workspace_id: string;
  project_id: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const quadrantConfig: Record<
  QuadrantKey,
  { title: string; subtitle: string; accent: string; gradient: string; urgent: boolean; important: boolean }
> = {
  focus: {
    title: "Do Now",
    subtitle: "Critical & urgent deliverables",
    accent: "text-red-500",
    gradient: "from-rose-100 via-amber-50 to-white",
    urgent: true,
    important: true,
  },
  schedule: {
    title: "Schedule",
    subtitle: "Strategic & important work",
    accent: "text-indigo-500",
    gradient: "from-indigo-50 via-slate-50 to-white",
    urgent: false,
    important: true,
  },
  delegate: {
    title: "Delegate",
    subtitle: "Time-sensitive but tactical",
    accent: "text-amber-500",
    gradient: "from-amber-50 via-emerald-50 to-white",
    urgent: true,
    important: false,
  },
  eliminate: {
    title: "Park / Eliminate",
    subtitle: "Low ROI, minimize distractions",
    accent: "text-slate-400",
    gradient: "from-slate-50 via-white to-white",
    urgent: false,
    important: false,
  },
};

export const resolveQuadrantKey = (task: Pick<TaskRecord, "is_important" | "is_urgent">): QuadrantKey => {
  if (task.is_important && task.is_urgent) return "focus";
  if (task.is_important && !task.is_urgent) return "schedule";
  if (!task.is_important && task.is_urgent) return "delegate";
  return "eliminate";
};
