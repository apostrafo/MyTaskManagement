"use client";

import { useTransition } from "react";
import { format, isPast } from "date-fns";
import { Loader2, Clock, Trash2 } from "lucide-react";
import type { TaskRecord, QuadrantKey } from "@/types/task";
import { resolveQuadrantKey } from "@/types/task";
import { cn } from "@/lib/utils";
import { deleteTaskAction, moveTaskToQuadrantAction, updateTaskStatusAction } from "@/app/dashboard/actions";

const statusLabels: Record<TaskRecord["status"], string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

const quadrantLabels: Record<QuadrantKey, string> = {
  focus: "Do now",
  schedule: "Schedule",
  delegate: "Delegate",
  eliminate: "Park",
};

const statusOptions: TaskRecord["status"][] = ["backlog", "in_progress", "blocked", "done"];
const quadrantOptions: QuadrantKey[] = ["focus", "schedule", "delegate", "eliminate"];

interface TaskCardProps {
  task: TaskRecord;
  projectName?: string | null;
}

export function TaskCard({ task, projectName }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const dueLabel = task.due_date ? format(new Date(task.due_date), "MMM d") : null;
  const overdue = task.due_date ? isPast(new Date(task.due_date)) && task.status !== "done" : false;
  const quadrant = resolveQuadrantKey(task);

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          {projectName && <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">{projectName}</p>}
          <h3 className="text-base font-semibold text-zinc-900">{task.title}</h3>
          {task.description && <p className="mt-1 text-xs text-zinc-500 line-clamp-3">{task.description}</p>}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            task.priority === "critical" && "bg-rose-50 text-rose-600",
            task.priority === "high" && "bg-amber-50 text-amber-600",
            task.priority === "medium" && "bg-emerald-50 text-emerald-600",
            task.priority === "low" && "bg-slate-100 text-slate-500",
          )}
        >
          {task.priority}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1">
          <Clock className="h-3.5 w-3.5" />
          {dueLabel ? (
            <span className={cn(overdue && "!text-rose-600 font-semibold")}>{overdue ? `Overdue • ${dueLabel}` : dueLabel}</span>
          ) : (
            <span>No due date</span>
          )}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 capitalize">{quadrantLabels[quadrant]}</div>
        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 capitalize">{statusLabels[task.status]}</div>
      </div>

      <div className="flex flex-col gap-2 text-xs">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</label>
        <select
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition focus:border-indigo-300 focus:outline-none"
          defaultValue={task.status}
          disabled={isPending}
          onChange={(event) => {
            const nextStatus = event.target.value as TaskRecord["status"];
            startTransition(async () => {
              await updateTaskStatusAction(task.id, nextStatus);
            });
          }}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 text-xs">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Quadrant</label>
        <select
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition focus:border-indigo-300 focus:outline-none"
          defaultValue={quadrant}
          disabled={isPending}
          onChange={(event) => {
            const nextQuadrant = event.target.value as QuadrantKey;
            startTransition(async () => {
              await moveTaskToQuadrantAction(task.id, nextQuadrant);
            });
          }}
        >
          {quadrantOptions.map((q) => (
            <option key={q} value={q}>
              {quadrantLabels[q]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteTaskAction(task.id);
          })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Remove task
      </button>
    </article>
  );
}
