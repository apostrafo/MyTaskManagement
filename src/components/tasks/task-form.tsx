"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Loader2 } from "lucide-react";
import type { CreateTaskInput } from "@/app/dashboard/actions";
import { createTaskAction } from "@/app/dashboard/actions";

const taskFormSchema = z.object({
  title: z.string().min(2, "Title is required").max(160),
  description: z.string().max(2000).optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(["critical", "high", "medium", "low"]).default("high"),
  status: z.enum(["backlog", "in_progress", "blocked", "done"]).default("backlog"),
  is_urgent: z.boolean().default(true),
  is_important: z.boolean().default(true),
  project_id: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
  tags: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  projects: { id: string; name: string }[];
}

export function TaskForm({ projects }: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "high",
      status: "backlog",
      is_urgent: true,
      is_important: true,
    },
  });

  const submit = form.handleSubmit((values) => {
    const projectId = values.project_id && values.project_id !== "" ? values.project_id : null;
    const payload: CreateTaskInput = {
      title: values.title,
      description: values.description ?? null,
      due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
      priority: values.priority,
      status: values.status,
      is_urgent: values.is_urgent,
      is_important: values.is_important,
      project_id: projectId,
      tags: values.tags
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 6),
    };

    startTransition(async () => {
      const result = await createTaskAction(payload);
      if (result.success) {
        setMessage("Task created");
        form.reset({
          title: "",
          description: "",
          priority: payload.priority,
          status: "backlog",
          is_urgent: payload.is_urgent,
          is_important: payload.is_important,
          project_id: null,
          tags: "",
        });
      } else {
        setMessage(result.error ?? "Something went wrong");
      }
    });
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Create quick task</h3>
        <p className="text-sm text-zinc-500">Capture action items and place them in the right quadrant.</p>
      </div>

      <label className="text-sm font-medium text-zinc-700">
        Title
        <input
          type="text"
          {...form.register("title")}
          placeholder="Quarterly roadmap sync"
          className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
        {form.formState.errors.title && <p className="text-xs text-rose-500">{form.formState.errors.title.message}</p>}
      </label>

      <label className="text-sm font-medium text-zinc-700">
        Description
        <textarea
          {...form.register("description")}
          placeholder="Prep docs, KPI snapshots, alignment matrix..."
          rows={3}
          className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-rose-500">{form.formState.errors.description.message}</p>
        )}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">
          Due date
          <input
            type="date"
            {...form.register("due_date")}
            className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>

        <label className="text-sm font-medium text-zinc-700">
          Project
          <select
            {...form.register("project_id")}
            className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">
          Priority
          <select
            {...form.register("priority")}
            className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">
          Status
          <select
            {...form.register("status")}
            className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-3 py-2">
          <input type="checkbox" {...form.register("is_urgent")} className="h-4 w-4 rounded border-zinc-300 text-indigo-600" />
          <span className="text-sm font-medium text-zinc-700">Urgent</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-3 py-2">
          <input type="checkbox" {...form.register("is_important")} className="h-4 w-4 rounded border-zinc-300 text-indigo-600" />
          <span className="text-sm font-medium text-zinc-700">Important</span>
        </label>
      </div>

      <label className="text-sm font-medium text-zinc-700">
        Tags (comma separated)
        <input
          type="text"
          {...form.register("tags")}
          placeholder="OKRs, customer, billing"
          className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        Capture task
      </button>

      {message && <p className="text-center text-xs text-zinc-500">{message}</p>}
    </form>
  );
}
