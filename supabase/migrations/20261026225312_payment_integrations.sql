-- E6 only. No commission calculation, balances, funding or payouts.
create table private.payment_backend_access (token_hash text primary key, expires_at timestamptz not null default(now()+interval '90 days'));
alter table private.payment_backend_access enable row level security;
create function public.set_payment_backend_token(p_token text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_token is null or length(p_token) not between 40 and 200 then raise exception 'invalid_backend_token'; end if;
 insert into private.payment_backend_access(token_hash) values(encode(sha256(convert_to(p_token,'UTF8')),'hex')) on conflict(token_hash) do update set expires_at=now()+interval '90 days';
end; $$;
revoke all on function public.set_payment_backend_token(text) from public,anon,authenticated,service_role;
grant execute on function public.set_payment_backend_token(text) to service_role;
create function public.revoke_payment_backend_token(p_token text) returns void language sql security definer set search_path='' as $$
 delete from private.payment_backend_access where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
$$;
revoke all on function public.revoke_payment_backend_token(text) from public,anon,authenticated,service_role;
grant execute on function public.revoke_payment_backend_token(text) to service_role;
create function private.require_payment_backend(p_token text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_token is null or length(p_token) not between 40 and 200 or not exists(select 1 from private.payment_backend_access where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and expires_at>now()) then
 raise exception 'invalid_backend_token' using errcode='42501'; end if;
end; $$;

create table public.payment_integrations (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 provider text not null check(provider in ('stripe','revenuecat','generic')),
 environment text not null check(environment in ('sandbox','live')),
 provider_account_id text not null check(length(provider_account_id) between 1 and 200),
 credential_ref text not null check(credential_ref ~ '^[A-Z][A-Z0-9_]{2,79}$'),
 configured_at timestamptz not null default now(), last_received_at timestamptz, last_processed_at timestamptz, verified_at timestamptz,
 unique(app_id,provider,environment), unique(credential_ref)
);
create index payment_integrations_app_idx on public.payment_integrations(app_id);
create table public.payment_sources (
 app_id uuid not null references public.apps(id) on delete cascade, environment text not null check(environment in('sandbox','live')),
 store text not null check(store in('stripe','app_store','play_store','generic')),
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 primary key(app_id,environment,store)
);
create index payment_sources_integration_idx on public.payment_sources(integration_id);
create table public.payment_plan_mappings (
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 app_id uuid not null references public.apps(id) on delete cascade,
 external_plan_id text not null check(length(external_plan_id) between 1 and 200),
 plan_id uuid not null references public.app_plans(id) on delete cascade,
 primary key(integration_id,external_plan_id)
);
create index payment_plan_mappings_app_idx on public.payment_plan_mappings(app_id);
create index payment_plan_mappings_plan_idx on public.payment_plan_mappings(plan_id);
create table private.payment_customer_mappings (
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 provider_customer_id text not null,
 referral_id uuid not null references public.customer_referrals(id) on delete cascade,
 primary key(integration_id,provider_customer_id)
);
create index payment_customer_mappings_referral_idx on private.payment_customer_mappings(referral_id);
alter table private.payment_customer_mappings enable row level security;
create table private.payment_transaction_aliases (
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 provider_ref text not null, canonical_ref text not null,
 primary key(integration_id,provider_ref)
);
alter table private.payment_transaction_aliases enable row level security;
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 app_id uuid not null references public.apps(id) on delete cascade,
 environment text not null check(environment in('sandbox','live')),
 event_ref text not null, digest text not null,
 status text not null default 'pending' check(status in('pending','processing','waiting','processed','failed','ignored','blocked')),
 kind text, error_code text, attempts integer not null default 0, conflicting_deliveries integer not null default 0,
 received_at timestamptz not null default now(), processed_at timestamptz,
 next_attempt_at timestamptz not null default now(), lease uuid, lease_until timestamptz,
 unique(integration_id,event_ref)
);
create index payment_events_app_idx on public.payment_events(app_id,received_at desc);
create index payment_events_queue_idx on public.payment_events(status,next_attempt_at);
create table private.payment_event_payloads (
 event_id uuid primary key references public.payment_events(id) on delete cascade,
 raw_body text not null check(octet_length(raw_body)<=131072), normalized jsonb
);
alter table private.payment_event_payloads enable row level security;
create table private.payment_ingress_limits (
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 minute timestamptz not null, requests integer not null default 1, primary key(integration_id,minute)
);
alter table private.payment_ingress_limits enable row level security;

create table public.payment_subscriptions (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 environment text not null check(environment in('sandbox','live')),
 referral_id uuid not null references public.customer_referrals(id) on delete cascade,
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 state text not null default 'unknown' check(state in('active','trialing','past_due','canceled','expired','paused','unknown')),
 auto_renew boolean, paid_until timestamptz,
 state_at timestamptz not null default '-infinity', state_event text not null default ''
);
create index payment_subscriptions_app_idx on public.payment_subscriptions(app_id,environment);
create index payment_subscriptions_referral_idx on public.payment_subscriptions(referral_id);
create index payment_subscriptions_integration_idx on public.payment_subscriptions(integration_id);
create table private.payment_subscription_keys (
 integration_id uuid not null references public.payment_integrations(id) on delete cascade,
 provider_subscription_id text not null,
 subscription_id uuid not null unique references public.payment_subscriptions(id) on delete cascade,
 primary key(integration_id,provider_subscription_id)
);
alter table private.payment_subscription_keys enable row level security;
create table public.payment_transactions (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 environment text not null check(environment in('sandbox','live')),
 referral_id uuid not null references public.customer_referrals(id) on delete cascade,
 subscription_id uuid not null references public.payment_subscriptions(id) on delete cascade,
 plan_id uuid not null references public.app_plans(id) on delete cascade,
 plan_name text not null, amount_minor bigint not null check(amount_minor>=0), currency text not null check(currency ~ '^[A-Z]{3}$'),
 is_trial boolean not null, kind text not null check(kind in('purchase','renewal')),
 occurred_at timestamptz not null, period_end timestamptz not null
);
create index payment_transactions_plan_idx on public.payment_transactions(plan_id);
create index payment_transactions_app_idx on public.payment_transactions(app_id,environment);
create index payment_transactions_referral_idx on public.payment_transactions(referral_id);
create index payment_transactions_subscription_idx on public.payment_transactions(subscription_id);
create table private.payment_transaction_keys (
 app_id uuid not null references public.apps(id) on delete cascade, environment text not null,
 store text not null, provider_transaction_id text not null,
 transaction_id uuid not null unique references public.payment_transactions(id) on delete cascade,
 primary key(app_id,environment,store,provider_transaction_id)
);
alter table private.payment_transaction_keys enable row level security;
create table public.payment_adjustments (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 environment text not null, referral_id uuid not null references public.customer_referrals(id) on delete cascade,
 transaction_id uuid not null references public.payment_transactions(id) on delete cascade,
 kind text not null check(kind in('refund','dispute')), state text not null,
 amount_minor bigint not null check(amount_minor>=0), occurred_at timestamptz not null, event_ref text not null
);
create index payment_adjustments_app_idx on public.payment_adjustments(app_id,environment);
create index payment_adjustments_referral_idx on public.payment_adjustments(referral_id);
create index payment_adjustments_transaction_idx on public.payment_adjustments(transaction_id);
create table private.payment_adjustment_keys (
 app_id uuid not null references public.apps(id) on delete cascade, environment text not null, store text not null,
 adjustment_ref text not null, adjustment_id uuid not null unique references public.payment_adjustments(id) on delete cascade,
 primary key(app_id,environment,store,adjustment_ref)
);
alter table private.payment_adjustment_keys enable row level security;
create table public.customer_payment_timeline (
 event_id uuid primary key references public.payment_events(id) on delete cascade,
 app_id uuid not null references public.apps(id) on delete cascade,
 environment text not null, referral_id uuid not null references public.customer_referrals(id) on delete cascade,
 kind text not null, state text, occurred_at timestamptz not null, amount_minor bigint, currency text
);
create index customer_payment_timeline_app_idx on public.customer_payment_timeline(app_id,occurred_at desc);
create index customer_payment_timeline_referral_idx on public.customer_payment_timeline(referral_id,occurred_at desc);

create function private.payment_readable(p_app uuid,p_referral uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.attribution_readable(p_app,(select creator_id from public.customer_referrals where id=p_referral));
$$;
grant execute on function private.payment_readable(uuid,uuid) to authenticated;
do $$ declare t text; begin
 foreach t in array array['payment_integrations','payment_sources','payment_plan_mappings','payment_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_read on public.%I for select to authenticated using(private.is_app_org_member(app_id) or (select private.is_platform_admin()))',t);
 end loop;
 foreach t in array array['payment_transactions','payment_subscriptions','payment_adjustments','customer_payment_timeline'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy scoped_read on public.%I for select to authenticated using(private.payment_readable(app_id,referral_id))',t);
 end loop;
end $$;
grant select on public.payment_integrations, public.payment_sources, public.payment_plan_mappings to authenticated;
grant select(id,integration_id,app_id,environment,event_ref,status,kind,error_code,attempts,conflicting_deliveries,received_at,processed_at,next_attempt_at) on public.payment_events to authenticated;
grant select(id,app_id,environment,referral_id,subscription_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end) on public.payment_transactions to authenticated;
grant select on public.payment_subscriptions,public.payment_adjustments,public.customer_payment_timeline to authenticated;

create function public.configure_payment_integration(p_app_id uuid,p_provider text,p_environment text,p_account text,p_credential_ref text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not private.is_app_org_owner(p_app_id) then raise exception 'not_allowed' using errcode='42501'; end if;
 select id into v_id from public.payment_integrations where app_id=p_app_id and provider=p_provider and environment=p_environment for update;
 if found then
   if exists(select 1 from public.payment_events where integration_id=v_id) and exists(select 1 from public.payment_integrations where id=v_id and provider_account_id<>p_account) then raise exception 'account_locked_after_events'; end if;
   update public.payment_integrations set provider_account_id=p_account,credential_ref=p_credential_ref,configured_at=now(),verified_at=null where id=v_id;
 else
   insert into public.payment_integrations(app_id,provider,environment,provider_account_id,credential_ref) values(p_app_id,p_provider,p_environment,p_account,p_credential_ref) returning id into v_id;
 end if;
 return v_id;
end; $$;
create function public.set_payment_source(p_integration uuid,p_store text) returns void language plpgsql security definer set search_path='' as $$
declare v_i public.payment_integrations%rowtype; v_old uuid;
begin
 select * into v_i from public.payment_integrations where id=p_integration;
 if not found or not private.is_app_org_owner(v_i.app_id) then raise exception 'not_allowed' using errcode='42501'; end if;
 if (v_i.provider='stripe' and p_store<>'stripe') or (v_i.provider='revenuecat' and p_store not in('stripe','app_store','play_store')) then raise exception 'invalid_store'; end if;
 perform 1 from public.apps where id=v_i.app_id for update;
 select integration_id into v_old from public.payment_sources where app_id=v_i.app_id and environment=v_i.environment and store=p_store;
 if v_old is not null and v_old<>p_integration and exists(select 1 from private.payment_transaction_keys where app_id=v_i.app_id and environment=v_i.environment and store=p_store) then raise exception 'source_locked_after_purchase'; end if;
 insert into public.payment_sources(app_id,environment,store,integration_id) values(v_i.app_id,v_i.environment,p_store,p_integration)
 on conflict(app_id,environment,store) do update set integration_id=excluded.integration_id;
end; $$;
create function public.map_payment_plan(p_integration uuid,p_external_id text,p_plan_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_app uuid; v_old uuid;
begin
 select app_id into v_app from public.payment_integrations where id=p_integration;
 if not private.is_app_org_owner(v_app) then raise exception 'not_allowed' using errcode='42501'; end if;
 if not exists(select 1 from public.app_plans where id=p_plan_id and app_id=v_app) then raise exception 'invalid_plan'; end if;
 select plan_id into v_old from public.payment_plan_mappings where integration_id=p_integration and external_plan_id=p_external_id;
 if v_old is not null and v_old<>p_plan_id then raise exception 'mapping_is_immutable'; end if;
 insert into public.payment_plan_mappings(integration_id,app_id,external_plan_id,plan_id) values(p_integration,v_app,p_external_id,p_plan_id) on conflict do nothing;
end; $$;
create function public.map_payment_customer(p_integration uuid,p_provider_customer text,p_customer_id text,p_app_api_key text default null) returns void language plpgsql security definer set search_path='' as $$
declare v_app uuid; v_ref uuid; v_old uuid;
begin
 select app_id into v_app from public.payment_integrations where id=p_integration;
 if v_app is null or not (private.is_app_org_owner(v_app) or exists(select 1 from private.attribution_api_keys where app_id=v_app and revoked_at is null and expires_at>now() and secret_hash=encode(sha256(convert_to(p_app_api_key,'UTF8')),'hex'))) then raise exception 'not_allowed' using errcode='42501'; end if;
 if p_customer_id !~ '^[A-Za-z0-9_-]{1,128}$' or p_provider_customer !~ '^[A-Za-z0-9_$:.\/-]{1,200}$' then raise exception 'invalid_customer_mapping'; end if;
 select referral_id into v_ref from private.app_customer_identities where app_id=v_app and customer_hash=encode(sha256(convert_to(v_app::text||':'||p_customer_id,'UTF8')),'hex');
 if v_ref is null then raise exception 'customer_not_registered'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_integration::text||p_provider_customer,1));
 select referral_id into v_old from private.payment_customer_mappings where integration_id=p_integration and provider_customer_id=p_provider_customer;
 if v_old is not null and v_old<>v_ref then raise exception 'mapping_is_immutable'; end if;
 insert into private.payment_customer_mappings values(p_integration,p_provider_customer,v_ref) on conflict do nothing;
end; $$;
create function public.map_payment_transaction_reference(p_integration uuid,p_reference text,p_transaction text) returns void language plpgsql security definer set search_path='' as $$
declare v_app uuid; v_old text;
begin
 select app_id into v_app from public.payment_integrations where id=p_integration;
 if not private.is_app_org_owner(v_app) then raise exception 'not_allowed' using errcode='42501'; end if;
 if p_reference !~ '^[A-Za-z0-9_$:.\/-]{1,200}$' or p_transaction !~ '^[A-Za-z0-9_$:.\/-]{1,200}$' then raise exception 'invalid_reference'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_integration::text||p_reference,2));
 select canonical_ref into v_old from private.payment_transaction_aliases where integration_id=p_integration and provider_ref=p_reference;
 if v_old is not null and v_old<>p_transaction then raise exception 'mapping_is_immutable'; end if;
 insert into private.payment_transaction_aliases values(p_integration,p_reference,p_transaction) on conflict do nothing;
end; $$;

create function public.payment_integration_for_ingest(p_backend text,p_integration uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform private.require_payment_backend(p_backend);
 return (select to_jsonb(i) from public.payment_integrations i where id=p_integration);
end; $$;
create function public.ingest_payment_event(p_backend text,p_integration uuid,p_event_ref text,p_environment text,p_raw text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_i public.payment_integrations%rowtype; v_id uuid; v_digest text; v_old text; v_rate integer;
begin
 perform private.require_payment_backend(p_backend);
 select * into v_i from public.payment_integrations where id=p_integration for no key update;
 if not found or v_i.environment<>p_environment then raise exception 'wrong_environment'; end if;
 if length(p_event_ref) not between 1 and 200 or octet_length(p_raw)>131072 then raise exception 'invalid_payload'; end if;
 insert into private.payment_ingress_limits values(p_integration,date_trunc('minute',now()),1) on conflict(integration_id,minute) do update set requests=private.payment_ingress_limits.requests+1 returning requests into v_rate;
 if v_rate>600 then return jsonb_build_object('error','rate_limited'); end if;
 delete from private.payment_ingress_limits where integration_id=p_integration and minute<now()-interval '2 minutes';
 v_digest:=encode(sha256(convert_to(p_raw,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_integration::text||p_event_ref,3));
 select id,digest into v_id,v_old from public.payment_events where integration_id=p_integration and event_ref=p_event_ref;
 if found then
   if v_old<>v_digest then update public.payment_events set conflicting_deliveries=conflicting_deliveries+1 where id=v_id; end if;
   return jsonb_build_object('id',v_id,'duplicate',true,'conflict',v_old<>v_digest);
 end if;
 insert into public.payment_events(integration_id,app_id,environment,event_ref,digest,status,error_code)
 values(p_integration,v_i.app_id,p_environment,p_event_ref,v_digest,case when p_environment='live' then 'blocked' else 'pending' end,case when p_environment='live' then 'live_processing_disabled' end) returning id into v_id;
 insert into private.payment_event_payloads(event_id,raw_body) values(v_id,p_raw);
 update public.payment_integrations set last_received_at=now() where id=p_integration;
 return jsonb_build_object('id',v_id,'duplicate',false,'conflict',false);
end; $$;
create function public.claim_payment_events(p_backend text,p_limit integer default 20,p_integration uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
 perform private.require_payment_backend(p_backend);
 update public.payment_events set status='failed',error_code='lease_attempts_exhausted',lease=null,lease_until=null where status='processing' and lease_until<now() and attempts>=10 and (p_integration is null or integration_id=p_integration);
 with picked as (
 select id from public.payment_events where environment='sandbox' and attempts<10 and (p_integration is null or integration_id=p_integration) and
 ((status in('pending','waiting') and next_attempt_at<=now()) or (status='processing' and lease_until<now()))
 order by next_attempt_at,id for update skip locked limit greatest(1,least(p_limit,50))
 ), claimed as (
 update public.payment_events e set status='processing',lease=gen_random_uuid(),lease_until=now()+interval '2 minutes',attempts=attempts+1
 from picked where e.id=picked.id returning e.*
 ) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease',c.lease,'provider',i.provider,'account',i.provider_account_id,'raw',p.raw_body)),'[]') into v_result
 from claimed c join public.payment_integrations i on i.id=c.integration_id join private.payment_event_payloads p on p.event_id=c.id;
 return v_result;
end; $$;
create function public.retry_payment_event(p_event uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_e public.payment_events%rowtype;
begin
 select * into v_e from public.payment_events where id=p_event for update;
 if not found or not private.is_app_org_owner(v_e.app_id) then raise exception 'not_allowed' using errcode='42501'; end if;
 if v_e.environment='live' or v_e.status in('processed','ignored','blocked') or (v_e.status='processing' and v_e.lease_until>now()) then raise exception 'event_not_retryable'; end if;
 update public.payment_events set status='pending',next_attempt_at=now(),attempts=0,lease=null,lease_until=null,error_code=null where id=p_event;
end; $$;

create function public.apply_payment_event(p_backend text,p_event uuid,p_lease uuid,p_normalized jsonb default null,p_failure text default null)
returns text language plpgsql security definer set search_path='' as $$
declare
 e public.payment_events%rowtype; i public.payment_integrations%rowtype; n jsonb:=p_normalized;
 v_kind text; v_store text; v_time timestamptz; v_customer uuid; v_sub uuid; v_plan public.app_plans%rowtype;
 v_tx uuid; v_old public.payment_transactions%rowtype; v_previous public.payment_adjustments%rowtype; v_canonical text; v_adjust uuid; v_alias text;
 v_amount bigint; v_currency text; v_end timestamptz; v_state text; v_error text; v_duplicate boolean:=false; v_integration uuid;
begin
 perform private.require_payment_backend(p_backend);
 select integration_id into v_integration from public.payment_events where id=p_event;
 perform 1 from public.payment_integrations where id=v_integration for no key update;
 select * into e from public.payment_events where id=p_event for update;
 if not found or e.status<>'processing' or e.lease is distinct from p_lease or e.lease_until<now() then raise exception 'stale_event_lease'; end if;
 begin
  if p_failure is not null or n is null then raise exception 'adapter_error'; end if;
  v_kind:=n->>'kind'; v_store:=n->>'store'; v_time:=(n->>'occurred_at')::timestamptz;
  if n->>'event_id' is distinct from e.event_ref or n->>'environment' is distinct from e.environment or v_time is null or v_time>now()+interval '5 minutes' or v_kind not in('purchase','renewal','subscription','refund','dispute','ignored') or v_store not in('stripe','app_store','play_store','generic') then raise exception 'invalid_normalized_event'; end if;
  if e.environment<>'sandbox' then raise exception 'live_processing_disabled'; end if;
  update private.payment_event_payloads set normalized=n where event_id=e.id;
  update public.payment_events set kind=v_kind where id=e.id;
  if v_kind='ignored' then update public.payment_events set status='ignored',processed_at=now(),lease=null,lease_until=null where id=e.id; return 'ignored'; end if;
  select * into i from public.payment_integrations where id=e.integration_id;
  perform 1 from public.apps where id=e.app_id for share;
  if not exists(select 1 from public.payment_sources where app_id=e.app_id and environment=e.environment and store=v_store) then raise exception 'waiting_source'; end if;
  if not exists(select 1 from public.payment_sources where app_id=e.app_id and environment=e.environment and store=v_store and integration_id=i.id) then
   update public.payment_events set status='ignored',error_code='secondary_source',processed_at=now(),lease=null,lease_until=null where id=e.id; return 'ignored';
  end if;
  -- Serialize one economic store per app, regardless of which webhook event ID delivered it.
  perform pg_advisory_xact_lock(hashtextextended(e.app_id::text||e.environment||v_store,4));
  if v_kind in('refund','dispute') then
   select canonical_ref into v_canonical from private.payment_transaction_aliases where integration_id=i.id and provider_ref=n->>'transaction_id';
   v_canonical:=coalesce(v_canonical,n->>'transaction_id');
   select transaction_id into v_tx from private.payment_transaction_keys where app_id=e.app_id and environment=e.environment and store=v_store and provider_transaction_id=v_canonical;
   if v_tx is null then raise exception 'waiting_transaction'; end if;
   select * into v_old from public.payment_transactions where id=v_tx;
   v_customer:=v_old.referral_id; v_sub:=v_old.subscription_id;
  else
   select referral_id into v_customer from private.payment_customer_mappings where integration_id=i.id and provider_customer_id=n->>'customer_id';
   if v_customer is null then raise exception 'waiting_customer_mapping'; end if;
   if nullif(n->>'subscription_id','') is null then raise exception 'invalid_subscription'; end if;
   select subscription_id into v_sub from private.payment_subscription_keys where integration_id=i.id and provider_subscription_id=n->>'subscription_id';
   if v_sub is null then
    insert into public.payment_subscriptions(app_id,environment,referral_id,integration_id) values(e.app_id,e.environment,v_customer,i.id) returning id into v_sub;
    insert into private.payment_subscription_keys values(i.id,n->>'subscription_id',v_sub);
   elsif not exists(select 1 from public.payment_subscriptions where id=v_sub and referral_id=v_customer) then raise exception 'subscription_customer_conflict'; end if;
  end if;
  if v_kind in('purchase','renewal','refund','dispute') then
   if (n->>'amount_minor') !~ '^[0-9]{1,16}$' or (n->>'currency') !~ '^[A-Z]{3}$' or n->>'amount_minor' is null or n->>'currency' is null then raise exception 'invalid_money'; end if;
   v_amount:=(n->>'amount_minor')::bigint; v_currency:=n->>'currency';
  end if;
  if v_kind in('purchase','renewal') then
   select p.* into v_plan from public.payment_plan_mappings m join public.app_plans p on p.id=m.plan_id where m.integration_id=i.id and m.external_plan_id=n->>'product_id' and p.app_id=e.app_id;
   if not found then raise exception 'waiting_plan_mapping'; end if;
   v_end:=(n->>'period_end')::timestamptz;
   if v_end is null or v_end<='1970-01-01'::timestamptz or nullif(n->>'transaction_id','') is null then raise exception 'invalid_payment_period'; end if;
   select transaction_id into v_tx from private.payment_transaction_keys where app_id=e.app_id and environment=e.environment and store=v_store and provider_transaction_id=n->>'transaction_id';
   if v_tx is not null then
    select * into v_old from public.payment_transactions where id=v_tx;
    v_duplicate:=true;
    if v_old.amount_minor<>v_amount or v_old.currency<>v_currency or v_old.referral_id<>v_customer or v_old.subscription_id<>v_sub or v_old.plan_id<>v_plan.id or v_old.period_end<>v_end or v_old.is_trial<>(n->>'is_trial')::boolean then raise exception 'transaction_conflict'; end if;
   else
    insert into public.payment_transactions(app_id,environment,referral_id,subscription_id,plan_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end)
    values(e.app_id,e.environment,v_customer,v_sub,v_plan.id,v_plan.name,v_amount,v_currency,coalesce((n->>'is_trial')::boolean,false),v_kind,v_time,v_end) returning id into v_tx;
    insert into private.payment_transaction_keys values(e.app_id,e.environment,v_store,n->>'transaction_id',v_tx);
   end if;
   for v_alias in select jsonb_array_elements_text(coalesce(n->'aliases','[]')) union select n->>'transaction_id' loop
    if exists(select 1 from private.payment_transaction_aliases where integration_id=i.id and provider_ref=v_alias and canonical_ref<>n->>'transaction_id') then raise exception 'transaction_alias_conflict'; end if;
    insert into private.payment_transaction_aliases values(i.id,v_alias,n->>'transaction_id') on conflict do nothing;
   end loop;
   if v_amount>0 and not coalesce((n->>'is_trial')::boolean,false) then update public.payment_subscriptions set paid_until=greatest(paid_until,v_end) where id=v_sub; end if;
  elsif v_kind in('refund','dispute') then
   if v_currency<>v_old.currency or v_amount>v_old.amount_minor or nullif(n->>'adjustment_id','') is null then raise exception 'adjustment_conflict'; end if;
   v_state:=n->>'adjustment_state';
   if (v_kind='refund' and v_state not in('pending','succeeded','failed','reversed')) or (v_kind='dispute' and v_state not in('open','won','lost')) or v_state is null then raise exception 'invalid_adjustment_state'; end if;
   select adjustment_id into v_adjust from private.payment_adjustment_keys where app_id=e.app_id and environment=e.environment and store=v_store and adjustment_ref=n->>'adjustment_id';
   if v_adjust is null then
    insert into public.payment_adjustments(app_id,environment,referral_id,transaction_id,kind,state,amount_minor,occurred_at,event_ref)
    values(e.app_id,e.environment,v_customer,v_tx,v_kind,v_state,v_amount,v_time,e.event_ref) returning id into v_adjust;
    insert into private.payment_adjustment_keys values(e.app_id,e.environment,v_store,n->>'adjustment_id',v_adjust);
   else
    if not exists(select 1 from public.payment_adjustments where id=v_adjust and transaction_id=v_tx and kind=v_kind) then raise exception 'adjustment_conflict'; end if;
    select * into v_previous from public.payment_adjustments where id=v_adjust;
    if v_previous.amount_minor<>v_amount then raise exception 'adjustment_conflict'; end if;
    if v_previous.occurred_at<v_time then
     update public.payment_adjustments set state=v_state,occurred_at=v_time,event_ref=e.event_ref where id=v_adjust;
    elsif v_previous.occurred_at=v_time then
     if v_previous.state=v_state then v_duplicate:=true;
     elsif v_previous.state in('pending','open') and v_state in('succeeded','failed','won','lost') then
      update public.payment_adjustments set state=v_state,event_ref=e.event_ref where id=v_adjust;
     elsif v_state in('pending','open') and v_previous.state in('succeeded','failed','won','lost') then v_duplicate:=true;
     else
      update public.payment_adjustments set state='needs_review' where id=v_adjust;
      v_error:='adjustment_order_ambiguous';
     end if;
    else v_duplicate:=true;
    end if;
   end if;
  end if;
  if v_kind='subscription' or (v_kind in('purchase','renewal') and (i.provider<>'stripe' or exists(select 1 from public.payment_subscriptions where id=v_sub and state_at='-infinity'::timestamptz))) then
   v_state:=coalesce(n->>'state','unknown');
   if exists(select 1 from public.payment_subscriptions where id=v_sub and state_at=v_time
    and (state<>v_state or (auto_renew is not null and n->>'auto_renew' is not null and auto_renew<>(n->>'auto_renew')::boolean))) then
    update public.payment_subscriptions set state='unknown' where id=v_sub;
    v_error:='subscription_order_ambiguous';
   else
    update public.payment_subscriptions set state=v_state,auto_renew=coalesce((n->>'auto_renew')::boolean,auto_renew),state_at=v_time,state_event=e.event_ref
    where id=v_sub and state_at<=v_time;
   end if;
  end if;
  if not v_duplicate then
  insert into public.customer_payment_timeline(event_id,app_id,environment,referral_id,kind,state,occurred_at,amount_minor,currency)
  values(e.id,e.app_id,e.environment,v_customer,v_kind,case when v_kind='subscription' and n->>'auto_renew'='false' and v_state='active' then 'cancel_scheduled' else coalesce(n->>'adjustment_state',v_state) end,v_time,v_amount,v_currency);
  end if;
  update public.payment_events set status='processed',error_code=coalesce(v_error,case when v_duplicate then case when v_kind in('refund','dispute') then 'duplicate_adjustment' else 'duplicate_transaction' end end),processed_at=now(),lease=null,lease_until=null where id=e.id;
  update public.payment_integrations set last_processed_at=now(),verified_at=case when e.received_at>=configured_at then coalesce(verified_at,now()) else verified_at end where id=i.id;
  return 'processed';
 exception when others then
  v_error:=case when sqlerrm in('waiting_source','waiting_transaction','waiting_customer_mapping','waiting_plan_mapping','transaction_conflict','transaction_alias_conflict','adjustment_conflict','adapter_error','invalid_normalized_event','invalid_subscription','subscription_customer_conflict','invalid_money','invalid_payment_period','invalid_adjustment_state','live_processing_disabled') then sqlerrm else 'processing_error' end;
  update public.payment_events set status=case when v_error like 'waiting_%' and attempts<10 then 'waiting' else 'failed' end,error_code=v_error,
   next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,least(e.attempts,7)))::integer),lease=null,lease_until=null where id=e.id;
  return v_error;
 end;
end; $$;

create function private.payment_has_net_value(p_transaction uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.payment_transactions t where t.id=p_transaction and not t.is_trial and t.amount_minor>0
 and t.amount_minor>coalesce((select sum(amount_minor) from public.payment_adjustments a where a.transaction_id=t.id and a.kind='refund' and a.state='succeeded'),0)
 and not exists(select 1 from public.payment_adjustments a where a.transaction_id=t.id and ((a.kind='dispute' and a.state='lost') or a.state='needs_review')));
$$;
grant execute on function private.payment_has_net_value(uuid) to authenticated;
create function public.payment_metrics(p_app_id uuid default null,p_creator_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('paying_customers',
 (select count(distinct t.referral_id) from public.payment_transactions t join public.customer_referrals r on r.id=t.referral_id where t.environment='sandbox' and r.source<>'unattributed' and (p_creator_id is null or r.creator_id=p_creator_id) and (p_app_id is null or t.app_id=p_app_id) and private.payment_has_net_value(t.id)),
 'active_paying_subscribers',
 (select count(distinct s.referral_id) from public.payment_subscriptions s join public.customer_referrals r on r.id=s.referral_id where s.environment='sandbox' and r.source<>'unattributed' and (p_creator_id is null or r.creator_id=p_creator_id) and (p_app_id is null or s.app_id=p_app_id) and s.state in('active','past_due') and s.paid_until>now()
 and exists(select 1 from public.payment_transactions t where t.subscription_id=s.id and private.payment_has_net_value(t.id)))
 );
$$;
create function public.payment_customer_timeline(p_referral uuid default null,p_app_id uuid default null,p_creator_id uuid default null) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(timeline)),'[]') from (
 select event_id,referral_id,kind,state,occurred_at,amount_minor::text,currency from public.customer_payment_timeline
 where environment='sandbox' and (p_creator_id is null or exists(select 1 from public.customer_referrals r where r.id=referral_id and r.creator_id=p_creator_id)) and (p_referral is null or referral_id=p_referral) and (p_app_id is null or app_id=p_app_id)
 order by occurred_at desc,event_id desc limit 50
 ) timeline;
$$;
create trigger payment_transactions_immutable before update on public.payment_transactions for each row execute function private.forbid_attribution_update();
create trigger payment_timeline_immutable before update on public.customer_payment_timeline for each row execute function private.forbid_attribution_update();

do $$ declare fn record; begin
 for fn in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in('configure_payment_integration','set_payment_source','map_payment_plan','map_payment_customer','map_payment_transaction_reference','payment_integration_for_ingest','ingest_payment_event','claim_payment_events','retry_payment_event','apply_payment_event','payment_metrics','payment_customer_timeline') loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',fn.signature);
 if fn.proname in('payment_integration_for_ingest','ingest_payment_event','claim_payment_events','apply_payment_event') then
 execute format('grant execute on function %s to anon',fn.signature);
 else
 execute format('grant execute on function %s to authenticated',fn.signature);
 end if;
 if fn.proname='map_payment_customer' then execute format('grant execute on function %s to anon',fn.signature); end if;
 end loop;
end $$;

-- An account can own a company AND be a creator. UI context must not mix those metrics.
drop function public.attribution_summary(uuid);
create function public.attribution_summary(p_app_id uuid default null,p_creator_id uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
   'clicks',(select count(*) from public.referral_clicks where (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id)),
   'registrations',(select count(*) from public.customer_referrals where source<>'unattributed' and (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id)),
   'code_registrations',(select count(*) from public.customer_referrals where source='code' and (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id)),
   'unattributed',(select count(*) from public.customer_referrals where source='unattributed' and (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id)),
   'links',coalesce((select jsonb_agg(to_jsonb(metrics)) from (
     select ids.link_id,
       coalesce((select label from public.creator_referral_links l where l.id=ids.link_id),'Link #'||left(ids.link_id::text,8)) label,
       (select count(*) from public.referral_clicks c where c.link_id=ids.link_id and (p_creator_id is null or c.creator_id=p_creator_id)) clicks,
       (select count(*) from public.customer_referrals r where r.link_id=ids.link_id and (p_creator_id is null or r.creator_id=p_creator_id)) registrations
     from (
       select link_id from public.referral_clicks where (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id)
       union select id from public.creator_referral_links where (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id)
     ) ids order by ids.link_id limit 100
   ) metrics),'[]'::jsonb)
 );
$$;
revoke all on function public.attribution_summary(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.attribution_summary(uuid,uuid) to authenticated;
