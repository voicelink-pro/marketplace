-- Accounts foundation: profiles, platform admins, creator context with social
-- links, organizations with memberships, and apps limited per organization.
--
-- Access model (see docs/DECISIONS.md T-11..T-15):
--   * Tables are not auto-exposed; every grant below is explicit.
--   * RLS is enabled on every table in the exposed `public` schema.
--   * Business-rule writes (organizations, memberships, apps) only happen through
--     SECURITY DEFINER functions that check auth.uid() themselves.
--   * The admin role lives in platform_admins, which API roles cannot write.

-- ---------------------------------------------------------------------------
-- Private schema for helpers. Not exposed through the Data API.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
-- RLS policies evaluated as `authenticated` call helpers in this schema.
grant usage on schema private to authenticated;

alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one per auth user, created by trigger. No role/permission columns.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_check check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  -- user metadata is user-controlled: it is only used as a display label.
  v_display_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80);
  if v_display_name = '' then
    v_display_name := 'New user';
  end if;

  insert into public.profiles (id, display_name) values (new.id, v_display_name);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Platform admins. Granted only by an operator with the service role or SQL.
-- ---------------------------------------------------------------------------
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by text not null
    constraint platform_admins_granted_by_check check (char_length(btrim(granted_by)) between 1 and 200),
  note text
    constraint platform_admins_note_check check (note is null or char_length(note) <= 500),
  granted_at timestamptz not null default now()
);

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Creator context.
-- ---------------------------------------------------------------------------
create table public.creator_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger creator_profiles_set_updated_at
  before update on public.creator_profiles
  for each row execute function private.set_updated_at();

create type public.social_platform as enum (
  'instagram', 'tiktok', 'youtube', 'x', 'facebook', 'linkedin',
  'twitch', 'snapchat', 'pinterest', 'threads', 'other'
);

-- Ownership of the linked profile is not verified in the MVP (brief W-11), so
-- there is intentionally no verified flag.
create table public.creator_social_links (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  platform public.social_platform not null,
  url text not null
    constraint creator_social_links_url_check check (
      char_length(url) <= 2048
      and url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
    ),
  created_at timestamptz not null default now(),
  constraint creator_social_links_creator_url_key unique (creator_id, url)
);

create function private.enforce_social_link_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  -- Serialize concurrent inserts for the same creator before counting.
  perform 1 from public.creator_profiles where user_id = new.creator_id for update;
  select count(*) into v_count from public.creator_social_links where creator_id = new.creator_id;
  if v_count >= 10 then
    raise exception 'social_link_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger creator_social_links_enforce_limit
  before insert on public.creator_social_links
  for each row execute function private.enforce_social_link_limit();

-- ---------------------------------------------------------------------------
-- Organizations, memberships and apps.
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint organizations_name_check check (char_length(btrim(name)) between 2 and 120),
  -- MVP: one app per organization (brief W-20). Raised by the platform, never by members.
  max_apps smallint not null default 1
    constraint organizations_max_apps_check check (max_apps >= 1),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_created_by_idx on public.organizations (created_by);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function private.set_updated_at();

create type public.organization_role as enum ('owner', 'member');

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.organization_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

create function private.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = (select auth.uid())
  );
$$;

create function private.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

-- Extended with review states in a later stage.
create type public.app_status as enum ('draft');

create table public.apps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null
    constraint apps_name_check check (char_length(btrim(name)) between 2 and 80),
  status public.app_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index apps_organization_id_idx on public.apps (organization_id);
create index apps_created_by_idx on public.apps (created_by);

create trigger apps_set_updated_at
  before update on public.apps
  for each row execute function private.set_updated_at();

create function private.enforce_app_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max_apps smallint;
  v_count integer;
begin
  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id then
      raise exception 'app_organization_immutable' using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- Lock the organization row so concurrent inserts are counted one at a time.
  select max_apps into v_max_apps
  from public.organizations
  where id = new.organization_id
  for update;

  if not found then
    raise exception 'organization_not_found' using errcode = 'P0002';
  end if;

  select count(*) into v_count from public.apps where organization_id = new.organization_id;
  if v_count >= v_max_apps then
    raise exception 'app_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger apps_enforce_limit
  before insert or update of organization_id on public.apps
  for each row execute function private.enforce_app_limit();

-- ---------------------------------------------------------------------------
-- RPCs callable by signed-in users.
-- ---------------------------------------------------------------------------
create function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_organization_name' using errcode = '22023';
  end if;

  -- MVP: a user owns at most one organization. A repeated submit returns it.
  perform pg_advisory_xact_lock(hashtextextended('create_organization:' || v_user_id::text, 0));

  select organization_id into v_organization_id
  from public.organization_members
  where user_id = v_user_id and role = 'owner'
  order by created_at
  limit 1;

  if v_organization_id is not null then
    return v_organization_id;
  end if;

  insert into public.organizations (name, created_by)
  values (v_name, v_user_id)
  returning id into v_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, v_user_id, 'owner');

  return v_organization_id;
end;
$$;

create function public.create_app(p_organization_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_app_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not private.is_org_owner(p_organization_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(v_name) not between 2 and 80 then
    raise exception 'invalid_app_name' using errcode = '22023';
  end if;

  insert into public.apps (organization_id, name, created_by)
  values (p_organization_id, v_name, v_user_id)
  returning id into v_app_id;

  return v_app_id;
end;
$$;

create function public.creator_is_ready_to_promote()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.creator_social_links where creator_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.creator_social_links enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.apps enable row level security;

create policy "profiles: read own or as admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_platform_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "platform_admins: read own row" on public.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "creator_profiles: read own or as admin" on public.creator_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_platform_admin()));

create policy "creator_profiles: create own" on public.creator_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "creator_social_links: read own" on public.creator_social_links
  for select to authenticated
  using (creator_id = (select auth.uid()));

create policy "creator_social_links: create own" on public.creator_social_links
  for insert to authenticated
  with check (creator_id = (select auth.uid()));

create policy "creator_social_links: delete own" on public.creator_social_links
  for delete to authenticated
  using (creator_id = (select auth.uid()));

create policy "organizations: read as member or admin" on public.organizations
  for select to authenticated
  using (private.is_org_member(id) or (select private.is_platform_admin()));

create policy "organizations: owners update" on public.organizations
  for update to authenticated
  using (private.is_org_owner(id))
  with check (private.is_org_owner(id));

create policy "organization_members: read as member or admin" on public.organization_members
  for select to authenticated
  using (private.is_org_member(organization_id) or (select private.is_platform_admin()));

create policy "apps: read as member or admin" on public.apps
  for select to authenticated
  using (private.is_org_member(organization_id) or (select private.is_platform_admin()));

-- ---------------------------------------------------------------------------
-- Grants. Start from nothing, then allow exactly what the app needs.
-- ---------------------------------------------------------------------------
revoke all on table
  public.profiles,
  public.platform_admins,
  public.creator_profiles,
  public.creator_social_links,
  public.organizations,
  public.organization_members,
  public.apps
from anon, authenticated, service_role;

grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.platform_admins to authenticated;

grant select on public.creator_profiles to authenticated;
grant insert (user_id) on public.creator_profiles to authenticated;

grant select, delete on public.creator_social_links to authenticated;
grant insert (creator_id, platform, url) on public.creator_social_links to authenticated;

grant select on public.organizations to authenticated;
grant update (name) on public.organizations to authenticated;

grant select on public.organization_members to authenticated;

grant select on public.apps to authenticated;

-- Operator tooling (scripts/grant-admin.mjs) runs with the secret key.
grant select, insert, delete on public.platform_admins to service_role;
grant select on public.profiles to service_role;

revoke all on function public.create_organization(text) from public, anon, authenticated, service_role;
revoke all on function public.create_app(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.creator_is_ready_to_promote() from public, anon, authenticated, service_role;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.create_app(uuid, text) to authenticated;
grant execute on function public.creator_is_ready_to_promote() to authenticated;

revoke all on function
  private.set_updated_at(),
  private.handle_new_auth_user(),
  private.is_platform_admin(),
  private.enforce_social_link_limit(),
  private.is_org_member(uuid),
  private.is_org_owner(uuid),
  private.enforce_app_limit()
from public, anon, authenticated, service_role;

grant execute on function
  private.is_platform_admin(),
  private.is_org_member(uuid),
  private.is_org_owner(uuid)
to authenticated;
