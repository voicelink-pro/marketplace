-- Creator program memberships, referral codes, named referral links, and
-- category-based similar app recommendations (Stage 4).
--
-- Security & business rules (see docs/DECISIONS.md W-10..W-16, T-11..T-13, T-25, T-26):
--   * A creator joins an active (currently published) program immediately,
--     without company approval.
--   * Joining requires:
--       1. an authenticated user (`auth.uid()`),
--       2. a creator profile with at least one social profile link
--          (`public.creator_is_ready_to_promote()`),
--       3. explicit acceptance of the currently published program terms version
--          (`p_accepted_terms = true` and `p_accepted_terms_version_id` matching
--          the current published release).
--   * Repeated or concurrent clicks on Join are idempotent: `(app_id, creator_id)`
--     is unique and `public.join_program` returns the existing membership.
--   * Each membership gets a unique `referral_code` tied to `(creator_id, app_id)`
--     and a default referral link.
--   * Creators can create multiple named referral links (`creator_referral_links`)
--     for an app and pick a channel. Allowed redirect destinations come strictly
--     from the app's published release (`website_url`, `ios_store_url`,
--     `android_store_url`), never from an arbitrary user-supplied URL.
--   * Links belong exclusively to their owner (`creator_id = (select auth.uid())`).
--     A creator cannot read or create links in another creator's membership.

-- ---------------------------------------------------------------------------
-- Allowed redirect destination kinds (defined by the app, never arbitrary URLs).
-- ---------------------------------------------------------------------------
create type public.referral_destination_kind as enum (
  'website',
  'ios_store',
  'android_store'
);

-- ---------------------------------------------------------------------------
-- Creator program memberships (`public.creator_program_memberships`).
-- ---------------------------------------------------------------------------
create table public.creator_program_memberships (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  accepted_terms_version_id uuid not null references public.app_terms_versions (id) on delete restrict,
  referral_code text not null
    constraint creator_program_memberships_code_check check (
      char_length(referral_code) between 6 and 24
      and referral_code ~ '^[A-Z0-9]{2,12}-[A-Z0-9]{4,10}$'
    ),
  joined_at timestamptz not null default now(),
  constraint creator_program_memberships_app_creator_key unique (app_id, creator_id),
  constraint creator_program_memberships_referral_code_key unique (referral_code)
);

create index creator_program_memberships_creator_id_idx
  on public.creator_program_memberships (creator_id, joined_at desc);

create index creator_program_memberships_app_id_idx
  on public.creator_program_memberships (app_id, joined_at desc);

create index creator_program_memberships_terms_version_idx
  on public.creator_program_memberships (accepted_terms_version_id);

-- ---------------------------------------------------------------------------
-- Creator named referral links (`public.creator_referral_links`).
-- ---------------------------------------------------------------------------
create table public.creator_referral_links (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.creator_program_memberships (id) on delete cascade,
  app_id uuid not null references public.apps (id) on delete cascade,
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  label text not null
    constraint creator_referral_links_label_check check (char_length(btrim(label)) between 1 and 80),
  channel public.social_platform not null default 'other',
  destination_kind public.referral_destination_kind not null default 'website',
  target_url text not null
    constraint creator_referral_links_target_url_check check (private.is_valid_https_url(target_url)),
  token text not null
    constraint creator_referral_links_token_check check (
      char_length(token) between 8 and 48
      and token ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint creator_referral_links_token_key unique (token)
);

create unique index creator_referral_links_membership_label_idx
  on public.creator_referral_links (membership_id, lower(btrim(label)));

create unique index creator_referral_links_one_default_idx
  on public.creator_referral_links (membership_id)
  where is_default = true;

create index creator_referral_links_creator_id_idx
  on public.creator_referral_links (creator_id, created_at desc);

create index creator_referral_links_app_id_idx
  on public.creator_referral_links (app_id);

-- ---------------------------------------------------------------------------
-- Private helpers for code/token generation and destination validation.
-- ---------------------------------------------------------------------------
create function private.generate_referral_code(p_app_slug text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_prefix text;
  v_suffix text;
  v_candidate text;
begin
  v_prefix := upper(regexp_replace(split_part(coalesce(p_app_slug, 'APP'), '-', 1), '[^A-Za-z0-9]', '', 'g'));
  v_prefix := left(coalesce(nullif(v_prefix, ''), 'APP'), 8);
  if char_length(v_prefix) < 2 then
    v_prefix := rpad(v_prefix, 2, 'X');
  end if;

  loop
    v_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    v_candidate := v_prefix || '-' || v_suffix;
    exit when not exists (
      select 1 from public.creator_program_memberships where referral_code = v_candidate
    );
  end loop;

  return v_candidate;
end;
$$;

create function private.generate_link_token(p_app_slug text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_prefix text;
  v_suffix text;
  v_candidate text;
begin
  v_prefix := left(btrim(regexp_replace(lower(coalesce(p_app_slug, 'app')), '[^a-z0-9]+', '-', 'g'), '-'), 24);
  if v_prefix = '' then
    v_prefix := 'app';
  end if;

  loop
    v_suffix := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    v_candidate := v_prefix || '-' || v_suffix;
    exit when not exists (
      select 1 from public.creator_referral_links where token = v_candidate
    );
  end loop;

  return v_candidate;
end;
$$;

create function private.resolve_app_destination(
  p_app_id uuid,
  p_requested_kind public.referral_destination_kind default null,
  out o_kind public.referral_destination_kind,
  out o_url text
)
returns record
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_release public.app_releases%rowtype;
begin
  select * into v_release
  from public.app_releases
  where app_id = p_app_id and is_current_published = true
  limit 1;

  if not found then
    raise exception 'app_not_published' using errcode = 'P0002';
  end if;

  if p_requested_kind is null then
    if v_release.website_url is not null then
      o_kind := 'website';
      o_url := v_release.website_url;
      return;
    elsif v_release.ios_store_url is not null then
      o_kind := 'ios_store';
      o_url := v_release.ios_store_url;
      return;
    elsif v_release.android_store_url is not null then
      o_kind := 'android_store';
      o_url := v_release.android_store_url;
      return;
    else
      raise exception 'destination_not_available_for_app' using errcode = '22023';
    end if;
  end if;

  o_kind := p_requested_kind;
  if p_requested_kind = 'website' then
    o_url := v_release.website_url;
  elsif p_requested_kind = 'ios_store' then
    o_url := v_release.ios_store_url;
  elsif p_requested_kind = 'android_store' then
    o_url := v_release.android_store_url;
  end if;

  if o_url is null then
    raise exception 'destination_not_available_for_app' using errcode = '22023';
  end if;
end;
$$;

create function private.enforce_referral_link_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership public.creator_program_memberships%rowtype;
  v_expected record;
  v_count integer;
begin
  if tg_op = 'UPDATE' then
    if new.membership_id is distinct from old.membership_id
      or new.app_id is distinct from old.app_id
      or new.creator_id is distinct from old.creator_id
      or new.token is distinct from old.token
      or new.destination_kind is distinct from old.destination_kind
      or new.target_url is distinct from old.target_url
      or new.is_default is distinct from old.is_default
    then
      raise exception 'referral_link_immutable' using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- Lock membership row to serialize concurrent link creations and verify ownership.
  select * into v_membership
  from public.creator_program_memberships
  where id = new.membership_id
  for update;

  if not found then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;

  if new.app_id <> v_membership.app_id or new.creator_id <> v_membership.creator_id then
    raise exception 'membership_mismatch' using errcode = '22023';
  end if;

  select count(*) into v_count
  from public.creator_referral_links
  where membership_id = new.membership_id;

  if v_count >= 25 then
    raise exception 'referral_link_limit_reached' using errcode = 'P0001';
  end if;

  -- Verify target_url strictly matches the app's allowed destination URL.
  select * into v_expected
  from private.resolve_app_destination(new.app_id, new.destination_kind);

  if new.target_url is distinct from v_expected.o_url then
    raise exception 'arbitrary_redirect_url_forbidden' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger creator_referral_links_enforce_integrity
  before insert or update on public.creator_referral_links
  for each row execute function private.enforce_referral_link_integrity();

create function private.forbid_membership_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'membership_is_immutable' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.apps where id = old.app_id)
    and exists (select 1 from public.creator_profiles where user_id = old.creator_id)
  then
    raise exception 'membership_is_immutable' using errcode = 'P0001';
  end if;

  return old;
end;
$$;

create trigger creator_program_memberships_immutable
  before update or delete on public.creator_program_memberships
  for each row execute function private.forbid_membership_mutation();

-- ---------------------------------------------------------------------------
-- RPC: `public.join_program` — instant, idempotent creator join.
-- ---------------------------------------------------------------------------
create function public.join_program(
  p_app_id uuid,
  p_accepted_terms_version_id uuid,
  p_accepted_terms boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_existing_id uuid;
  v_release public.app_releases%rowtype;
  v_primary_channel public.social_platform;
  v_dest record;
  v_code text;
  v_token text;
  v_membership_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_app_id is null then
    raise exception 'app_not_published' using errcode = 'P0002';
  end if;

  if not public.creator_is_ready_to_promote() then
    raise exception 'social_profile_required' using errcode = 'P0001';
  end if;

  if coalesce(p_accepted_terms, false) is not true then
    raise exception 'terms_acceptance_required' using errcode = '22023';
  end if;

  -- Serialize concurrent join calls from the same creator for the same app.
  perform pg_advisory_xact_lock(
    hashtextextended('join_program:' || v_user_id::text || ':' || p_app_id::text, 0)
  );

  select id into v_existing_id
  from public.creator_program_memberships
  where app_id = p_app_id and creator_id = v_user_id
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  select * into v_release
  from public.app_releases
  where app_id = p_app_id and is_current_published = true
  limit 1;

  if not found then
    raise exception 'app_not_published' using errcode = 'P0002';
  end if;

  if p_accepted_terms_version_id is null
    or p_accepted_terms_version_id <> v_release.terms_version_id
  then
    raise exception 'stale_or_invalid_terms_version' using errcode = '22023';
  end if;

  select * into v_dest
  from private.resolve_app_destination(p_app_id, null);

  select platform into v_primary_channel
  from public.creator_social_links
  where creator_id = v_user_id
  order by created_at
  limit 1;

  v_code := private.generate_referral_code(v_release.slug);
  v_token := private.generate_link_token(v_release.slug);

  insert into public.creator_program_memberships (
    app_id,
    creator_id,
    accepted_terms_version_id,
    referral_code
  )
  values (
    p_app_id,
    v_user_id,
    v_release.terms_version_id,
    v_code
  )
  returning id into v_membership_id;

  insert into public.creator_referral_links (
    membership_id,
    app_id,
    creator_id,
    label,
    channel,
    destination_kind,
    target_url,
    token,
    is_default
  )
  values (
    v_membership_id,
    p_app_id,
    v_user_id,
    'Primary link',
    coalesce(v_primary_channel, 'other'),
    v_dest.o_kind,
    v_dest.o_url,
    v_token,
    true
  );

  return v_membership_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: `public.create_referral_link` — owner-only named link creation.
-- ---------------------------------------------------------------------------
create function public.create_referral_link(
  p_membership_id uuid,
  p_label text,
  p_channel public.social_platform,
  p_destination_kind public.referral_destination_kind default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_label text := btrim(coalesce(p_label, ''));
  v_membership public.creator_program_memberships%rowtype;
  v_release_slug text;
  v_dest record;
  v_token text;
  v_link_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_membership_id is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_membership
  from public.creator_program_memberships
  where id = p_membership_id
  for update;

  if not found or v_membership.creator_id <> v_user_id then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if char_length(v_label) not between 1 and 80 then
    raise exception 'invalid_link_label' using errcode = '22023';
  end if;

  if p_channel is null then
    raise exception 'invalid_link_channel' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.creator_referral_links
    where membership_id = p_membership_id
      and lower(btrim(label)) = lower(v_label)
  ) then
    raise exception 'duplicate_link_label' using errcode = '23505';
  end if;

  select slug into v_release_slug
  from public.app_releases
  where app_id = v_membership.app_id and is_current_published = true
  limit 1;

  if v_release_slug is null then
    raise exception 'app_not_published' using errcode = 'P0002';
  end if;

  select * into v_dest
  from private.resolve_app_destination(v_membership.app_id, p_destination_kind);

  v_token := private.generate_link_token(v_release_slug);

  insert into public.creator_referral_links (
    membership_id,
    app_id,
    creator_id,
    label,
    channel,
    destination_kind,
    target_url,
    token,
    is_default
  )
  values (
    p_membership_id,
    v_membership.app_id,
    v_user_id,
    v_label,
    p_channel,
    v_dest.o_kind,
    v_dest.o_url,
    v_token,
    false
  )
  returning id into v_link_id;

  return v_link_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: `public.suggest_similar_apps_for_creator` — category-based, no AI.
-- ---------------------------------------------------------------------------
create function public.suggest_similar_apps_for_creator(p_limit integer default 3)
returns table (
  app_id uuid,
  slug text,
  name text,
  organization_name text,
  tagline text,
  categories public.app_category[],
  platforms public.app_platform[],
  languages text[],
  logo_url text,
  cover_image_url text,
  min_commission_bps integer,
  max_commission_bps integer,
  shared_categories public.app_category[]
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_joined_categories public.app_category[];
  v_limit integer := least(greatest(coalesce(p_limit, 3), 1), 12);
begin
  if v_user_id is null then
    return;
  end if;

  select array_agg(distinct cat)
  into v_joined_categories
  from public.creator_program_memberships m
  join public.catalog_listings cl on cl.app_id = m.app_id
  cross join unnest(cl.categories) as cat
  where m.creator_id = v_user_id;

  if v_joined_categories is null or cardinality(v_joined_categories) = 0 then
    return;
  end if;

  return query
  select
    cl.app_id,
    cl.slug,
    cl.name,
    cl.organization_name,
    cl.tagline,
    cl.categories,
    cl.platforms,
    cl.languages,
    cl.logo_url,
    cl.cover_image_url,
    cl.min_commission_bps,
    cl.max_commission_bps,
    array(
      select unnest(cl.categories)
      intersect
      select unnest(v_joined_categories)
    ) as shared_categories
  from public.catalog_listings cl
  where cl.categories && v_joined_categories
    and not exists (
      select 1 from public.creator_program_memberships m
      where m.app_id = cl.app_id and m.creator_id = v_user_id
    )
  order by
    cardinality(
      array(
        select unnest(cl.categories)
        intersect
        select unnest(v_joined_categories)
      )
    ) desc,
    cl.max_commission_bps desc,
    cl.published_at desc,
    cl.slug asc
  limit v_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security.
-- ---------------------------------------------------------------------------
alter table public.creator_program_memberships enable row level security;
alter table public.creator_referral_links enable row level security;

create policy "creator_program_memberships: read own, org app, or admin"
  on public.creator_program_memberships
  for select to authenticated
  using (
    creator_id = (select auth.uid())
    or private.is_app_org_member(app_id)
    or (select private.is_platform_admin())
  );

create policy "creator_referral_links: read own or admin"
  on public.creator_referral_links
  for select to authenticated
  using (
    creator_id = (select auth.uid())
    or (select private.is_platform_admin())
  );

-- ---------------------------------------------------------------------------
-- Explicit minimal grants.
-- ---------------------------------------------------------------------------
revoke all on table
  public.creator_program_memberships,
  public.creator_referral_links
from public, anon, authenticated, service_role;

grant select on public.creator_program_memberships to authenticated;
grant select on public.creator_referral_links to authenticated;

grant select, insert, update, delete on
  public.creator_program_memberships,
  public.creator_referral_links
to service_role;

revoke all on function
  private.generate_referral_code(text),
  private.generate_link_token(text),
  private.resolve_app_destination(uuid, public.referral_destination_kind),
  private.enforce_referral_link_integrity(),
  private.forbid_membership_mutation(),
  public.join_program(uuid, uuid, boolean),
  public.create_referral_link(uuid, text, public.social_platform, public.referral_destination_kind),
  public.suggest_similar_apps_for_creator(integer)
from public, anon, authenticated, service_role;

grant execute on function
  public.join_program(uuid, uuid, boolean),
  public.create_referral_link(uuid, text, public.social_platform, public.referral_destination_kind),
  public.suggest_similar_apps_for_creator(integer)
to authenticated;
