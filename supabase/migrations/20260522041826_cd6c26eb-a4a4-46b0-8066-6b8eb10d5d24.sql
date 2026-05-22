
create type public.run_status as enum ('queued','running','succeeded','failed','cancelled');

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  workflow_id uuid not null,
  started_by uuid not null,
  status run_status not null default 'queued',
  trigger text not null default 'manual',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on public.workflow_runs (workspace_id, started_at desc);
create index on public.workflow_runs (workflow_id, started_at desc);

alter table public.workflow_runs enable row level security;

create policy "Members read runs" on public.workflow_runs for select
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Builders insert runs" on public.workflow_runs for insert
  with check (auth.uid() = started_by and public.current_workspace_role(workspace_id, auth.uid()) = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));
create policy "Builders update runs" on public.workflow_runs for update
  using (public.current_workspace_role(workspace_id, auth.uid()) = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));

create table public.workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  workspace_id uuid not null,
  node_id text not null,
  node_type text not null,
  node_label text,
  status run_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  step_order int not null default 0
);
create index on public.workflow_run_steps (run_id, step_order);
alter table public.workflow_run_steps enable row level security;

create policy "Members read run steps" on public.workflow_run_steps for select
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Builders write run steps" on public.workflow_run_steps for all
  using (public.current_workspace_role(workspace_id, auth.uid()) = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]))
  with check (public.current_workspace_role(workspace_id, auth.uid()) = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  kind text not null,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.integrations (workspace_id);
alter table public.integrations enable row level security;

create policy "Members read integrations" on public.integrations for select
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Builders manage integrations" on public.integrations for all
  using (public.current_workspace_role(workspace_id, auth.uid()) = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]))
  with check (public.current_workspace_role(workspace_id, auth.uid()) = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));

create trigger trg_integrations_updated_at before update on public.integrations
  for each row execute function public.update_updated_at_column();
