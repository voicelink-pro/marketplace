-- Company app draft editor, subscription plans management, media asset access
-- control, submission workflow, and administrator review (Stage 3).
--
-- Security & business rules (see docs/DECISIONS.md W-20..W-24, W-32, T-11..T-17, T-25, T-26, T-30):
--   * A company prepares one app in the MVP (limit enforced by `apps_enforce_limit`
--     with `SELECT ... FOR UPDATE` on the organization row).
--   * Working edits (`public.apps`, `public.app_plans`, `public.app_media_assets`)
--     are private to the owning organization and platform admins.
--   * If an app is already published, editing the working draft or submitting a
--     new revision never mutates or exposes unapproved changes to the public
--     catalog (`public.app_releases` with `is_current_published = true` continues
--     serving the last approved release).
--   * Approving a submission creates a new immutable `app_terms_versions` +
--     `app_terms_plan_rates` snapshot and a new `app_releases` row.
--   * Publication flow: `draft` -> `submitted` -> `published` (approved) or `rejected`
--     (sent back with a required reason).
--   * Live publication requires verified integration and funding (Stages 6 & 8);
--     attempting `p_environment = 'live'` fails closed (`live_publication_requires_verified_integration_and_funding`),
--     while `demo` environment exercises the full workflow end to end.

-- ---------------------------------------------------------------------------
-- Extend `public.apps` with review workflow metadata.
-- ---------------------------------------------------------------------------
alter table public.apps
  add column publish_environment text not null default 'demo'
    constraint apps_publish_environment_check check (publish_environment in ('demo', 'live')),
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column rejection_reason text
    constraint apps_rejection_reason_check check (
      rejection_reason is null or char_length(btrim(rejection_reason)) <= 2000
    );

create index apps_status_submitted_at_idx on public.apps (status, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Immutable review decision audit log (`public.app_review_events`).
-- ---------------------------------------------------------------------------
create table public.app_review_events (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null
    constraint app_review_events_type_check check (event_type in ('submitted', 'approved', 'rejected')),
  environment text not null default 'demo'
    constraint app_review_events_env_check check (environment in ('demo', 'live')),
  note text
    constraint app_review_events_note_check check (note is null or char_length(btrim(note)) <= 2000),
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index app_review_events_app_id_idx on public.app_review_events (app_id, created_at desc);
create index app_review_events_org_id_idx on public.app_review_events (organization_id, created_at desc);

create function private.forbid_review_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'review_events_are_immutable' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.apps where id = old.app_id) then
    raise exception 'review_events_are_immutable' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger app_review_events_immutable
  before update or delete on public.app_review_events
  for each row execute function private.forbid_review_event_mutation();

-- ---------------------------------------------------------------------------
-- Media & file access control (`public.app_media_assets`).
-- ---------------------------------------------------------------------------
create table public.app_media_assets (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  asset_kind text not null
    constraint app_media_assets_kind_check check (asset_kind in ('logo', 'cover', 'screenshot', 'video')),
  storage_path text not null
    constraint app_media_assets_path_check check (private.is_valid_media_url(storage_path)),
  alt_text text not null default ''
    constraint app_media_assets_alt_check check (char_length(alt_text) <= 200),
  mime_type text not null default 'image/svg+xml'
    constraint app_media_assets_mime_check check (
      mime_type in (
        'image/svg+xml',
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4',
        'video/webm'
      )
    ),
  byte_size integer not null default 0
    constraint app_media_assets_size_check check (byte_size between 0 and 104857600),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index app_media_assets_app_id_idx on public.app_media_assets (app_id, asset_kind);
create index app_media_assets_org_id_idx on public.app_media_assets (organization_id);

create function private.enforce_media_asset_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_org_id uuid;
begin
  select organization_id into v_app_org_id
  from public.apps
  where id = new.app_id;

  if not found then
    raise exception 'app_not_found' using errcode = 'P0002';
  end if;

  if new.organization_id <> v_app_org_id then
    raise exception 'media_organization_mismatch' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger app_media_assets_enforce_integrity
  before insert or update on public.app_media_assets
  for each row execute function private.enforce_media_asset_integrity();

create function private.sync_app_media_assets(p_app_id uuid, p_actor_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app public.apps%rowtype;
  v_item jsonb;
begin
  select * into v_app from public.apps where id = p_app_id;
  if not found then
    return;
  end if;

  delete from public.app_media_assets where app_id = p_app_id;

  if v_app.logo_url is not null then
    insert into public.app_media_assets (app_id, organization_id, asset_kind, storage_path, alt_text, created_by)
    values (v_app.id, v_app.organization_id, 'logo', v_app.logo_url, v_app.name || ' logo', p_actor_id);
  end if;

  if v_app.cover_image_url is not null then
    insert into public.app_media_assets (app_id, organization_id, asset_kind, storage_path, alt_text, created_by)
    values (v_app.id, v_app.organization_id, 'cover', v_app.cover_image_url, v_app.name || ' cover', p_actor_id);
  end if;

  if v_app.video_url is not null then
    insert into public.app_media_assets (app_id, organization_id, asset_kind, storage_path, alt_text, mime_type, created_by)
    values (v_app.id, v_app.organization_id, 'video', v_app.video_url, v_app.name || ' video', 'video/mp4', p_actor_id);
  end if;

  if v_app.screenshots is not null and jsonb_typeof(v_app.screenshots) = 'array' then
    for v_item in select * from jsonb_array_elements(v_app.screenshots) loop
      insert into public.app_media_assets (app_id, organization_id, asset_kind, storage_path, alt_text, created_by)
      values (
        v_app.id,
        v_app.organization_id,
        'screenshot',
        v_item ->> 'url',
        left(btrim(coalesce(v_item ->> 'alt', v_app.name || ' screenshot')), 200),
        p_actor_id
      );
    end loop;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: `public.save_app_draft` — owner saves working profile & media fields.
-- ---------------------------------------------------------------------------
create function public.save_app_draft(
  p_app_id uuid,
  p_name text,
  p_slug text default null,
  p_tagline text default '',
  p_description text default '',
  p_categories public.app_category[] default '{}',
  p_platforms public.app_platform[] default '{}',
  p_languages text[] default '{}',
  p_website_url text default null,
  p_ios_store_url text default null,
  p_android_store_url text default null,
  p_logo_url text default null,
  p_cover_image_url text default null,
  p_screenshots jsonb default '[]'::jsonb,
  p_video_url text default null,
  p_terms_text text default '',
  p_attribution_window_days smallint default 30
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_app public.apps%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_website text := nullif(btrim(coalesce(p_website_url, '')), '');
  v_ios text := nullif(btrim(coalesce(p_ios_store_url, '')), '');
  v_android text := nullif(btrim(coalesce(p_android_store_url, '')), '');
  v_logo text := nullif(btrim(coalesce(p_logo_url, '')), '');
  v_cover text := nullif(btrim(coalesce(p_cover_image_url, '')), '');
  v_video text := nullif(btrim(coalesce(p_video_url, '')), '');
  v_screenshots jsonb := coalesce(p_screenshots, '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_app_id is null or not private.is_app_org_owner(p_app_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_app from public.apps where id = p_app_id for update;
  if not found then
    raise exception 'app_not_found' using errcode = 'P0002';
  end if;

  if char_length(v_name) not between 2 and 80 then
    raise exception 'invalid_app_name' using errcode = '22023';
  end if;

  if v_slug = '' then
    v_slug := v_app.slug;
  end if;

  if char_length(v_slug) not between 2 and 60 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_app_slug' using errcode = '22023';
  end if;

  if exists (select 1 from public.apps where slug = v_slug and id <> p_app_id)
    or exists (select 1 from public.app_releases where slug = v_slug and app_id <> p_app_id)
  then
    raise exception 'slug_already_taken' using errcode = '23505';
  end if;

  if char_length(coalesce(p_tagline, '')) > 160 then
    raise exception 'invalid_app_tagline' using errcode = '22023';
  end if;

  if char_length(coalesce(p_description, '')) > 10000 then
    raise exception 'invalid_app_description' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_categories, '{}')) > 3 then
    raise exception 'invalid_app_categories' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_platforms, '{}')) > 4 then
    raise exception 'invalid_app_platforms' using errcode = '22023';
  end if;

  if not private.is_valid_language_codes(coalesce(p_languages, '{}')) then
    raise exception 'invalid_app_languages' using errcode = '22023';
  end if;

  if v_website is not null and not private.is_valid_https_url(v_website) then
    raise exception 'invalid_website_url' using errcode = '22023';
  end if;

  if v_ios is not null and not private.is_valid_https_url(v_ios) then
    raise exception 'invalid_ios_store_url' using errcode = '22023';
  end if;

  if v_android is not null and not private.is_valid_https_url(v_android) then
    raise exception 'invalid_android_store_url' using errcode = '22023';
  end if;

  if v_logo is not null and not private.is_valid_media_url(v_logo) then
    raise exception 'invalid_logo_url' using errcode = '22023';
  end if;

  if v_cover is not null and not private.is_valid_media_url(v_cover) then
    raise exception 'invalid_cover_image_url' using errcode = '22023';
  end if;

  if v_video is not null and not private.is_valid_media_url(v_video) then
    raise exception 'invalid_video_url' using errcode = '22023';
  end if;

  if not private.is_valid_screenshots(v_screenshots) then
    raise exception 'invalid_screenshots' using errcode = '22023';
  end if;

  if coalesce(p_attribution_window_days, 30) not between 1 and 365 then
    raise exception 'invalid_attribution_window' using errcode = '22023';
  end if;

  update public.apps
  set name = v_name,
      slug = v_slug,
      tagline = btrim(coalesce(p_tagline, '')),
      description = btrim(coalesce(p_description, '')),
      categories = coalesce(p_categories, '{}'),
      platforms = coalesce(p_platforms, '{}'),
      languages = coalesce(p_languages, '{}'),
      website_url = v_website,
      ios_store_url = v_ios,
      android_store_url = v_android,
      logo_url = v_logo,
      cover_image_url = v_cover,
      screenshots = v_screenshots,
      video_url = v_video,
      terms_text = btrim(coalesce(p_terms_text, '')),
      attribution_window_days = coalesce(p_attribution_window_days, 30)
  where id = p_app_id;

  perform private.sync_app_media_assets(p_app_id, v_user_id);

  return p_app_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs: `public.upsert_app_plan` & `public.delete_app_plan`.
-- ---------------------------------------------------------------------------
create function public.upsert_app_plan(
  p_app_id uuid,
  p_name text,
  p_external_plan_key text,
  p_billing_interval public.billing_interval,
  p_price_minor bigint,
  p_currency text,
  p_commission_bps integer,
  p_sort_order smallint default 0,
  p_plan_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_ext_key text := btrim(coalesce(p_external_plan_key, ''));
  v_currency text := upper(btrim(coalesce(p_currency, '')));
  v_plan_id uuid;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_app_id is null or not private.is_app_org_owner(p_app_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  perform 1 from public.apps where id = p_app_id for update;

  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid_plan_name' using errcode = '22023';
  end if;

  if char_length(v_ext_key) not between 1 and 120 or v_ext_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception 'invalid_external_plan_key' using errcode = '22023';
  end if;

  if p_billing_interval is null then
    raise exception 'invalid_billing_interval' using errcode = '22023';
  end if;

  if p_price_minor is null or p_price_minor <= 0 or p_price_minor > 100000000000 then
    raise exception 'invalid_plan_price' using errcode = '22023';
  end if;

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid_plan_currency' using errcode = '22023';
  end if;

  if p_commission_bps is null or p_commission_bps not between 100 and 9000 then
    raise exception 'invalid_commission_bps' using errcode = '22023';
  end if;

  if p_plan_id is not null then
    update public.app_plans
    set name = v_name,
        external_plan_key = v_ext_key,
        billing_interval = p_billing_interval,
        price_minor = p_price_minor,
        currency = v_currency,
        commission_bps = p_commission_bps,
        sort_order = coalesce(p_sort_order, 0),
        is_active = true
    where id = p_plan_id and app_id = p_app_id
    returning id into v_plan_id;

    if v_plan_id is null then
      raise exception 'plan_not_found' using errcode = 'P0002';
    end if;
    return v_plan_id;
  end if;

  select count(*) into v_count from public.app_plans where app_id = p_app_id and is_active = true;
  if v_count >= 20 then
    raise exception 'plan_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.app_plans (
    app_id,
    name,
    external_plan_key,
    billing_interval,
    price_minor,
    currency,
    commission_bps,
    sort_order,
    is_active
  )
  values (
    p_app_id,
    v_name,
    v_ext_key,
    p_billing_interval,
    p_price_minor,
    v_currency,
    p_commission_bps,
    coalesce(p_sort_order, (v_count + 1)::smallint),
    true
  )
  on conflict (app_id, external_plan_key) do update
    set name = excluded.name,
        billing_interval = excluded.billing_interval,
        price_minor = excluded.price_minor,
        currency = excluded.currency,
        commission_bps = excluded.commission_bps,
        sort_order = excluded.sort_order,
        is_active = true
  returning id into v_plan_id;

  return v_plan_id;
end;
$$;

create function public.delete_app_plan(p_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_app_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select app_id into v_app_id from public.app_plans where id = p_plan_id;
  if not found then
    raise exception 'plan_not_found' using errcode = 'P0002';
  end if;

  if not private.is_app_org_owner(v_app_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  delete from public.app_plans where id = p_plan_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: `public.submit_app_for_review` — company submits draft to admin review.
-- ---------------------------------------------------------------------------
create function public.submit_app_for_review(p_app_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_app public.apps%rowtype;
  v_plan_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_app_id is null or not private.is_app_org_owner(p_app_id) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_app from public.apps where id = p_app_id for update;
  if not found then
    raise exception 'app_not_found' using errcode = 'P0002';
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

  if v_app.website_url is null
    and v_app.ios_store_url is null
    and v_app.android_store_url is null
  then
    raise exception 'app_destination_url_required' using errcode = '22023';
  end if;

  select count(*) into v_plan_count
  from public.app_plans
  where app_id = p_app_id and is_active = true;

  if coalesce(v_plan_count, 0) < 1 then
    raise exception 'app_requires_active_plan' using errcode = '22023';
  end if;

  update public.apps
  set status = 'submitted',
      submitted_at = now(),
      rejection_reason = null
  where id = p_app_id;

  insert into public.app_review_events (
    app_id,
    organization_id,
    event_type,
    environment,
    actor_id
  )
  values (
    p_app_id,
    v_app.organization_id,
    'submitted',
    v_app.publish_environment,
    v_user_id
  );

  return p_app_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: `public.admin_review_app` — administrator approves or rejects with reason.
-- ---------------------------------------------------------------------------
create function public.admin_review_app(
  p_app_id uuid,
  p_decision text,
  p_reason text default null,
  p_environment text default 'demo'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_app public.apps%rowtype;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_env text := lower(btrim(coalesce(p_environment, 'demo')));
  v_release_id uuid;
begin
  if v_user_id is null or not private.is_platform_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  select * into v_app from public.apps where id = p_app_id for update;
  if not found then
    raise exception 'app_not_found' using errcode = 'P0002';
  end if;

  if v_decision not in ('approve', 'reject') then
    raise exception 'invalid_review_decision' using errcode = '22023';
  end if;

  if v_decision = 'reject' then
    if v_reason is null or char_length(v_reason) < 5 or char_length(v_reason) > 2000 then
      raise exception 'rejection_reason_required' using errcode = '22023';
    end if;

    update public.apps
    set status = 'rejected',
        rejection_reason = v_reason,
        reviewed_at = now(),
        reviewed_by = v_user_id
    where id = p_app_id;

    insert into public.app_review_events (
      app_id,
      organization_id,
      event_type,
      environment,
      note,
      actor_id
    )
    values (
      p_app_id,
      v_app.organization_id,
      'rejected',
      v_app.publish_environment,
      v_reason,
      v_user_id
    );

    return p_app_id;
  end if;

  -- Approval path: live publication is blocked until verified integration & funding exist (Stages 6 & 8).
  if v_env = 'live' then
    raise exception 'live_publication_requires_verified_integration_and_funding' using errcode = 'P0001';
  end if;

  if v_env <> 'demo' then
    raise exception 'invalid_publish_environment' using errcode = '22023';
  end if;

  if v_app.website_url is null
    and v_app.ios_store_url is null
    and v_app.android_store_url is null
  then
    raise exception 'app_destination_url_required' using errcode = '22023';
  end if;

  v_release_id := private.publish_app_release(p_app_id, v_user_id);

  update public.apps
  set publish_environment = 'demo',
      reviewed_at = now(),
      reviewed_by = v_user_id,
      rejection_reason = null
  where id = p_app_id;

  perform private.sync_app_media_assets(p_app_id, v_user_id);

  insert into public.app_review_events (
    app_id,
    organization_id,
    event_type,
    environment,
    note,
    actor_id
  )
  values (
    p_app_id,
    v_app.organization_id,
    'approved',
    'demo',
    v_reason,
    v_user_id
  );

  return v_release_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security on new tables & creator visibility for joined companies.
-- ---------------------------------------------------------------------------
alter table public.app_review_events enable row level security;
alter table public.app_media_assets enable row level security;

create policy "app_review_events: read as org member or admin"
  on public.app_review_events
  for select to authenticated
  using (
    private.is_org_member(organization_id)
    or (select private.is_platform_admin())
  );

create policy "app_media_assets: public reads published app assets"
  on public.app_media_assets
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.app_releases r
      where r.app_id = app_media_assets.app_id
        and r.is_current_published = true
    )
  );

create policy "app_media_assets: org member or admin reads own"
  on public.app_media_assets
  for select to authenticated
  using (
    private.is_org_member(organization_id)
    or (select private.is_platform_admin())
  );

-- Allow companies to see the display name and social links of creators who have joined their app's program.
create function private.can_org_member_read_creator(p_creator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.creator_program_memberships m
    join public.apps a on a.id = m.app_id
    join public.organization_members om on om.organization_id = a.organization_id
    where m.creator_id = p_creator_id
      and om.user_id = (select auth.uid())
  );
$$;

create policy "profiles: org member reads joined program creators"
  on public.profiles
  for select to authenticated
  using ((select private.can_org_member_read_creator(id)));

create policy "creator_social_links: read as admin or joined program org member"
  on public.creator_social_links
  for select to authenticated
  using (
    (select private.is_platform_admin())
    or (select private.can_org_member_read_creator(creator_id))
  );

-- ---------------------------------------------------------------------------
-- Explicit minimal grants.
-- ---------------------------------------------------------------------------
revoke all on table
  public.app_review_events,
  public.app_media_assets
from public, anon, authenticated, service_role;

grant select on public.app_review_events to authenticated;

grant select (
  id, app_id, organization_id, asset_kind, storage_path, alt_text, mime_type, byte_size, created_at
) on public.app_media_assets to anon, authenticated;

grant select, insert, update, delete on
  public.app_review_events,
  public.app_media_assets
to service_role;

revoke all on function
  private.forbid_review_event_mutation(),
  private.enforce_media_asset_integrity(),
  private.sync_app_media_assets(uuid, uuid),
  private.can_org_member_read_creator(uuid),
  public.save_app_draft(
    uuid, text, text, text, text,
    public.app_category[], public.app_platform[], text[],
    text, text, text, text, text, jsonb, text, text, smallint
  ),
  public.upsert_app_plan(uuid, text, text, public.billing_interval, bigint, text, integer, smallint, uuid),
  public.delete_app_plan(uuid),
  public.submit_app_for_review(uuid),
  public.admin_review_app(uuid, text, text, text)
from public, anon, authenticated, service_role;

grant execute on function
  private.can_org_member_read_creator(uuid),
  public.save_app_draft(
    uuid, text, text, text, text,
    public.app_category[], public.app_platform[], text[],
    text, text, text, text, text, jsonb, text, text, smallint
  ),
  public.upsert_app_plan(uuid, text, text, public.billing_interval, bigint, text, integer, smallint, uuid),
  public.delete_app_plan(uuid),
  public.submit_app_for_review(uuid),
  public.admin_review_app(uuid, text, text, text)
to authenticated;
