import { TaskCard } from "@/components/tasks/task-card";
import { quadrantConfig, resolveQuadrantKey, type QuadrantKey, type TaskRecord } from "@/types/task";

interface MatrixBoardProps {
  tasks: TaskRecord[];
  projects: { id: string; name: string }[];
}

const quadrantOrder: QuadrantKey[] = ["focus", "schedule", "delegate", "eliminate"];

export function MatrixBoard({ tasks, projects }: MatrixBoardProps) {
  const projectLookup = Object.fromEntries(projects.map((project) => [project.id, project.name]));
  const grouped = tasks.reduce<Record<QuadrantKey, TaskRecord[]>>(
    (acc, task) => {
      const quadrant = resolveQuadrantKey(task);
      acc[quadrant].push(task);
      return acc;
    },
    { focus: [], schedule: [], delegate: [], eliminate: [] },
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {quadrantOrder.map((key) => {
        const section = quadrantConfig[key];
        const items = grouped[key];
        return (
          <section
            key={key}
            className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(244,245,247,0.95))`,
            }}
          >
            <header className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${section.accent}`}>{section.title}</p>
                <p className="text-sm text-zinc-500">{section.subtitle}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">{items.length} tasks</span>
            </header>

            <div className="flex flex-col gap-4">
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-400">
                  No tasks in this quadrant yet. Capture a task and drag or reassign priority on the right.
                </p>
              ) : (
                items.map((task) => <TaskCard key={task.id} task={task} projectName={projectLookup[task.project_id ?? ""]} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
