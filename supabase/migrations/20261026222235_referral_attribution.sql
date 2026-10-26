-- E5: sandbox attribution. Policy is authoritative in private.attribution_policy().
-- No customer PII, browser fingerprints, payment processing or live attribution.
create function private.attribution_policy()
returns jsonb language sql immutable set search_path = '' as $$
  select '{"version":"sandbox-v1","window_days":30,"selection":"last_valid_click","explicit_code_wins":true,"live_enabled":false}'::jsonb;
$$;

create table private.attribution_api_keys (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  secret_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days')
);
create index attribution_api_keys_app_idx on private.attribution_api_keys(app_id);
alter table private.attribution_api_keys enable row level security;

create table public.referral_clicks (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  membership_id uuid not null references public.creator_program_memberships(id) on delete cascade,
  link_id uuid not null references public.creator_referral_links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index referral_clicks_app_idx on public.referral_clicks(app_id,clicked_at desc);
create index referral_clicks_creator_idx on public.referral_clicks(creator_id,clicked_at desc);
create index referral_clicks_membership_idx on public.referral_clicks(membership_id);
create index referral_clicks_link_idx on public.referral_clicks(link_id);

create table private.referral_click_receipts (
  token_hash text primary key,
  click_id uuid not null unique references public.referral_clicks(id) on delete cascade
);
alter table private.referral_click_receipts enable row level security;

create table private.referral_link_rate_limits (
  link_id uuid not null references public.creator_referral_links(id) on delete cascade,
  minute timestamptz not null,
  requests integer not null default 1,
  primary key(link_id,minute)
);
alter table private.referral_link_rate_limits enable row level security;

create table public.customer_referrals (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  creator_id uuid references public.creator_profiles(user_id) on delete cascade,
  membership_id uuid references public.creator_program_memberships(id) on delete cascade,
  link_id uuid references public.creator_referral_links(id) on delete cascade,
  click_id uuid references public.referral_clicks(id) on delete cascade,
  terms_version_id uuid references public.app_terms_versions(id) on delete cascade,
  source text not null check (source in ('link','code','unattributed')),
  registered_at timestamptz not null default now(),
  policy_version text not null,
  constraint customer_referrals_source_integrity check (
    (source = 'unattributed' and creator_id is null and membership_id is null and link_id is null and click_id is null and terms_version_id is null)
    or (source = 'code' and creator_id is not null and membership_id is not null and link_id is null and click_id is null and terms_version_id is not null)
    or (source = 'link' and creator_id is not null and membership_id is not null and link_id is not null and click_id is not null and terms_version_id is not null)
  )
);
create index customer_referrals_app_idx on public.customer_referrals(app_id,registered_at desc);
create index customer_referrals_creator_idx on public.customer_referrals(creator_id,registered_at desc);
create index customer_referrals_membership_idx on public.customer_referrals(membership_id);
create index customer_referrals_link_idx on public.customer_referrals(link_id);
create index customer_referrals_click_idx on public.customer_referrals(click_id);
create index customer_referrals_terms_idx on public.customer_referrals(terms_version_id);

-- External customer IDs are not exposed even to creators/company dashboard code.
-- Deterministic, app-scoped digest supports lookup by future payment adapters.
create table private.app_customer_identities (
  app_id uuid not null references public.apps(id) on delete cascade,
  customer_hash text not null,
  referral_id uuid not null unique references public.customer_referrals(id) on delete cascade,
  primary key(app_id,customer_hash)
);
alter table private.app_customer_identities enable row level security;
create table private.attribution_rate_limits (
  key_id uuid not null references private.attribution_api_keys(id) on delete cascade,
  minute timestamptz not null,
  requests integer not null default 1,
  primary key(key_id,minute)
);
alter table private.attribution_rate_limits enable row level security;

create function private.attribution_readable(p_app_id uuid, p_creator_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    p_creator_id = (select auth.uid()) or private.is_platform_admin()
    or exists(select 1 from public.apps a where a.id=p_app_id and private.is_org_member(a.organization_id))
  );
$$;
grant execute on function private.attribution_readable(uuid,uuid) to authenticated;
alter table public.referral_clicks enable row level security;
alter table public.customer_referrals enable row level security;
create policy referral_clicks_read on public.referral_clicks for select to authenticated
  using (private.attribution_readable(app_id,creator_id));
create policy customer_referrals_read on public.customer_referrals for select to authenticated
  using (private.attribution_readable(app_id,creator_id));
grant select on public.referral_clicks, public.customer_referrals to authenticated;

create function private.forbid_attribution_update()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'attribution_is_immutable' using errcode='42501'; end;
$$;
create trigger referral_clicks_immutable before update on public.referral_clicks
  for each row execute function private.forbid_attribution_update();
create trigger customer_referrals_immutable before update on public.customer_referrals
  for each row execute function private.forbid_attribution_update();
create trigger customer_identities_immutable before update on private.app_customer_identities
  for each row execute function private.forbid_attribution_update();

create function public.rotate_attribution_api_key(p_app_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_secret text;
begin
  select organization_id into v_org from public.apps where id=p_app_id for update;
  if v_org is null or not (coalesce(auth.jwt()->>'role','') = 'service_role' or private.is_org_owner(v_org)) then
    raise exception 'not_allowed' using errcode='42501';
  end if;
  update private.attribution_api_keys set revoked_at=now() where app_id=p_app_id and revoked_at is null;
  v_secret := 'blk_demo_' || replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  insert into private.attribution_api_keys(app_id,secret_hash)
    values(p_app_id,encode(sha256(convert_to(v_secret,'UTF8')),'hex'));
  return v_secret;
end;
$$;
revoke all on function public.rotate_attribution_api_key(uuid) from public,anon,authenticated,service_role;
grant execute on function public.rotate_attribution_api_key(uuid) to authenticated,service_role;

-- Read/validate target before inserting a click. Public RPC cannot accept a redirect URL.
create function public.record_referral_click(p_link_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_link public.creator_referral_links%rowtype; v_release public.app_releases%rowtype;
 v_target text; v_token text; v_click uuid; v_expiry timestamptz; v_rate integer; v_policy jsonb := private.attribution_policy();
begin
  if p_link_token is null or length(p_link_token)>48 then raise exception 'invalid_link' using errcode='22023'; end if;
  select * into v_link from public.creator_referral_links where token=p_link_token;
  if not found then raise exception 'invalid_link' using errcode='P0002'; end if;
  select * into v_release from public.app_releases where app_id=v_link.app_id and is_current_published;
  if not found or not exists(select 1 from public.apps a where a.id=v_release.app_id and a.publish_environment='demo') then raise exception 'program_unavailable' using errcode='22023'; end if;
  -- The sandbox policy must agree with the advertised window, never silently override it.
  if (select attribution_window_days from public.app_terms_versions where id=v_release.terms_version_id) <> (v_policy->>'window_days')::integer then
    raise exception 'unsupported_attribution_policy' using errcode='22023';
  end if;
  select o_url into v_target from private.resolve_app_destination(v_link.app_id,v_link.destination_kind);
  if v_target is null or v_target !~ '^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]+)?([/?#]|$)'
     or v_target ~ '[[:space:]\\]' then
    raise exception 'unsafe_redirect' using errcode='22023';
  end if;
  insert into private.referral_link_rate_limits(link_id,minute) values(v_link.id,date_trunc('minute',now()))
    on conflict(link_id,minute) do update set requests=private.referral_link_rate_limits.requests+1 returning requests into v_rate;
  if v_rate>300 then raise exception 'click_rate_limited' using errcode='22023'; end if;
  delete from private.referral_link_rate_limits where link_id=v_link.id and minute<date_trunc('minute',now())-interval '1 minute';
  v_token := 'blc_' || replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  v_expiry := now() + make_interval(days => (v_policy->>'window_days')::integer);
  insert into public.referral_clicks(app_id,creator_id,membership_id,link_id,expires_at)
    values(v_link.app_id,v_link.creator_id,v_link.membership_id,v_link.id,v_expiry) returning id into v_click;
  insert into private.referral_click_receipts(token_hash,click_id)
    values(encode(sha256(convert_to(v_token,'UTF8')),'hex'),v_click);
  return jsonb_build_object('destination',v_target,'destination_kind',v_link.destination_kind,
    'token',case when v_link.destination_kind='website' then v_token else null end,'expires_at',v_expiry);
end;
$$;
revoke all on function public.record_referral_click(text) from public,anon,authenticated,service_role;
grant execute on function public.record_referral_click(text) to anon,authenticated;

create function public.register_referred_customer(
  p_api_key text, p_customer_id text, p_click_tokens text[] default '{}', p_code text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_key private.attribution_api_keys%rowtype; v_hash text; v_existing uuid;
 v_member public.creator_program_memberships%rowtype; v_click public.referral_clicks%rowtype;
 v_release public.app_releases%rowtype; v_ref uuid; v_source text := 'unattributed';
 v_count integer; v_rate integer; v_policy jsonb := private.attribution_policy();
begin
  if p_api_key is null or length(p_api_key)>100 then raise exception 'invalid_api_key' using errcode='28000'; end if;
  select * into v_key from private.attribution_api_keys
    where secret_hash=encode(sha256(convert_to(p_api_key,'UTF8')),'hex') and revoked_at is null and expires_at>now()
    for share;
  if not found then raise exception 'invalid_api_key' using errcode='28000'; end if;
  -- Stable body and bounded list; external IDs must be opaque, not email/name/phone fields.
  if p_customer_id is null or p_customer_id !~ '^[A-Za-z0-9_-]{1,128}$'
    or coalesce(cardinality(p_click_tokens),0)>10 or length(coalesce(p_code,''))>24 then
    raise exception 'invalid_registration' using errcode='22023';
  end if;
  insert into private.attribution_rate_limits(key_id,minute) values(v_key.id,date_trunc('minute',now()))
    on conflict(key_id,minute) do update set requests=private.attribution_rate_limits.requests+1 returning requests into v_rate;
  delete from private.attribution_rate_limits where key_id=v_key.id and minute<date_trunc('minute',now())-interval '1 minute';
  -- Return instead of raising so the throttle counter is committed on rejection.
  if v_rate>120 then return jsonb_build_object('error','rate_limited'); end if;
  v_hash := encode(sha256(convert_to(v_key.app_id::text || ':' || p_customer_id,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_key.app_id::text || ':' || v_hash,0));
  select referral_id into v_existing from private.app_customer_identities where app_id=v_key.app_id and customer_hash=v_hash;
  if found then
    return jsonb_build_object('id',v_existing,'created',false,'source',(select source from public.customer_referrals where id=v_existing));
  end if;
  select * into v_release from public.app_releases where app_id=v_key.app_id and is_current_published;
  if not found or not exists(select 1 from public.apps a where a.id=v_release.app_id and a.publish_environment='demo') then raise exception 'program_unavailable' using errcode='22023'; end if;
  if (select attribution_window_days from public.app_terms_versions where id=v_release.terms_version_id) <> (v_policy->>'window_days')::integer then
    raise exception 'unsupported_attribution_policy' using errcode='22023';
  end if;
  if nullif(btrim(p_code),'') is not null then
    select * into v_member from public.creator_program_memberships where app_id=v_key.app_id and referral_code=upper(btrim(p_code));
    if not found then raise exception 'invalid_referral_code' using errcode='22023'; end if;
    v_source := 'code';
  elsif coalesce(cardinality(p_click_tokens),0)>0 then
    select count(distinct r.token_hash) into v_count from private.referral_click_receipts r
      join public.referral_clicks c on c.id=r.click_id
      where c.app_id=v_key.app_id and r.token_hash in (select encode(sha256(convert_to(t,'UTF8')),'hex') from unnest(p_click_tokens) t);
    if v_count <> cardinality(p_click_tokens) then raise exception 'invalid_click_token' using errcode='22023'; end if;
    select c.* into v_click from private.referral_click_receipts r join public.referral_clicks c on c.id=r.click_id
      where c.app_id=v_key.app_id and c.clicked_at<=now() and c.expires_at>now()
      and r.token_hash in (select encode(sha256(convert_to(t,'UTF8')),'hex') from unnest(p_click_tokens) t)
      order by c.clicked_at desc,c.id desc limit 1;
    if not found then raise exception 'expired_click_token' using errcode='22023'; end if;
    select * into v_member from public.creator_program_memberships where id=v_click.membership_id and app_id=v_key.app_id;
    if not found then raise exception 'invalid_click_token' using errcode='22023'; end if;
    v_source := 'link';
  end if;
  insert into public.customer_referrals(app_id,creator_id,membership_id,link_id,click_id,terms_version_id,source,policy_version)
    values(v_key.app_id,v_member.creator_id,v_member.id,v_click.link_id,v_click.id,
      case when v_source<>'unattributed' then v_release.terms_version_id end,v_source,v_policy->>'version') returning id into v_ref;
  insert into private.app_customer_identities(app_id,customer_hash,referral_id) values(v_key.app_id,v_hash,v_ref);
  return jsonb_build_object('id',v_ref,'created',true,'source',v_source);
end;
$$;
revoke all on function public.register_referred_customer(text,text,text[],text) from public,anon,authenticated,service_role;
grant execute on function public.register_referred_customer(text,text,text[],text) to anon;

-- Authorized creators keep access to the terms/rates snapshotted at customer registration.
create function private.has_customer_terms(p_terms_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.customer_referrals r where r.terms_version_id=p_terms_id and r.creator_id=(select auth.uid()));
$$;
grant execute on function private.has_customer_terms(uuid) to authenticated;

-- Extend the existing single SELECT policy per role instead of adding permissive duplicates.
alter policy "app_terms_versions: authenticated access" on public.app_terms_versions
 using (
   private.is_app_org_member(app_id) or (select private.is_platform_admin())
   or exists(select 1 from public.app_releases r where r.terms_version_id=app_terms_versions.id and r.is_current_published)
   or exists(select 1 from public.creator_program_memberships m where m.accepted_terms_version_id=app_terms_versions.id and m.creator_id=(select auth.uid()))
   or private.has_customer_terms(id)
 );
alter policy "app_terms_plan_rates: authenticated access" on public.app_terms_plan_rates
 using (
   (select private.is_platform_admin())
   or exists(select 1 from public.app_terms_versions t where t.id=app_terms_plan_rates.terms_version_id and private.is_app_org_member(t.app_id))
   or exists(select 1 from public.app_releases r where r.terms_version_id=app_terms_plan_rates.terms_version_id and r.is_current_published)
   or exists(select 1 from public.creator_program_memberships m where m.accepted_terms_version_id=app_terms_plan_rates.terms_version_id and m.creator_id=(select auth.uid()))
   or private.has_customer_terms(terms_version_id)
 );

-- Invoker aggregation preserves the caller's RLS; never a global admin projection.
create function public.attribution_summary(p_app_id uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
   'clicks',(select count(*) from public.referral_clicks where p_app_id is null or app_id=p_app_id),
   'registrations',(select count(*) from public.customer_referrals where source<>'unattributed' and (p_app_id is null or app_id=p_app_id)),
   'code_registrations',(select count(*) from public.customer_referrals where source='code' and (p_app_id is null or app_id=p_app_id)),
   'unattributed',(select count(*) from public.customer_referrals where source='unattributed' and (p_app_id is null or app_id=p_app_id)),
   'links',coalesce((select jsonb_agg(to_jsonb(metrics)) from (
     select ids.link_id,
       coalesce((select label from public.creator_referral_links l where l.id=ids.link_id),'Link #'||left(ids.link_id::text,8)) label,
       (select count(*) from public.referral_clicks c where c.link_id=ids.link_id) clicks,
       (select count(*) from public.customer_referrals r where r.link_id=ids.link_id) registrations
     from (
       select link_id from public.referral_clicks where p_app_id is null or app_id=p_app_id
       union select id from public.creator_referral_links where p_app_id is null or app_id=p_app_id
     ) ids order by ids.link_id limit 100
   ) metrics),'[]'::jsonb)
 );
$$;
revoke all on function public.attribution_summary(uuid) from public,anon,authenticated,service_role;
grant execute on function public.attribution_summary(uuid) to authenticated;
