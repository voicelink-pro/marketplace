-- Repair Stage 1–4 access boundaries and review consistency before attribution.
-- Existing migrations remain unchanged for deployed databases.

create policy "app_terms_versions: creator reads accepted history"
  on public.app_terms_versions for select to authenticated
  using (exists (
    select 1 from public.creator_program_memberships m
    where m.accepted_terms_version_id = app_terms_versions.id
      and m.creator_id = (select auth.uid())
  ));

create policy "app_terms_plan_rates: creator reads accepted history"
  on public.app_terms_plan_rates for select to authenticated
  using (exists (
    select 1 from public.creator_program_memberships m
    where m.accepted_terms_version_id = app_terms_plan_rates.terms_version_id
      and m.creator_id = (select auth.uid())
  ));

-- The release already contains public asset references. This table is a PRIVATE
-- inventory of the working draft, not a public projection of the approved media.
drop policy "app_media_assets: public reads published app assets" on public.app_media_assets;
revoke all on public.app_media_assets from anon;
revoke select (external_plan_key, plan_id) on public.app_terms_plan_rates from authenticated;

-- Invalidate stale admin screens on every profile/plan edit and resubmission.
alter table public.apps add column review_revision bigint not null default 0
  check (review_revision >= 0);

create function private.invalidate_app_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (to_jsonb(new) - array['status','review_revision','submitted_at','reviewed_at',
      'reviewed_by','rejection_reason','published_at','created_at','updated_at','created_by','publish_environment'])
    is distinct from
     (to_jsonb(old) - array['status','review_revision','submitted_at','reviewed_at',
      'reviewed_by','rejection_reason','published_at','created_at','updated_at','created_by','publish_environment'])
  then
    new.review_revision := old.review_revision + 1;
    new.status := 'draft';
    new.submitted_at := null;
    new.rejection_reason := null;
  end if;
  return new;
end;
$$;
create trigger apps_invalidate_review before update on public.apps
  for each row execute function private.invalidate_app_review();

create function private.invalidate_plan_review()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_app_id uuid;
begin
  if tg_op = 'UPDATE' and new is not distinct from old then return new; end if;
  v_app_id := case when tg_op = 'DELETE' then old.app_id else new.app_id end;
  update public.apps set review_revision = review_revision + 1,
    status = 'draft', submitted_at = null, rejection_reason = null
  where id = v_app_id;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
create trigger app_plans_invalidate_review after insert or update or delete on public.app_plans
  for each row execute function private.invalidate_plan_review();

create function private.invalidate_organization_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.name is distinct from old.name then
    update public.apps set review_revision = review_revision + 1,
      status = 'draft', submitted_at = null, rejection_reason = null
    where organization_id = new.id;
  end if;
  return new;
end;
$$;
create trigger organizations_invalidate_review after update of name on public.organizations
  for each row execute function private.invalidate_organization_review();

create or replace function public.delete_app_plan(p_plan_id uuid)
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

  perform 1 from public.apps where id = v_app_id for update;
  update public.app_plans set is_active = false where id = p_plan_id and is_active;
end;
$$;

create or replace function public.upsert_app_plan(
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

  select count(*) into v_count from public.app_plans where app_id = p_app_id and is_active;
  if v_count >= 20 and not exists (
    select 1 from public.app_plans where app_id = p_app_id and is_active
      and (id = p_plan_id or (p_plan_id is null and external_plan_key = v_ext_key))
  ) then
    raise exception 'plan_limit_reached' using errcode = 'P0001';
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

create or replace function public.submit_app_for_review(p_app_id uuid)
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

  if v_app.status = 'submitted' then return p_app_id; end if;

  update public.apps
  set review_revision = review_revision + 1,
      status = 'submitted',
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

-- Old public publisher must not bypass the audited review workflow.
revoke all on function public.admin_publish_app(uuid) from public, anon, authenticated, service_role;
drop function public.admin_review_app(uuid, text, text, text);
create or replace function public.admin_review_app(
  p_app_id uuid,
  p_decision text,
  p_reason text default null,
  p_environment text default 'demo',
  p_expected_revision bigint default null
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

  if p_expected_revision is null or p_expected_revision <> v_app.review_revision then
    raise exception 'stale_review_revision' using errcode = 'P0001';
  end if;
  if v_app.status <> 'submitted' then
    raise exception 'app_not_submitted' using errcode = 'P0001';
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
revoke all on function public.admin_review_app(uuid,text,text,text,bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.admin_review_app(uuid,text,text,text,bigint) to authenticated;
revoke all on function private.invalidate_app_review(), private.invalidate_plan_review(),
  private.invalidate_organization_review() from public, anon, authenticated, service_role;
