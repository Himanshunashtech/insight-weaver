-- 1. Add webhook fields to workflows
alter table public.workflows
  add column if not exists webhook_secret text,
  add column if not exists webhook_path text;

create unique index if not exists workflows_webhook_path_unique
  on public.workflows(workspace_id, webhook_path)
  where webhook_path is not null;

-- 2. Agent tool call tracking
create table if not exists public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null,
  message_id uuid,
  tool_name text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'succeeded',
  error text,
  latency_ms integer,
  created_at timestamptz not null default now()
);

alter table public.agent_tool_calls enable row level security;

create policy "Members read tool calls"
  on public.agent_tool_calls for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Builders insert tool calls"
  on public.agent_tool_calls for insert
  with check (
    public.current_workspace_role(workspace_id, auth.uid())
    = any (array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role])
  );

create index if not exists agent_tool_calls_convo_idx
  on public.agent_tool_calls(conversation_id, created_at desc);

-- 3. Inbound webhook log
create table if not exists public.workflow_webhooks_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  workflow_id uuid not null,
  run_id uuid,
  headers jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  ip text,
  signature_valid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.workflow_webhooks_log enable row level security;

create policy "Members read webhook logs"
  on public.workflow_webhooks_log for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create index if not exists workflow_webhooks_log_wf_idx
  on public.workflow_webhooks_log(workflow_id, created_at desc);

-- 4. Helper: generate webhook secret for a workflow (builders only)
create or replace function public.rotate_workflow_webhook(_workflow_id uuid)
returns table(webhook_path text, webhook_secret text)
language plpgsql
security definer
set search_path = public
as $$
declare
  _ws uuid;
  _new_secret text;
  _new_path text;
begin
  select workspace_id into _ws from public.workflows where id = _workflow_id;
  if _ws is null then raise exception 'workflow not found'; end if;

  if public.current_workspace_role(_ws, auth.uid())
    not in ('owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role) then
    raise exception 'forbidden';
  end if;

  _new_secret := encode(gen_random_bytes(32), 'hex');
  _new_path := 'wf_' || substr(replace(_workflow_id::text,'-',''), 1, 12);

  update public.workflows
    set webhook_secret = _new_secret, webhook_path = _new_path
    where id = _workflow_id;

  return query select _new_path, _new_secret;
end;
$$;