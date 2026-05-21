create table public.workflow_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  workflow_id uuid not null,
  actor_id uuid not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_wae_workflow on public.workflow_audit_events(workflow_id, created_at desc);
create index idx_wae_workspace on public.workflow_audit_events(workspace_id, created_at desc);

alter table public.workflow_audit_events enable row level security;

create policy "Members read audit events"
  on public.workflow_audit_events for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Builders insert audit events"
  on public.workflow_audit_events for insert
  with check (
    auth.uid() = actor_id
    and public.current_workspace_role(workspace_id, auth.uid())
        = any (array['owner'::workspace_role, 'admin'::workspace_role, 'builder'::workspace_role])
  );