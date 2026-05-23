
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  created_by uuid not null,
  name text not null,
  description text,
  avatar text,
  model text not null default 'google/gemini-3-flash-preview',
  system_prompt text not null default 'You are a helpful AI agent.',
  tools jsonb not null default '[]'::jsonb,
  temperature numeric not null default 0.7,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.agents enable row level security;
create policy "Members read agents" on public.agents for select using (is_workspace_member(workspace_id, auth.uid()));
create policy "Builders manage agents" on public.agents for all
  using (current_workspace_role(workspace_id, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]))
  with check (current_workspace_role(workspace_id, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));
create trigger update_agents_updated_at before update on public.agents for each row execute function public.update_updated_at_column();

create table public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  workspace_id uuid not null,
  user_id uuid not null,
  title text,
  created_at timestamptz not null default now()
);
alter table public.agent_conversations enable row level security;
create policy "Members read convos" on public.agent_conversations for select using (is_workspace_member(workspace_id, auth.uid()));
create policy "Members manage own convos" on public.agent_conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id and is_workspace_member(workspace_id, auth.uid()));

create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  workspace_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.agent_messages enable row level security;
create policy "Members read msgs" on public.agent_messages for select using (is_workspace_member(workspace_id, auth.uid()));
create policy "Members insert msgs" on public.agent_messages for insert
  with check (is_workspace_member(workspace_id, auth.uid()));

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  uploaded_by uuid not null,
  name text not null,
  size_bytes bigint not null default 0,
  mime_type text,
  storage_path text not null,
  status text not null default 'uploaded',
  extracted jsonb,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "Members read docs" on public.documents for select using (is_workspace_member(workspace_id, auth.uid()));
create policy "Builders manage docs" on public.documents for all
  using (current_workspace_role(workspace_id, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]))
  with check (current_workspace_role(workspace_id, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  created_by uuid not null,
  name text not null,
  prefix text not null,
  hash text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.api_keys enable row level security;
create policy "Members read keys" on public.api_keys for select using (is_workspace_member(workspace_id, auth.uid()));
create policy "Admins manage keys" on public.api_keys for all
  using (current_workspace_role(workspace_id, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role]))
  with check (current_workspace_role(workspace_id, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role]));

insert into storage.buckets (id, name, public) values ('documents','documents', false) on conflict (id) do nothing;
create policy "Members read doc files" on storage.objects for select
  using (bucket_id = 'documents' and is_workspace_member(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "Builders upload doc files" on storage.objects for insert
  with check (bucket_id = 'documents' and current_workspace_role(((storage.foldername(name))[1])::uuid, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));
create policy "Builders delete doc files" on storage.objects for delete
  using (bucket_id = 'documents' and current_workspace_role(((storage.foldername(name))[1])::uuid, auth.uid()) = any(array['owner'::workspace_role,'admin'::workspace_role,'builder'::workspace_role]));
