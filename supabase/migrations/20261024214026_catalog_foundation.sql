-- Public catalog, app profile fields, subscription plans, and immutable
-- program terms / rate versions (Stage 2).
--
-- Security & data model rules (see docs/DECISIONS.md W-01..W-07, W-20..W-24,
-- W-32, T-11..T-17, T-20, T-21, T-25):
--   * Money is stored in minor units (`bigint` `price_minor`) + ISO 4217 currency.
--   * Commission rates are stored in basis points (`integer` `commission_bps`,
--     1500 = 15.00%).
--   * Draft apps (`public.apps`) and working plans (`public.app_plans`) are
--     private to the owning organization and platform admins. `anon` has no
--     grants on them.
--   * Publishing an app creates an immutable `app_terms_versions` +
--     `app_terms_plan_rates` snapshot and an approved `app_releases` projection.
--   * The public catalog reads only the current approved release (`is_current_published = true`)
--     through `security_invoker = true` views and functions. Unapproved draft
--     edits and internal payment-provider plan keys (`external_plan_key`) are
--     never exposed to the public catalog.

-- ---------------------------------------------------------------------------
-- Enums.
-- ---------------------------------------------------------------------------
alter type public.app_status add value if not exists 'submitted';
alter type public.app_status add value if not exists 'published';
alter type public.app_status add value if not exists 'rejected';

create type public.app_category as enum (
  'productivity',
  'ai',
  'fitness',
  'education',
  'creative',
  'finance',
  'developer',
  'lifestyle'
);

create type public.app_platform as enum (
  'web',
  'saas',
  'ios',
  'android'
);

create type public.billing_interval as enum (
  'week',
  'month',
  'year'
);

-- ---------------------------------------------------------------------------
-- Validation helpers in `private`.
-- ---------------------------------------------------------------------------
create function private.slugify(p_input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      left(
         btrim(regexp_replace(lower(coalesce(p_input, '')), '[^a-z0-9]+', '-', 'g'), '-'),
        50
      ),
      ''
    ),
    'app'
  );
$$;

create function private.is_valid_https_url(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_url is not null
    and char_length(p_url) <= 2048
    and p_url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{1,5})?([/?#][^[:space:]]*)?$';
$$;

create function private.is_valid_media_url(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_url is not null
    and char_length(p_url) <= 2048
    and (
      private.is_valid_https_url(p_url)
      or p_url ~ '^/demo/[A-Za-z0-9/_-]+(\.[A-Za-z0-9]+)?$'
    );
$$;

create function private.is_valid_language_codes(p_codes text[])
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_code text;
begin
  if p_codes is null or cardinality(p_codes) > 20 then
    return false;
  end if;
  foreach v_code in array p_codes loop
    if v_code is null or v_code !~ '^[a-z]{2}$' then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create function private.is_valid_screenshots(p_screenshots jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
begin
  if p_screenshots is null or jsonb_typeof(p_screenshots) <> 'array' then
    return false;
  end if;
  if jsonb_array_length(p_screenshots) > 10 then
    return false;
  end if;
  for v_item in select * from jsonb_array_elements(p_screenshots) loop
    if jsonb_typeof(v_item) <> 'object' then
      return false;
    end if;
    if not private.is_valid_media_url(v_item ->> 'url') then
      return false;
    end if;
    if char_length(btrim(coalesce(v_item ->> 'alt', ''))) not between 1 and 200 then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Extend `public.apps` with working profile fields.
-- ---------------------------------------------------------------------------
alter table public.apps
  add column slug text,
  add column tagline text not null default ''
    constraint apps_tagline_check check (char_length(tagline) <= 160),
  add column description text not null default ''
    constraint apps_description_check check (char_length(description) <= 10000),
  add column categories public.app_category[] not null default '{}'
    constraint apps_categories_check check (cardinality(categories) <= 3),
  add column platforms public.app_platform[] not null default '{}'
    constraint apps_platforms_check check (cardinality(platforms) <= 4),
  add column languages text[] not null default '{}'
    constraint apps_languages_check check (private.is_valid_language_codes(languages)),
  add column website_url text
    constraint apps_website_url_check check (website_url is null or private.is_valid_https_url(website_url)),
  add column ios_store_url text
    constraint apps_ios_store_url_check check (ios_store_url is null or private.is_valid_https_url(ios_store_url)),
  add column android_store_url text
    constraint apps_android_store_url_check check (android_store_url is null or private.is_valid_https_url(android_store_url)),
  add column logo_url text
    constraint apps_logo_url_check check (logo_url is null or private.is_valid_media_url(logo_url)),
  add column cover_image_url text
    constraint apps_cover_image_url_check check (cover_image_url is null or private.is_valid_media_url(cover_image_url)),
  add column screenshots jsonb not null default '[]'::jsonb
    constraint apps_screenshots_check check (private.is_valid_screenshots(screenshots)),
  add column video_url text
    constraint apps_video_url_check check (video_url is null or private.is_valid_media_url(video_url)),
  add column terms_text text not null default ''
    constraint apps_terms_text_check check (char_length(terms_text) <= 10000),
  add column attribution_window_days smallint not null default 30
    constraint apps_attribution_window_check check (attribution_window_days between 1 and 365),
  add column published_at timestamptz;

update public.apps
set slug = private.slugify(name) || '-' || left(id::text, 6)
where slug is null;

alter table public.apps
  alter column slug set not null,
  add constraint apps_slug_check check (
    char_length(slug) between 2 and 60
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  add constraint apps_slug_key unique (slug);

create function private.ensure_app_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate text;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.slug is null or btrim(new.slug) = '' then
    v_candidate := private.slugify(new.name);
    if char_length(v_candidate) < 2 then
      v_candidate := 'app-' || left(new.id::text, 6);
    end if;
    if exists (select 1 from public.apps where slug = v_candidate and id <> new.id) then
      v_candidate := left(v_candidate, 52) || '-' || left(new.id::text, 6);
    end if;
    new.slug := v_candidate;
  end if;

  return new;
end;
$$;

create trigger apps_ensure_slug
  before insert on public.apps
  for each row execute function private.ensure_app_slug();

-- ---------------------------------------------------------------------------
-- Subscription plans (`public.app_plans`) — company-side working plans.
-- ---------------------------------------------------------------------------
create table public.app_plans (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  name text not null
    constraint app_plans_name_check check (char_length(btrim(name)) between 1 and 80),
  external_plan_key text not null
    constraint app_plans_external_key_check check (
      char_length(btrim(external_plan_key)) between 1 and 120
      and external_plan_key ~ '^[A-Za-z0-9._:-]+$'
    ),
  billing_interval public.billing_interval not null,
  price_minor bigint not null
    constraint app_plans_price_minor_check check (price_minor > 0 and price_minor <= 100000000000),
  currency text not null
    constraint app_plans_currency_check check (currency ~ '^[A-Z]{3}$'),
  commission_bps integer not null
    constraint app_plans_commission_bps_check check (commission_bps between 100 and 9000),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_plans_app_external_key_key unique (app_id, external_plan_key)
);

create index app_plans_app_id_idx on public.app_plans (app_id, sort_order);

create trigger app_plans_set_updated_at
  before update on public.app_plans
  for each row execute function private.set_updated_at();

create function private.is_app_org_member(p_app_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.apps a
    join public.organization_members om on om.organization_id = a.organization_id
    where a.id = p_app_id and om.user_id = (select auth.uid())
  );
$$;

create function private.is_app_org_owner(p_app_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.apps a
    join public.organization_members om on om.organization_id = a.organization_id
    where a.id = p_app_id
      and om.user_id = (select auth.uid())
      and om.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- Immutable program terms & plan rate versions (`app_terms_versions`, `app_terms_plan_rates`).
-- ---------------------------------------------------------------------------
create table public.app_terms_versions (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  version_number integer not null
    constraint app_terms_versions_number_check check (version_number >= 1),
  terms_text text not null
    constraint app_terms_versions_text_check check (char_length(btrim(terms_text)) between 10 and 10000),
  attribution_window_days smallint not null default 30
    constraint app_terms_versions_window_check check (attribution_window_days between 1 and 365),
  min_commission_bps integer not null
    constraint app_terms_versions_min_bps_check check (min_commission_bps between 100 and 9000),
  max_commission_bps integer not null
    constraint app_terms_versions_max_bps_check check (
      max_commission_bps between 100 and 9000
      and max_commission_bps >= min_commission_bps
    ),
  created_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  constraint app_terms_versions_app_version_key unique (app_id, version_number)
);

create index app_terms_versions_app_id_idx on public.app_terms_versions (app_id, version_number desc);

create table public.app_terms_plan_rates (
  id uuid primary key default gen_random_uuid(),
  terms_version_id uuid not null references public.app_terms_versions (id) on delete cascade,
  plan_id uuid references public.app_plans (id) on delete set null,
  plan_name text not null
    constraint app_terms_plan_rates_name_check check (char_length(btrim(plan_name)) between 1 and 80),
  external_plan_key text not null
    constraint app_terms_plan_rates_ext_key_check check (char_length(btrim(external_plan_key)) between 1 and 120),
  billing_interval public.billing_interval not null,
  price_minor bigint not null
    constraint app_terms_plan_rates_price_check check (price_minor > 0),
  currency text not null
    constraint app_terms_plan_rates_currency_check check (currency ~ '^[A-Z]{3}$'),
  commission_bps integer not null
    constraint app_terms_plan_rates_bps_check check (commission_bps between 100 and 9000),
  sort_order smallint not null default 0,
  constraint app_terms_plan_rates_version_ext_key unique (terms_version_id, external_plan_key)
);

create index app_terms_plan_rates_version_idx on public.app_terms_plan_rates (terms_version_id, sort_order);

create function private.forbid_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'version_records_are_immutable' using errcode = 'P0001';
  end if;

  -- Allow cascade deletion only when the parent app is being deleted.
  if tg_table_name = 'app_terms_versions' then
    if exists (select 1 from public.apps where id = old.app_id) then
      raise exception 'version_records_are_immutable' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'app_terms_plan_rates' then
    if exists (select 1 from public.app_terms_versions where id = old.terms_version_id) then
      raise exception 'version_records_are_immutable' using errcode = 'P0001';
    end if;
  end if;

  return old;
end;
$$;

create trigger app_terms_versions_immutable
  before update or delete on public.app_terms_versions
  for each row execute function private.forbid_version_mutation();

create trigger app_terms_plan_rates_immutable
  before update or delete on public.app_terms_plan_rates
  for each row execute function private.forbid_version_mutation();

-- ---------------------------------------------------------------------------
-- Approved public releases (`public.app_releases`).
-- Only approved releases enter this table; draft edits on `public.apps` never
-- leak into the public catalog.
-- ---------------------------------------------------------------------------
create table public.app_releases (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  terms_version_id uuid not null references public.app_terms_versions (id) on delete restrict,
  release_number integer not null
    constraint app_releases_number_check check (release_number >= 1),
  is_current_published boolean not null default false,
  slug text not null
    constraint app_releases_slug_check check (
      char_length(slug) between 2 and 60
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  name text not null
    constraint app_releases_name_check check (char_length(btrim(name)) between 2 and 80),
  organization_name text not null
    constraint app_releases_org_name_check check (char_length(btrim(organization_name)) between 2 and 120),
  tagline text not null
    constraint app_releases_tagline_check check (char_length(btrim(tagline)) between 10 and 160),
  description text not null
    constraint app_releases_description_check check (char_length(btrim(description)) between 20 and 10000),
  categories public.app_category[] not null
    constraint app_releases_categories_check check (cardinality(categories) between 1 and 3),
  platforms public.app_platform[] not null
    constraint app_releases_platforms_check check (cardinality(platforms) between 1 and 4),
  languages text[] not null
    constraint app_releases_languages_check check (
      cardinality(languages) between 1 and 20
      and private.is_valid_language_codes(languages)
    ),
  website_url text
    constraint app_releases_website_url_check check (website_url is null or private.is_valid_https_url(website_url)),
  ios_store_url text
    constraint app_releases_ios_url_check check (ios_store_url is null or private.is_valid_https_url(ios_store_url)),
  android_store_url text
    constraint app_releases_android_url_check check (android_store_url is null or private.is_valid_https_url(android_store_url)),
  logo_url text
    constraint app_releases_logo_url_check check (logo_url is null or private.is_valid_media_url(logo_url)),
  cover_image_url text
    constraint app_releases_cover_url_check check (cover_image_url is null or private.is_valid_media_url(cover_image_url)),
  screenshots jsonb not null default '[]'::jsonb
    constraint app_releases_screenshots_check check (private.is_valid_screenshots(screenshots)),
  video_url text
    constraint app_releases_video_url_check check (video_url is null or private.is_valid_media_url(video_url)),
  min_commission_bps integer not null
    constraint app_releases_min_bps_check check (min_commission_bps between 100 and 9000),
  max_commission_bps integer not null
    constraint app_releases_max_bps_check check (
      max_commission_bps between 100 and 9000
      and max_commission_bps >= min_commission_bps
    ),
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz not null default now(),
  constraint app_releases_app_number_key unique (app_id, release_number)
);

create unique index app_releases_one_current_per_app_idx
  on public.app_releases (app_id)
  where is_current_published = true;

create unique index app_releases_current_slug_idx
  on public.app_releases (slug)
  where is_current_published = true;

create index app_releases_current_published_at_idx
  on public.app_releases (published_at desc, slug asc)
  where is_current_published = true;

create index app_releases_current_categories_idx
  on public.app_releases using gin (categories)
  where is_current_published = true;

create index app_releases_current_platforms_idx
  on public.app_releases using gin (platforms)
  where is_current_published = true;

create index app_releases_current_languages_idx
  on public.app_releases using gin (languages)
  where is_current_published = true;

create index app_releases_current_max_bps_idx
  on public.app_releases (max_commission_bps desc)
  where is_current_published = true;

create index app_releases_organization_id_idx on public.app_releases (organization_id);
create index app_releases_terms_version_id_idx on public.app_releases (terms_version_id);

create function private.protect_app_release()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.apps where id = old.app_id) then
      raise exception 'release_records_are_immutable' using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- Only `is_current_published` may be toggled on an existing release snapshot.
  if new.id is distinct from old.id
    or new.app_id is distinct from old.app_id
    or new.organization_id is distinct from old.organization_id
    or new.terms_version_id is distinct from old.terms_version_id
    or new.release_number is distinct from old.release_number
    or new.slug is distinct from old.slug
    or new.name is distinct from old.name
    or new.organization_name is distinct from old.organization_name
    or new.tagline is distinct from old.tagline
    or new.description is distinct from old.description
    or new.categories is distinct from old.categories
    or new.platforms is distinct from old.platforms
    or new.languages is distinct from old.languages
    or new.website_url is distinct from old.website_url
    or new.ios_store_url is distinct from old.ios_store_url
    or new.android_store_url is distinct from old.android_store_url
    or new.logo_url is distinct from old.logo_url
    or new.cover_image_url is distinct from old.cover_image_url
    or new.screenshots is distinct from old.screenshots
    or new.video_url is distinct from old.video_url
    or new.min_commission_bps is distinct from old.min_commission_bps
    or new.max_commission_bps is distinct from old.max_commission_bps
    or new.published_at is distinct from old.published_at
  then
    raise exception 'release_records_are_immutable' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger app_releases_protect
  before update or delete on public.app_releases
  for each row execute function private.protect_app_release();

-- ---------------------------------------------------------------------------
-- Publishing helper (`private.publish_app_release`) & admin RPC.
-- ---------------------------------------------------------------------------
create function private.publish_app_release(p_app_id uuid, p_published_by uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.apps%rowtype;
  v_org_name text;
  v_min_bps integer;
  v_max_bps integer;
  v_plan_count integer;
  v_next_terms_version integer;
  v_terms_version_id uuid;
  v_next_release_number integer;
  v_release_id uuid;
  v_published_at timestamptz;
begin
  select * into v_app from public.apps where id = p_app_id for update;
  if not found then
    raise exception 'app_not_found' using errcode = 'P0002';
  end if;
  v_published_at := coalesce(v_app.published_at, now());

  select name into v_org_name from public.organizations where id = v_app.organization_id;
  if not found then
    raise exception 'organization_not_found' using errcode = 'P0002';
  end if;

  if char_length(btrim(v_app.tagline)) < 10
    or char_length(btrim(v_app.description)) < 20
    or cardinality(v_app.categories) < 1
    or cardinality(v_app.platforms) < 1
    or cardinality(v_app.languages) < 1
    or char_length(btrim(v_app.terms_text)) < 10
  then
    raise exception 'app_profile_incomplete' using errcode = '22023';
  end if;

  select count(*), min(commission_bps), max(commission_bps)
  into v_plan_count, v_min_bps, v_max_bps
  from public.app_plans
  where app_id = p_app_id and is_active = true;

  if coalesce(v_plan_count, 0) < 1 then
    raise exception 'app_requires_active_plan' using errcode = '22023';
  end if;

  select coalesce(max(version_number), 0) + 1
  into v_next_terms_version
  from public.app_terms_versions
  where app_id = p_app_id;

  insert into public.app_terms_versions (
    app_id,
    version_number,
    terms_text,
    attribution_window_days,
    min_commission_bps,
    max_commission_bps,
    created_by,
    published_at
  )
  values (
    p_app_id,
    v_next_terms_version,
    btrim(v_app.terms_text),
    v_app.attribution_window_days,
    v_min_bps,
    v_max_bps,
    p_published_by,
    v_published_at
  )
  returning id into v_terms_version_id;

  insert into public.app_terms_plan_rates (
    terms_version_id,
    plan_id,
    plan_name,
    external_plan_key,
    billing_interval,
    price_minor,
    currency,
    commission_bps,
    sort_order
  )
  select
    v_terms_version_id,
    id,
    btrim(name),
    btrim(external_plan_key),
    billing_interval,
    price_minor,
    currency,
    commission_bps,
    sort_order
  from public.app_plans
  where app_id = p_app_id and is_active = true
  order by sort_order, created_at;

  update public.app_releases
  set is_current_published = false
  where app_id = p_app_id and is_current_published = true;

  select coalesce(max(release_number), 0) + 1
  into v_next_release_number
  from public.app_releases
  where app_id = p_app_id;

  insert into public.app_releases (
    app_id,
    organization_id,
    terms_version_id,
    release_number,
    is_current_published,
    slug,
    name,
    organization_name,
    tagline,
    description,
    categories,
    platforms,
    languages,
    website_url,
    ios_store_url,
    android_store_url,
    logo_url,
    cover_image_url,
    screenshots,
    video_url,
    min_commission_bps,
    max_commission_bps,
    published_by,
    published_at
  )
  values (
    p_app_id,
    v_app.organization_id,
    v_terms_version_id,
    v_next_release_number,
    true,
    v_app.slug,
    btrim(v_app.name),
    btrim(v_org_name),
    btrim(v_app.tagline),
    btrim(v_app.description),
    v_app.categories,
    v_app.platforms,
    v_app.languages,
    v_app.website_url,
    v_app.ios_store_url,
    v_app.android_store_url,
    v_app.logo_url,
    v_app.cover_image_url,
    v_app.screenshots,
    v_app.video_url,
    v_min_bps,
    v_max_bps,
    p_published_by,
    v_published_at
  )
  returning id into v_release_id;

  update public.apps
  set status = 'published',
      published_at = v_published_at
  where id = p_app_id;

  return v_release_id;
end;
$$;

create function public.admin_publish_app(p_app_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return private.publish_app_release(p_app_id, v_user_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Public catalog views (`security_invoker = true`) and query RPC.
-- ---------------------------------------------------------------------------
create view public.catalog_listings
with (security_invoker = true)
as
select
  r.app_id,
  r.slug,
  r.name,
  r.organization_name,
  r.tagline,
  r.description,
  r.categories,
  r.platforms,
  r.languages,
  r.website_url,
  r.ios_store_url,
  r.android_store_url,
  r.logo_url,
  r.cover_image_url,
  r.screenshots,
  r.video_url,
  r.min_commission_bps,
  r.max_commission_bps,
  r.terms_version_id,
  tv.version_number as terms_version_number,
  tv.terms_text,
  tv.attribution_window_days,
  r.published_at
from public.app_releases r
join public.app_terms_versions tv on tv.id = r.terms_version_id
where r.is_current_published = true;

create view public.catalog_plan_rates
with (security_invoker = true)
as
select
  pr.id,
  r.app_id,
  r.slug as app_slug,
  pr.terms_version_id,
  pr.plan_name,
  pr.billing_interval,
  pr.price_minor,
  pr.currency,
  pr.commission_bps,
  pr.sort_order
from public.app_terms_plan_rates pr
join public.app_releases r on r.terms_version_id = pr.terms_version_id
where r.is_current_published = true;

create function public.list_catalog_apps(
  p_search text default null,
  p_category public.app_category default null,
  p_platform public.app_platform default null,
  p_language text default null,
  p_min_commission_bps integer default null,
  p_page integer default 1,
  p_page_size integer default 9
)
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
  published_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_query text := nullif(btrim(coalesce(p_search, '')), '');
  v_pattern text;
  v_language text := nullif(lower(btrim(coalesce(p_language, ''))), '');
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := least(greatest(coalesce(p_page_size, 9), 1), 48);
begin
  if v_query is not null then
    -- Escape LIKE wildcards so user input is matched literally.
    v_pattern := '%' || regexp_replace(v_query, '([%_\\])', '\\\1', 'g') || '%';
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
    cl.published_at,
    count(*) over () as total_count
  from public.catalog_listings cl
  where (
      v_pattern is null
      or cl.name ilike v_pattern escape '\'
      or cl.tagline ilike v_pattern escape '\'
      or cl.description ilike v_pattern escape '\'
      or cl.organization_name ilike v_pattern escape '\'
    )
    and (p_category is null or p_category = any(cl.categories))
    and (p_platform is null or p_platform = any(cl.platforms))
    and (v_language is null or v_language = any(cl.languages))
    and (p_min_commission_bps is null or cl.max_commission_bps >= p_min_commission_bps)
  order by cl.published_at desc, cl.slug asc
  limit v_page_size
  offset (v_page - 1) * v_page_size;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security on new tables.
-- ---------------------------------------------------------------------------
alter table public.app_plans enable row level security;
alter table public.app_terms_versions enable row level security;
alter table public.app_terms_plan_rates enable row level security;
alter table public.app_releases enable row level security;

create policy "app_plans: read as org member or admin" on public.app_plans
  for select to authenticated
  using (private.is_app_org_member(app_id) or (select private.is_platform_admin()));

create policy "app_releases: public reads current published" on public.app_releases
  for select to anon, authenticated
  using (is_current_published = true);

create policy "app_releases: org member or admin reads all own" on public.app_releases
  for select to authenticated
  using (private.is_org_member(organization_id) or (select private.is_platform_admin()));

create policy "app_terms_versions: public reads current published" on public.app_terms_versions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.app_releases r
      where r.terms_version_id = app_terms_versions.id
        and r.is_current_published = true
    )
  );

create policy "app_terms_versions: org member or admin reads own" on public.app_terms_versions
  for select to authenticated
  using (private.is_app_org_member(app_id) or (select private.is_platform_admin()));

create policy "app_terms_plan_rates: public reads current published" on public.app_terms_plan_rates
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.app_releases r
      where r.terms_version_id = app_terms_plan_rates.terms_version_id
        and r.is_current_published = true
    )
  );

create policy "app_terms_plan_rates: org member or admin reads own" on public.app_terms_plan_rates
  for select to authenticated
  using (
    exists (
      select 1 from public.app_terms_versions tv
      where tv.id = app_terms_plan_rates.terms_version_id
        and (private.is_app_org_member(tv.app_id) or (select private.is_platform_admin()))
    )
  );

-- ---------------------------------------------------------------------------
-- Explicit minimal grants.
-- ---------------------------------------------------------------------------
revoke all on table
  public.app_plans,
  public.app_terms_versions,
  public.app_terms_plan_rates,
  public.app_releases,
  public.catalog_listings,
  public.catalog_plan_rates
from public, anon, authenticated, service_role;

grant select on public.app_plans to authenticated;

grant select (
  id, app_id, version_number, terms_text, attribution_window_days,
  min_commission_bps, max_commission_bps, published_at
) on public.app_terms_versions to anon, authenticated;

-- Notice: `external_plan_key` and `plan_id` are intentionally omitted for anon.
grant select (
  id, terms_version_id, plan_name, billing_interval,
  price_minor, currency, commission_bps, sort_order
) on public.app_terms_plan_rates to anon, authenticated;

grant select (external_plan_key, plan_id) on public.app_terms_plan_rates to authenticated;

grant select (
  id, app_id, organization_id, terms_version_id, release_number,
  is_current_published, slug, name, organization_name, tagline,
  description, categories, platforms, languages, website_url,
  ios_store_url, android_store_url, logo_url, cover_image_url,
  screenshots, video_url, min_commission_bps, max_commission_bps,
  published_at
) on public.app_releases to anon, authenticated;

grant select on public.catalog_listings to anon, authenticated;
grant select on public.catalog_plan_rates to anon, authenticated;

grant select, insert, update, delete on
  public.organizations,
  public.organization_members,
  public.apps,
  public.app_plans,
  public.app_terms_versions,
  public.app_terms_plan_rates,
  public.app_releases
to service_role;

grant usage on schema private to anon, authenticated, service_role;

revoke all on function
  private.slugify(text),
  private.is_valid_https_url(text),
  private.is_valid_media_url(text),
  private.is_valid_language_codes(text[]),
  private.is_valid_screenshots(jsonb),
  private.ensure_app_slug(),
  private.is_app_org_member(uuid),
  private.is_app_org_owner(uuid),
  private.forbid_version_mutation(),
  private.protect_app_release(),
  private.publish_app_release(uuid, uuid),
  public.admin_publish_app(uuid),
  public.list_catalog_apps(text, public.app_category, public.app_platform, text, integer, integer, integer)
from public, anon, authenticated, service_role;

grant execute on function
  private.slugify(text),
  private.is_valid_https_url(text),
  private.is_valid_media_url(text),
  private.is_valid_language_codes(text[]),
  private.is_valid_screenshots(jsonb)
to anon, authenticated, service_role;

grant execute on function
  private.is_app_org_member(uuid),
  private.is_app_org_owner(uuid),
  public.admin_publish_app(uuid)
to authenticated;

grant execute on function
  public.list_catalog_apps(text, public.app_category, public.app_platform, text, integer, integer, integer)
to anon, authenticated;

grant execute on function
  private.publish_app_release(uuid, uuid)
to service_role;
