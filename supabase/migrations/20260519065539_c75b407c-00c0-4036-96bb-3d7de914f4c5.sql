
create type public.workflow_status as enum ('draft','active','paused','archived');
create type public.workflow_trigger as enum ('manual','webhook','schedule');

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status public.workflow_status not null default 'draft',
  trigger_type public.workflow_trigger not null default 'manual',
  schedule text,
  tags text[] not null default '{}',
  graph jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workflows enable row level security;
create index workflows_workspace_idx on public.workflows(workspace_id);
create index workflows_status_idx on public.workflows(status);

create trigger trg_workflows_updated before update on public.workflows
for each row execute function public.update_updated_at_column();

-- RLS
create policy "Members read workflows" on public.workflows for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Builders create workflows" on public.workflows for insert
  with check (
    auth.uid() = created_by
    and public.current_workspace_role(workspace_id, auth.uid()) in ('owner','admin','builder')
  );

create policy "Builders update workflows" on public.workflows for update
  using (public.current_workspace_role(workspace_id, auth.uid()) in ('owner','admin','builder'));

create policy "Builders delete workflows" on public.workflows for delete
  using (public.current_workspace_role(workspace_id, auth.uid()) in ('owner','admin','builder'));
