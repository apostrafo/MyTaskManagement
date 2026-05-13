import type { TaskRecord } from "@/types/task";
import { resolveQuadrantKey } from "@/types/task";
import { formatDistanceToNow } from "date-fns";

interface QuickStatsProps {
  tasks: TaskRecord[];
  workspaceName: string;
}

export function QuickStats({ tasks, workspaceName }: QuickStatsProps) {
  const focusCount = tasks.filter((task) => resolveQuadrantKey(task) === "focus" && task.status !== "done").length;
  const doneThisWeek = tasks.filter((task) => {
    if (!task.updated_at || task.status !== "done") return false;
    const updated = new Date(task.updated_at);
    const now = new Date();
    const diff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const upcoming = tasks
    .filter((task) => task.due_date && new Date(task.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date ?? 0).getTime() - new Date(b.due_date ?? 0).getTime())
    .slice(0, 1)
    .at(0);

  const stats = [
    { label: "Focus tasks", value: focusCount, caption: "Need immediate attention" },
    { label: "Shipped this week", value: doneThisWeek, caption: "Finished tasks" },
    { label: "Blocked", value: blocked, caption: "Require escalation" },
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Workspace pulse</p>
        <h2 className="text-2xl font-semibold text-zinc-900">{workspaceName}</h2>
        <p className="text-sm text-zinc-500">Realtime view of your Eisenhower matrix health</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-100 bg-slate-50/80 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.caption}</p>
          </div>
        ))}
      </div>

      {upcoming ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-600">Next checkpoint</p>
          <p className="mt-2 text-base font-semibold text-indigo-900">{upcoming.title}</p>
          <p className="text-sm text-indigo-700">
            Due {formatDistanceToNow(new Date(upcoming.due_date ?? ""), { addSuffix: true })} ·{" "}
            {resolveQuadrantKey(upcoming).toUpperCase()}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
          No upcoming deadlines scheduled.
        </div>
      )}
    </section>
  );
}
