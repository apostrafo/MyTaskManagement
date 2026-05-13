-- Enable uuid generation
create extension if not exists "uuid-ossp";

-- Base profile table synced with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create type task_priority as enum ('critical', 'high', 'medium', 'low');
create type task_status as enum ('backlog', 'in_progress', 'blocked', 'done');

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  is_urgent boolean not null default true,
  is_important boolean not null default true,
  priority task_priority not null default 'high',
  status task_status not null default 'backlog',
  tags text[] default '{}',
  assignee_id uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  user_id uuid references auth.users(id),
  payload jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;

create policy "workspace members can read workspaces" on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
    )
  );

create policy "workspace owner can manage workspace" on public.workspaces
  for all using (owner_id = auth.uid());

create policy "members manage membership" on public.workspace_members
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

create policy "members read projects" on public.projects
  for select using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "members manage tasks" on public.tasks
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = tasks.workspace_id and wm.user_id = auth.uid()
    )
  );

create policy "members read comments" on public.comments
  for select using (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = comments.task_id and wm.user_id = auth.uid()
    )
  );

-- Helper function to auto bootstrap personal workspace
create or replace function public.ensure_personal_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_workspace uuid;
begin
  select workspace_id into existing_workspace
  from workspace_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1;

  if existing_workspace is not null then
    return existing_workspace;
  end if;

  insert into workspaces (name, owner_id)
  values (coalesce(auth.jwt()->>'user_metadata'->>'full_name', 'Personal workspace'), auth.uid())
  returning id into existing_workspace;

  insert into workspace_members (workspace_id, user_id, role)
  values (existing_workspace, auth.uid(), 'owner');

  return existing_workspace;
end;
$$;
