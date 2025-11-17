interface Member {
  role?: string | null;
  profiles?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
}

interface TeamSnapshotProps {
  members: Member[];
}

export function TeamSnapshot({ members }: TeamSnapshotProps) {
  const listed = members.slice(0, 4);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Collaborators</p>
      <h3 className="text-lg font-semibold text-zinc-900">Workspace access</h3>
      <p className="text-sm text-zinc-500">Invite PMs, ICs, or clients to align around the same matrix.</p>

      <div className="mt-4 space-y-3">
        {listed.length === 0 && <p className="text-xs text-zinc-400">No collaborators added yet.</p>}
        {listed.map((member) => (
          <div
            key={member.profiles?.id ?? member.profiles?.email ?? member.role}
            className="flex items-center gap-3 rounded-2xl border border-zinc-100 px-3 py-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {member.profiles?.full_name?.[0]?.toUpperCase() ?? member.profiles?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900">
                {member.profiles?.full_name ?? member.profiles?.email ?? "Pending invite"}
              </span>
              <span className="text-xs uppercase tracking-wide text-zinc-400">{member.role ?? "member"}</span>
            </div>
          </div>
        ))}
      </div>

      <a
        href="https://app.supabase.com/project"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-dashed border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50/70"
      >
        Manage members via Supabase Auth
      </a>
    </section>
  );
}
