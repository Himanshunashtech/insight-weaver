
-- ============ enums ============
create type public.app_role as enum ('admin', 'user');
create type public.workspace_role as enum ('owner', 'admin', 'builder', 'viewer');

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ============ workspaces ============
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;

-- ============ workspace_members ============
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
alter table public.workspace_members enable row level security;
create index workspace_members_user_idx on public.workspace_members(user_id);
create index workspace_members_ws_idx on public.workspace_members(workspace_id);

-- ============ user_roles (global) ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- ============ helpers (SECURITY DEFINER) ============
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_workspace_member(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = _workspace_id and user_id = _user_id)
$$;

create or replace function public.current_workspace_role(_workspace_id uuid, _user_id uuid)
returns public.workspace_role language sql stable security definer set search_path = public as $$
  select role from public.workspace_members where workspace_id = _workspace_id and user_id = _user_id
$$;

-- ============ updated_at trigger ============
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.update_updated_at_column();
create trigger trg_workspaces_updated before update on public.workspaces
for each row execute function public.update_updated_at_column();

-- ============ auto-provision profile + default workspace on signup ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _ws_id uuid;
  _slug text;
  _name text;
begin
  _name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, _name, new.raw_user_meta_data->>'avatar_url');

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  _slug := lower(regexp_replace(coalesce(_name, 'workspace'), '[^a-zA-Z0-9]+', '-', 'g'))
           || '-' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.workspaces (name, slug, created_by)
  values (coalesce(_name, 'My workspace') || '''s workspace', _slug, new.id)
  returning id into _ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (_ws_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ RLS policies ============
-- profiles
create policy "Own profile readable" on public.profiles for select using (auth.uid() = id);
create policy "Own profile insertable" on public.profiles for insert with check (auth.uid() = id);
create policy "Own profile updatable" on public.profiles for update using (auth.uid() = id);

-- user_roles (read-only to self; mutations only by admins)
create policy "Own roles readable" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- workspaces
create policy "Members read workspaces" on public.workspaces for select
  using (public.is_workspace_member(id, auth.uid()));
create policy "Authenticated create workspace" on public.workspaces for insert
  with check (auth.uid() = created_by);
create policy "Owners update workspace" on public.workspaces for update
  using (public.current_workspace_role(id, auth.uid()) in ('owner','admin'));
create policy "Owners delete workspace" on public.workspaces for delete
  using (public.current_workspace_role(id, auth.uid()) = 'owner');

-- workspace_members
create policy "Members read members" on public.workspace_members for select
  using (public.is_workspace_member(workspace_id, auth.uid()));
create policy "Self insert as creator" on public.workspace_members for insert
  with check (auth.uid() = user_id);
create policy "Owners manage members" on public.workspace_members for all
  using (public.current_workspace_role(workspace_id, auth.uid()) in ('owner','admin'))
  with check (public.current_workspace_role(workspace_id, auth.uid()) in ('owner','admin'));
