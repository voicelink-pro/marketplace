-- E8: explicit test provider. No real payment credentials, wallet, FX or live execution.
-- Private storage, narrow authenticated commands and a separately authenticated worker.
create table private.finance_accounts (
 app_id uuid not null references public.apps(id) on delete cascade,
 currency text not null check(currency='EUR'), auto_enabled boolean not null default false, threshold_armed boolean not null default true,
 threshold_minor bigint not null default 0 check(threshold_minor>=0), topup_minor bigint not null default 0 check(topup_minor>=0),
 method_ref text, consent_at timestamptz, consent_version text, paused boolean not null default false,
 primary key(app_id,currency), check(not auto_enabled or (method_ref is not null and consent_at is not null and topup_minor>threshold_minor))
);
create table private.finance_onboarding (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 app_id uuid references public.apps(id) on delete cascade, kind text not null check(kind in('funding','payout')),
 status text not null default 'pending' check(status in('pending','complete')), expires_at timestamptz not null default now()+interval '30 minutes',
 created_at timestamptz not null default now(), check((kind='funding')=(app_id is not null))
);
create index finance_onboarding_user_idx on private.finance_onboarding(user_id);
create index finance_onboarding_app_idx on private.finance_onboarding(app_id);
create table private.finance_payout_accounts (
 creator_id uuid primary key references public.creator_profiles(user_id) on delete cascade,
 provider_ref text not null unique, enabled boolean not null default false,
 currency text not null default 'EUR' check(currency='EUR'), minimum_minor bigint not null default 1 check(minimum_minor>0),
 fee_minor bigint not null default 0 check(fee_minor>=0), verified_at timestamptz
);
create table private.finance_funding (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 currency text not null check(currency='EUR'), amount_minor bigint not null check(amount_minor>0),
 kind text not null check(kind in('manual','automatic')), status text not null default 'pending' check(status in('pending','available','failed')),
 request_key uuid not null, created_at timestamptz not null default now(), unique(app_id,request_key)
);
create unique index finance_one_pending_topup on private.finance_funding(app_id,currency) where status='pending';
create table private.finance_payouts (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
 currency text not null check(currency='EUR'), amount_minor bigint not null check(amount_minor>0), fee_minor bigint not null check(fee_minor>=0),
 account_ref text not null, status text not null default 'requested' check(status in('requested','transferred','paid','transfer_failed','bank_failed','returned')),
 bank_attempt integer not null default 1 check(bank_attempt between 1 and 3), request_key uuid not null,
 created_at timestamptz not null default now(), unique(creator_id,request_key)
);
create index finance_payouts_creator_idx on private.finance_payouts(creator_id,created_at);
create table private.finance_payout_items (
 payout_id uuid not null references private.finance_payouts(id) on delete cascade,
 earning_id uuid not null references public.commission_earnings(id) on delete cascade,
 primary key(payout_id,earning_id)
);
create index finance_payout_items_earning_idx on private.finance_payout_items(earning_id);
create table private.finance_jobs (
 id uuid primary key default gen_random_uuid(), funding_id uuid references private.finance_funding(id) on delete cascade,
 payout_id uuid references private.finance_payouts(id) on delete cascade,
 kind text not null check(kind in('funding','transfer','bank')), bank_attempt integer not null default 0,
 status text not null default 'pending' check(status in('pending','processing','done','review')),
 attempts integer not null default 0, lease_id uuid, lease_until timestamptz, next_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 check((kind='funding' and funding_id is not null and payout_id is null) or (kind<>'funding' and funding_id is null and payout_id is not null)),
 unique(funding_id,kind), unique(payout_id,kind,bank_attempt)
);
create index finance_jobs_due_idx on private.finance_jobs(status,next_at,lease_until);
-- This table belongs to the test provider, not to the marketplace ledger.
-- An object survives transport timeouts and is found again using the same job id.
create table private.finance_provider_objects (
 job_id uuid primary key references private.finance_jobs(id) on delete cascade,
 provider_ref text not null unique, kind text not null, currency text not null, amount_minor bigint not null,
 scope_ref text not null, state text not null check(state in('pending','available','succeeded','failed','paid','returned')),
 updated_at timestamptz not null default now()
);
create table private.finance_scenarios (
 job_id uuid primary key references private.finance_jobs(id) on delete cascade,
 scenario text not null check(scenario in('success','decline','timeout_once','pending','unavailable')),
 calls integer not null default 0
);
create table private.finance_events (
 id bigint generated always as identity primary key, funding_id uuid references private.finance_funding(id) on delete cascade,
 payout_id uuid references private.finance_payouts(id) on delete cascade,
 code text not null, created_at timestamptz not null default now()
);
create index finance_events_funding_idx on private.finance_events(funding_id);
create index finance_events_payout_idx on private.finance_events(payout_id);
create table private.finance_notices (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 funding_id uuid not null unique references private.finance_funding(id) on delete cascade,
 code text not null default 'automatic_topup_failed', created_at timestamptz not null default now()
);
create index finance_notices_app_idx on private.finance_notices(app_id);
create table private.finance_cases (
 job_id uuid primary key references private.finance_jobs(id) on delete cascade,
 code text not null, created_at timestamptz not null default now(), resolved_at timestamptz, resolution_note text
);
create table private.finance_audit (
 id bigint generated always as identity primary key, actor uuid references auth.users(id) on delete set null,
 action text not null, entity_id uuid not null, note text, created_at timestamptz not null default now()
);
create index finance_audit_actor_idx on private.finance_audit(actor);

create function private.finance_owner(p_app uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.apps a join public.organization_members m on m.organization_id=a.organization_id where a.id=p_app and m.user_id=(select auth.uid()) and m.role='owner');
$$;
create function private.finance_free(p_app uuid,p_currency text) returns bigint language sql stable security definer set search_path='' as $$
 select coalesce(sum(funding_credit::numeric-funding_used),0)::bigint from public.commission_journals where app_id=p_app and currency=p_currency;
$$;
create function private.finance_acquisition_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 -- Use the same lock as funding/commission workers; no race with a committed pause.
 perform pg_advisory_xact_lock(hashtextextended(new.app_id::text,7));
 if exists(select 1 from private.finance_accounts where app_id=new.app_id and paused)
 and (tg_table_name<>'customer_referrals' or to_jsonb(new)->>'creator_id' is not null) then raise exception 'program_paused_funding'; end if;
 return new;
end; $$;
create trigger finance_guard_join before insert on public.creator_program_memberships for each row execute function private.finance_acquisition_guard();
create trigger finance_guard_click before insert on public.referral_clicks for each row execute function private.finance_acquisition_guard();
create trigger finance_guard_referral before insert on public.customer_referrals for each row execute function private.finance_acquisition_guard();

-- Reserve available company funding for current accruals as well as closed months.
-- Closing still controls creator availability; reservations never unlock an open month.
create or replace function private.commission_release(p_app uuid) returns void language plpgsql security definer set search_path='' as $$
declare v record;
begin
 for v in select e.id,e.currency,e.creator_id,e.transaction_id,p.gross_minor,p.bucket from public.commission_earnings e join private.commission_positions p on p.earning_id=e.id
 where e.app_id=p_app and p.bucket in('accrued','unfunded','held') and not p.funded and p.gross_minor>0 order by p.effective_month,e.occurred_at,e.id loop
  if private.finance_free(p_app,v.currency)>=v.gross_minor then
   if v.bucket='unfunded' then
    perform private.commission_move(v.id,'available','fund:'||v.id||':'||(select count(*) from public.commission_journals where transaction_id=v.transaction_id));
   else
    perform private.commission_post(p_app,v.creator_id,v.transaction_id,v.currency,'reserve:'||v.id||':'||(select count(*) from public.commission_journals where transaction_id=v.transaction_id),'funding_reservation',now(),
     jsonb_build_array(jsonb_build_object('account','sandbox_cash','amount_minor',(-v.gross_minor)::text),jsonb_build_object('account','sandbox_funding','amount_minor',v.gross_minor::text)),p_used=>v.gross_minor);
    update private.commission_positions set funded=true where earning_id=v.id;
   end if;
  end if;
 end loop;
end; $$;

create function public.finance_start_onboarding(p_kind text,p_app_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if (select auth.uid()) is null or p_kind is null or p_kind not in('funding','payout') then raise exception 'not_authorized'; end if;
 if p_kind='funding' then
  if not private.finance_owner(p_app_id) then raise exception 'not_authorized'; end if;
 elsif p_app_id is not null or not exists(select 1 from public.creator_profiles where user_id=(select auth.uid())) then raise exception 'not_authorized'; end if;
 insert into private.finance_onboarding(user_id,app_id,kind) values((select auth.uid()),p_app_id,p_kind) returning id into v_id;
 return v_id;
end; $$;
create function public.finance_complete_onboarding(p_session uuid,p_consent boolean) returns void language plpgsql security definer set search_path='' as $$
declare s private.finance_onboarding%rowtype;
begin
 select * into s from private.finance_onboarding where id=p_session and user_id=(select auth.uid()) for update;
 if not found or p_consent is distinct from true or s.expires_at<=now() then raise exception 'invalid_onboarding'; end if;
 if s.status='complete' then return; end if;
 if s.kind='funding' then
  if not private.finance_owner(s.app_id) then raise exception 'not_authorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(s.app_id::text,7));
  insert into private.finance_accounts(app_id,currency,method_ref,consent_at,consent_version) values(s.app_id,'EUR','test_method_'||s.id,now(),'sandbox-consent-v1')
   on conflict(app_id,currency) do update set method_ref=excluded.method_ref,consent_at=excluded.consent_at,consent_version=excluded.consent_version;
 else
  insert into private.finance_payout_accounts(creator_id,provider_ref,enabled,verified_at) values(s.user_id,'test_recipient_'||s.user_id,true,now())
   on conflict(creator_id) do update set enabled=true,verified_at=now();
 end if;
 update private.finance_onboarding set status='complete' where id=s.id;
 insert into private.finance_audit(actor,action,entity_id) values((select auth.uid()),'sandbox_onboarding_completed',s.id);
end; $$;
create function public.finance_save_auto(p_app_id uuid,p_enabled boolean,p_threshold text,p_amount text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.finance_owner(p_app_id) then raise exception 'not_authorized'; end if;
 if p_enabled is null or p_threshold is null or p_amount is null or p_threshold !~ '^[0-9]{1,12}$' or p_amount !~ '^[0-9]{1,12}$' or (p_enabled and p_amount::bigint<=p_threshold::bigint) then raise exception 'invalid_topup_settings'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_app_id::text,7));
 update private.finance_accounts set auto_enabled=p_enabled,threshold_armed=true,threshold_minor=p_threshold::bigint,topup_minor=p_amount::bigint where app_id=p_app_id and currency='EUR' and method_ref is not null;
 if not found then raise exception 'payment_method_required'; end if;
 insert into private.finance_audit(actor,action,entity_id) values((select auth.uid()),'auto_topup_settings_saved',p_app_id);
end; $$;
create function public.finance_request_funding(p_app_id uuid,p_amount text,p_request_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare f private.finance_funding%rowtype;
begin
 if not private.finance_owner(p_app_id) then raise exception 'not_authorized'; end if;
 if p_amount is null or p_amount !~ '^[0-9]{1,12}$' or p_amount::bigint<=0 or p_request_key is null then raise exception 'invalid_funding'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_app_id::text,7));
 select * into f from private.finance_funding where app_id=p_app_id and request_key=p_request_key;
 if found then if f.amount_minor<>p_amount::bigint then raise exception 'idempotency_conflict'; end if;return f.id;end if;
 if not exists(select 1 from private.finance_accounts where app_id=p_app_id and method_ref is not null) then raise exception 'payment_method_required'; end if;
 -- Different keys from two tabs must not create concurrent charges either.
 select * into f from private.finance_funding where app_id=p_app_id and status='pending';
 if found then return f.id; end if;
 insert into private.finance_funding(app_id,currency,amount_minor,kind,request_key) values(p_app_id,'EUR',p_amount::bigint,'manual',p_request_key) returning * into f;
 insert into private.finance_jobs(funding_id,kind) values(f.id,'funding');
 insert into private.finance_events(funding_id,code) values(f.id,'funding_requested');
 return f.id;
end; $$;
create function public.finance_schedule_auto(p_backend text,p_app_id uuid default null) returns integer language plpgsql security definer set search_path='' as $$
declare a record; f uuid; n integer:=0;
begin
 perform private.require_payment_backend(p_backend);
 for a in select app_id from private.finance_accounts where auto_enabled and not paused and (p_app_id is null or app_id=p_app_id) order by app_id loop
  perform pg_advisory_xact_lock(hashtextextended(a.app_id::text,7));
  -- A new threshold episode starts only after funds rise back above the threshold.
  update private.finance_accounts set threshold_armed=true where app_id=a.app_id and private.finance_free(app_id,currency)>=threshold_minor;
  -- Recheck after acquiring the lock. Paused failures require a successful manual recovery.
  if exists(select 1 from private.finance_accounts where app_id=a.app_id and auto_enabled and threshold_armed and not paused and private.finance_free(app_id,currency)<threshold_minor)
    and not exists(select 1 from private.finance_funding where app_id=a.app_id and status='pending') then
   insert into private.finance_funding(app_id,currency,amount_minor,kind,request_key) select app_id,currency,topup_minor,'automatic',gen_random_uuid() from private.finance_accounts where app_id=a.app_id returning id into f;
   update private.finance_accounts set threshold_armed=false where app_id=a.app_id;
   insert into private.finance_jobs(funding_id,kind) values(f,'funding');
   insert into private.finance_events(funding_id,code) values(f,'automatic_topup_requested');n:=n+1;
  end if;
 end loop;
 return n;
end; $$;

create function public.finance_request_payout(p_request_key uuid,p_expected_minor text,p_expected_fee text,p_currency text default 'EUR') returns uuid language plpgsql security definer set search_path='' as $$
declare a private.finance_payout_accounts%rowtype; p private.finance_payouts%rowtype; v_row record; v_amount numeric; v_id uuid; v_count integer;
begin
 if (select auth.uid()) is null or p_request_key is null or p_currency is distinct from 'EUR' then raise exception 'not_authorized'; end if;
 -- Creator lock then all app locks in UUID order, shared by request, bank retries and completion.
 perform pg_advisory_xact_lock(hashtextextended((select auth.uid())::text,8));
 select * into p from private.finance_payouts where creator_id=(select auth.uid()) and request_key=p_request_key;
 if found then return p.id;end if;
 select * into a from private.finance_payout_accounts where creator_id=(select auth.uid()) and enabled;
 if not found then raise exception 'payout_account_required'; end if;
 for v_row in select distinct app_id from public.commission_earnings where creator_id=(select auth.uid()) order by app_id loop perform pg_advisory_xact_lock(hashtextextended(v_row.app_id::text,7));end loop;
 select sum(pos.creator_minor),count(*) into v_amount,v_count from public.commission_earnings e join private.commission_positions pos on pos.earning_id=e.id
 where e.creator_id=(select auth.uid()) and e.currency=p_currency and pos.bucket='available' and pos.funded and pos.creator_minor>0
 and not exists(select 1 from private.commission_jobs where transaction_id=e.transaction_id and status not in('processed','ignored'));
 if coalesce(v_amount,0)<=a.fee_minor or v_amount-a.fee_minor<a.minimum_minor then raise exception 'no_withdrawable_funds'; end if;
 if p_expected_minor is null or p_expected_minor<>v_amount::bigint::text or p_expected_fee is distinct from a.fee_minor::text then raise exception 'earnings_changed';end if;
 if v_count>500 then raise exception 'payout_batch_too_large'; end if;
 insert into private.finance_payouts(creator_id,currency,amount_minor,fee_minor,account_ref,request_key) values(a.creator_id,p_currency,v_amount::bigint,a.fee_minor,a.provider_ref,p_request_key) returning id into v_id;
 for v_row in select e.id from public.commission_earnings e join private.commission_positions pos on pos.earning_id=e.id
 where e.creator_id=a.creator_id and e.currency=p_currency and pos.bucket='available' and pos.funded and pos.creator_minor>0
 and not exists(select 1 from private.commission_jobs where transaction_id=e.transaction_id and status not in('processed','ignored')) order by e.app_id,e.id loop
  insert into private.finance_payout_items values(v_id,v_row.id);
  perform private.commission_move(v_row.id,'in_payout','payout-reserve:'||v_id||':'||v_row.id);
 end loop;
 insert into private.finance_jobs(payout_id,kind) values(v_id,'transfer');
 insert into private.finance_events(payout_id,code) values(v_id,'payout_requested');
 return v_id;
end; $$;
create function public.finance_retry_bank(p_payout uuid) returns void language plpgsql security definer set search_path='' as $$
declare p private.finance_payouts%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended((select auth.uid())::text,8));
 select * into p from private.finance_payouts where id=p_payout and creator_id=(select auth.uid()) for update;
 if not found or p.status not in('bank_failed','returned') or p.bank_attempt>=3 then raise exception 'bank_retry_unavailable'; end if;
 if not exists(select 1 from private.finance_payout_accounts where creator_id=p.creator_id and enabled and provider_ref=p.account_ref) then raise exception 'payout_account_required';end if;
 update private.finance_payouts set status='transferred',bank_attempt=bank_attempt+1 where id=p.id;
 insert into private.finance_jobs(payout_id,kind,bank_attempt) values(p.id,'bank',p.bank_attempt+1);
 insert into private.finance_events(payout_id,code) values(p.id,'bank_retry_requested');
end; $$;

-- Leases are short transactions. No provider/network call occurs while holding an app lock.
create function public.finance_claim(p_backend text,p_app_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.finance_jobs%rowtype; token uuid:=gen_random_uuid();
begin
 perform private.require_payment_backend(p_backend);
 select q.* into j from private.finance_jobs q left join private.finance_funding f on f.id=q.funding_id
 where (p_app_id is null or f.app_id=p_app_id or exists(select 1 from private.finance_payout_items i join public.commission_earnings e on e.id=i.earning_id where i.payout_id=q.payout_id and e.app_id=p_app_id))
 and ((q.status='pending' and q.next_at<=now()) or (q.status='processing' and q.lease_until<now())) and q.attempts<3
 order by q.created_at,q.id limit 1 for update of q skip locked;
 if not found then return null;end if;
 update private.finance_jobs set status='processing',attempts=attempts+1,lease_id=token,lease_until=now()+interval '60 seconds' where id=j.id;
 return jsonb_build_object('id',j.id,'kind',j.kind,'lease',token);
end; $$;
-- Adapter boundary: simulator execution is durable and idempotent. Only the backend can call it.
create function public.finance_sandbox_exchange(p_backend text,p_job uuid,p_lease uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.finance_jobs%rowtype; f private.finance_funding%rowtype; p private.finance_payouts%rowtype; s private.finance_scenarios%rowtype; o private.finance_provider_objects%rowtype;
 v_amount bigint; v_currency text; v_scope text; v_state text;
begin
 perform private.require_payment_backend(p_backend);
 select * into j from private.finance_jobs where id=p_job for update;
 if not found or j.status<>'processing' or j.lease_id is distinct from p_lease or j.lease_until<now() then raise exception 'stale_finance_lease';end if;
 select * into s from private.finance_scenarios where job_id=j.id;
 if s.scenario='unavailable' then return jsonb_build_object('unknown',true);end if;
 if j.kind='funding' then select * into f from private.finance_funding where id=j.funding_id;v_amount:=f.amount_minor;v_currency:=f.currency;v_scope:=f.app_id::text;
 else select * into p from private.finance_payouts where id=j.payout_id;v_amount:=p.amount_minor-case when j.kind='bank' then p.fee_minor else 0 end;v_currency:=p.currency;v_scope:=p.account_ref;end if;
 v_state:=case when s.scenario='decline' then 'failed' when s.scenario='pending' then 'pending' when j.kind='funding' then 'available' when j.kind='transfer' then 'succeeded' else 'paid' end;
 insert into private.finance_provider_objects(job_id,provider_ref,kind,currency,amount_minor,scope_ref,state) values(j.id,'test_'||j.kind||'_'||j.id,j.kind,v_currency,v_amount,v_scope,v_state) on conflict(job_id) do nothing;
 update private.finance_scenarios set calls=calls+1 where job_id=j.id;
 if s.scenario='timeout_once' and s.calls=0 then return jsonb_build_object('unknown',true);end if;
 select * into o from private.finance_provider_objects where job_id=j.id;
 return jsonb_build_object('reference',o.provider_ref,'state',o.state);
end; $$;
create function private.finance_case(p_job uuid,p_code text) returns void language sql security definer set search_path='' as $$
 insert into private.finance_cases(job_id,code) values(p_job,p_code) on conflict(job_id) do update set code=excluded.code,resolved_at=null,resolution_note=null;
$$;
-- Never accepts amounts or final provider state from the browser/worker response.
-- Retrieves authoritative provider evidence and compares the scope, kind, amount and currency.
create function public.finance_settle(p_backend text,p_job uuid,p_lease uuid) returns text language plpgsql security definer set search_path='' as $$
declare j private.finance_jobs%rowtype; f private.finance_funding%rowtype; p private.finance_payouts%rowtype; o private.finance_provider_objects%rowtype;
 e record; v_state text; v_valid boolean;
begin
 perform private.require_payment_backend(p_backend);
 select * into j from private.finance_jobs where id=p_job;
 if j.kind='funding' then
  select * into f from private.finance_funding where id=j.funding_id;perform pg_advisory_xact_lock(hashtextextended(f.app_id::text,7));
  select * into f from private.finance_funding where id=j.funding_id;
 else
  select * into p from private.finance_payouts where id=j.payout_id;
  perform pg_advisory_xact_lock(hashtextextended(p.creator_id::text,8));
  for e in select distinct ce.app_id from private.finance_payout_items i join public.commission_earnings ce on ce.id=i.earning_id where i.payout_id=p.id order by ce.app_id loop perform pg_advisory_xact_lock(hashtextextended(e.app_id::text,7));end loop;
  select * into p from private.finance_payouts where id=j.payout_id;
 end if;
 select * into j from private.finance_jobs where id=p_job for update;
 if not found or j.status<>'processing' or j.lease_id is distinct from p_lease or j.lease_until<now() then raise exception 'stale_finance_lease'; end if;
 select * into o from private.finance_provider_objects where job_id=j.id;
 if not found or o.state='pending' then
  update private.finance_jobs set status=case when attempts>=3 then 'review' else 'pending' end,next_at=now()+make_interval(secs=>attempts*5),lease_id=null,lease_until=null where id=j.id;
  if j.attempts>=3 then perform private.finance_case(j.id,'provider_outcome_unknown');end if;
  return 'pending';
 end if;
 v_valid:=o.kind=j.kind and o.currency=coalesce(f.currency,p.currency) and o.amount_minor=case when j.kind='funding' then f.amount_minor when j.kind='bank' then p.amount_minor-p.fee_minor else p.amount_minor end and o.scope_ref=case when j.kind='funding' then f.app_id::text else p.account_ref end;
 if not coalesce(v_valid,false) or (j.kind='funding' and o.state not in('available','failed')) or (j.kind='transfer' and o.state not in('succeeded','failed')) or (j.kind='bank' and o.state not in('paid','failed','returned')) then
  perform private.finance_case(j.id,'provider_ledger_mismatch');update private.finance_jobs set status='review' where id=j.id;return 'review';
 end if;
 if j.kind='funding' then
  if o.state='available' then
   if f.status<>'available' then
    perform private.commission_post(f.app_id,null,null,f.currency,'provider-funding:'||f.id,'sandbox_provider_funding',now(),jsonb_build_array(jsonb_build_object('account','sandbox_cash','amount_minor',f.amount_minor::text),jsonb_build_object('account','sandbox_funding','amount_minor',(-f.amount_minor)::text)),p_credit=>f.amount_minor);
    update private.finance_funding set status='available' where id=f.id;
    perform private.commission_release(f.app_id);
    -- Clear only the funding pause; publication and other gates remain unchanged.
    update private.finance_accounts set paused=false where app_id=f.app_id and private.finance_free(app_id,currency)>=0
     and not exists(select 1 from public.commission_earnings ce join private.commission_positions cp on cp.earning_id=ce.id where ce.app_id=f.app_id and ce.currency=f.currency and not cp.funded and cp.gross_minor>0 and cp.bucket in('accrued','unfunded','held'));
   end if;
  else
   update private.finance_funding set status='failed' where id=f.id;
   if f.kind='automatic' then
    update private.finance_accounts set paused=true where app_id=f.app_id;
    insert into private.finance_notices(app_id,funding_id) values(f.app_id,f.id) on conflict do nothing;
   end if;
  end if;
  insert into private.finance_events(funding_id,code) values(f.id,'funding_'||o.state);
 elsif j.kind='transfer' then
  if o.state='succeeded' then
   update private.finance_payouts set status='transferred' where id=p.id and status='requested';
   insert into private.finance_jobs(payout_id,kind,bank_attempt) values(p.id,'bank',1) on conflict do nothing;
  else
   update private.finance_payouts set status='transfer_failed' where id=p.id;
   for e in select earning_id from private.finance_payout_items where payout_id=p.id order by earning_id loop perform private.commission_move(e.earning_id,'available','payout-release:'||p.id||':'||e.earning_id);end loop;
  end if;
  insert into private.finance_events(payout_id,code) values(p.id,'transfer_'||o.state);
 else
  v_state:=case o.state when 'paid' then 'paid' when 'failed' then 'bank_failed' else 'returned' end;
  if p.bank_attempt<>j.bank_attempt then raise exception 'stale_bank_attempt';end if;
  update private.finance_payouts set status=v_state where id=p.id;
  for e in select earning_id from private.finance_payout_items where payout_id=p.id order by earning_id loop
   perform private.commission_move(e.earning_id,case when o.state='paid' then 'paid' else 'in_payout' end,'bank:'||j.id||':'||o.state||':'||e.earning_id);
  end loop;
  insert into private.finance_events(payout_id,code) values(p.id,'bank_'||o.state);
 end if;
 update private.finance_jobs set status='done',lease_id=null,lease_until=null where id=j.id;
 update private.finance_cases set resolved_at=now(),resolution_note='Authoritative sandbox provider evidence reconciled.' where job_id=j.id and resolved_at is null;
 return o.state;
end; $$;
-- Funded does not imply that an open month is withdrawable, including after a dispute win.
create or replace function private.commission_move(p_id uuid,p_to text,p_key text) returns void language plpgsql security definer set search_path='' as $$
declare e public.commission_earnings%rowtype; p private.commission_positions%rowtype;
begin
 select * into e from public.commission_earnings where id=p_id;select * into p from private.commission_positions where earning_id=p_id;
 if p_to='available' and not exists(select 1 from public.commission_month_closures where app_id=e.app_id and month=p.effective_month) then p_to:='accrued';end if;
 if p.bucket=p_to then return;end if;
 perform private.commission_post(e.app_id,e.creator_id,e.transaction_id,e.currency,p_key,'transfer',now(),jsonb_build_array(
 jsonb_build_object('account','creator_'||p.bucket,'amount_minor',(-p.creator_minor)::text),jsonb_build_object('account','platform_'||p.bucket,'amount_minor',(-p.fee_minor)::text),
 jsonb_build_object('account','creator_'||p_to,'amount_minor',p.creator_minor::text),jsonb_build_object('account','platform_'||p_to,'amount_minor',p.fee_minor::text)),p_used=>case when not p.funded and p_to='available' then p.gross_minor when p.funded and p_to='unfunded' then -p.gross_minor else 0 end);
 update private.commission_positions set bucket=p_to,funded=case when p_to='unfunded' then false else funded or p_to='available' end where earning_id=p_id;
end; $$;
create function public.finance_defer(p_backend text,p_job uuid,p_lease uuid) returns void language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 perform private.require_payment_backend(p_backend);
 update private.finance_jobs set status=case when attempts>=3 then 'review' else 'pending' end,next_at=now()+make_interval(secs=>attempts*5),lease_id=null,lease_until=null
 where id=p_job and status='processing' and lease_id=p_lease and lease_until>now() returning attempts into n;
 if not found then raise exception 'stale_finance_lease';end if;
 if n>=3 then perform private.finance_case(p_job,'provider_outcome_unknown');end if;
end; $$;
create function public.finance_reconcile(p_backend text,p_app_id uuid default null) returns integer language plpgsql security definer set search_path='' as $$
declare j record; expected text; n integer:=0;
begin
 perform private.require_payment_backend(p_backend);
 -- Exhausted workers retain reservations until authoritative evidence or operator review.
 for j in select id from private.finance_jobs where status='processing' and lease_until<now() and attempts>=3 loop
  update private.finance_jobs set status='review' where id=j.id and status='processing' and lease_until<now();
  perform private.finance_case(j.id,'provider_outcome_unknown');
 end loop;
 for j in select q.*,o.state,o.kind provider_kind,o.amount_minor provider_amount,o.currency provider_currency,o.scope_ref,
 f.app_id,f.status funding_status,f.amount_minor funding_amount,f.currency funding_currency,
 p.status payout_status,p.account_ref,p.amount_minor payout_amount,p.fee_minor,p.currency payout_currency,p.bank_attempt current_bank_attempt
 from private.finance_jobs q left join private.finance_provider_objects o on o.job_id=q.id left join private.finance_funding f on f.id=q.funding_id left join private.finance_payouts p on p.id=q.payout_id
 where q.status='done' and (p_app_id is null or f.app_id=p_app_id or exists(select 1 from private.finance_payout_items i join public.commission_earnings e on e.id=i.earning_id where i.payout_id=q.payout_id and e.app_id=p_app_id)) order by q.id loop
  if j.kind='bank' and j.bank_attempt<>j.current_bank_attempt then continue;end if;
  expected:=case when j.kind='funding' then case j.funding_status when 'available' then 'available' else 'failed' end
    when j.kind='transfer' then case when j.payout_status='transfer_failed' then 'failed' else 'succeeded' end
    else case j.payout_status when 'paid' then 'paid' when 'bank_failed' then 'failed' when 'returned' then 'returned' else 'pending' end end;
  if j.state is null or j.provider_kind<>j.kind or j.provider_currency<>coalesce(j.funding_currency,j.payout_currency)
    or j.provider_amount<>(case when j.kind='funding' then j.funding_amount when j.kind='bank' then j.payout_amount-j.fee_minor else j.payout_amount end)
    or j.scope_ref<>(case when j.kind='funding' then j.app_id::text else j.account_ref end) or j.state<>expected then
   perform private.finance_case(j.id,'provider_ledger_mismatch');n:=n+1;
   -- A bank return reverses the paid projection, never the platform transfer.
   if j.kind='bank' and j.state='returned' and expected='paid' then
    update private.finance_jobs set status='pending',attempts=0,next_at=now() where id=j.id and status='done';
   end if;
  end if;
 end loop;
 return n;
end; $$;
create function public.finance_review_case(p_job uuid,p_note text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_platform_admin() then raise exception 'not_authorized';end if;
 if p_note is null or length(btrim(p_note)) not between 10 and 500 then raise exception 'review_note_required';end if;
 perform 1 from private.finance_cases where job_id=p_job and resolved_at is null for update;
 if not found then raise exception 'case_not_open';end if;
 if not exists(select 1 from private.finance_provider_objects where job_id=p_job) then raise exception 'provider_evidence_required';end if;
 update private.finance_jobs set status='pending',attempts=0,next_at=now(),lease_id=null,lease_until=null where id=p_job and status in('review','done');
 if not found then raise exception 'case_in_progress';end if;
 insert into private.finance_audit(actor,action,entity_id,note) values((select auth.uid()),'reconciliation_requested',p_job,btrim(p_note));
end; $$;
-- Operator-only fault injection, unavailable to app/company/creator sessions.
create function public.finance_test_scenario(p_job uuid,p_scenario text) returns void language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.finance_jobs where id=p_job and status<>'pending') or exists(select 1 from private.finance_provider_objects where job_id=p_job) then raise exception 'scenario_already_started';end if;
 insert into private.finance_scenarios(job_id,scenario) values(p_job,p_scenario) on conflict(job_id) do update set scenario=excluded.scenario;
end; $$;
create function public.finance_test_return(p_payout uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update private.finance_provider_objects o set state='returned',updated_at=now() from private.finance_jobs j,private.finance_payouts p
 where j.id=o.job_id and j.payout_id=p.id and p.id=p_payout and j.kind='bank' and j.bank_attempt=p.bank_attempt and o.state='paid';
 if not found then raise exception 'paid_bank_object_required';end if;
end; $$;

-- Safe projections contain amounts as text, no method/customer/KYC data or secrets.
create function public.finance_workspace(p_app_id uuid default null,p_admin boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; me uuid:=(select auth.uid()); admin_mode boolean:=false;
begin
 if me is null then raise exception 'not_authorized';end if;
 if p_admin then if not private.is_platform_admin() then raise exception 'not_authorized';end if;admin_mode:=true;
 elsif p_app_id is not null and not private.is_app_org_member(p_app_id) then raise exception 'not_authorized';end if;
 with accounts as (
  select a.app_id,a.currency,a.auto_enabled,a.threshold_minor::text,a.topup_minor::text,a.method_ref is not null method_ready,a.consent_at,a.paused,
    private.finance_free(a.app_id,a.currency)::text available_minor,
    coalesce((select sum(pos.gross_minor) from public.commission_earnings e join private.commission_positions pos on pos.earning_id=e.id where e.app_id=a.app_id and e.currency=a.currency and pos.funded and pos.bucket<>'paid'),0)::text reserved_minor,
    coalesce((select sum(pos.gross_minor) from public.commission_earnings e join private.commission_positions pos on pos.earning_id=e.id where e.app_id=a.app_id and e.currency=a.currency and not pos.funded),0)::text arrears_minor
  from private.finance_accounts a where admin_mode or a.app_id=p_app_id
 ), funding as (
  select f.id,f.app_id,f.currency,f.amount_minor::text,f.kind,f.status,f.created_at from private.finance_funding f where admin_mode or f.app_id=p_app_id order by f.created_at desc,f.id limit 100
 ), payouts as (
  select p.id,p.creator_id,p.currency,p.amount_minor::text,p.fee_minor::text,p.status,p.bank_attempt,p.created_at,
   (select o.provider_ref from private.finance_jobs j join private.finance_provider_objects o on o.job_id=j.id where j.payout_id=p.id and j.kind='transfer') transfer_reference,
   (select o.provider_ref from private.finance_jobs j join private.finance_provider_objects o on o.job_id=j.id where j.payout_id=p.id and j.kind='bank' and j.bank_attempt=p.bank_attempt) bank_reference
  from private.finance_payouts p where admin_mode or (p_app_id is null and p.creator_id=me) order by p.created_at desc,p.id limit 100
 ), events as (
  select e.id::text,e.funding_id,e.payout_id,e.code,e.created_at from private.finance_events e
  where e.funding_id in(select id from funding) or e.payout_id in(select id from payouts) order by e.id desc limit 200
 ), notices as (
  select n.id,n.app_id,n.code,n.created_at from private.finance_notices n where admin_mode or n.app_id=p_app_id order by n.created_at desc limit 100
 ), cases as (
  select c.job_id,c.code,c.created_at,c.resolved_at,j.kind,j.status,j.attempts,j.funding_id,j.payout_id from private.finance_cases c join private.finance_jobs j on j.id=c.job_id where admin_mode order by c.created_at desc limit 100
 ), totals as (
  select e.currency,sum(pos.creator_minor)::text available_minor from public.commission_earnings e join private.commission_positions pos on pos.earning_id=e.id
  where p_app_id is null and not admin_mode and e.creator_id=me and pos.bucket='available' and pos.funded
    and not exists(select 1 from private.commission_jobs j where j.transaction_id=e.transaction_id and j.status not in('processed','ignored')) group by e.currency
 ) select jsonb_build_object('provider','sandbox-test','live_enabled',false,
  'accounts',coalesce((select jsonb_agg(to_jsonb(a)) from accounts a),'[]'),
  'funding',coalesce((select jsonb_agg(to_jsonb(f)) from funding f),'[]'),
  'payouts',coalesce((select jsonb_agg(to_jsonb(p)) from payouts p),'[]'),
  'events',coalesce((select jsonb_agg(to_jsonb(e)) from events e),'[]'),
  'notices',coalesce((select jsonb_agg(to_jsonb(n)) from notices n),'[]'),
  'cases',coalesce((select jsonb_agg(to_jsonb(c)) from cases c),'[]'),
  'available',coalesce((select jsonb_agg(to_jsonb(t)) from totals t),'[]'),
  'jobs',coalesce((select jsonb_agg(to_jsonb(q)) from (select id,kind,status,attempts,funding_id,payout_id,lease_until,next_at from private.finance_jobs where admin_mode order by created_at desc limit 100) q),'[]'),
  'audit',coalesce((select jsonb_agg(to_jsonb(q)) from (select id::text,actor,action,entity_id,note,created_at from private.finance_audit where admin_mode order by id desc limit 100) q),'[]'),
  'payout_account',(select jsonb_build_object('enabled',enabled,'currency',currency,'minimum_minor',minimum_minor::text,'fee_minor',fee_minor::text) from private.finance_payout_accounts where creator_id=me and p_app_id is null and not admin_mode),
  'onboarding',coalesce((select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'app_id',app_id,'status',status,'expires_at',expires_at)) from private.finance_onboarding where user_id=me and status='pending' and expires_at>now() and (app_id=p_app_id or (p_app_id is null and kind='payout'))),'[]')) into result;
 return result;
end; $$;

-- Every new private table has RLS; public APIs have explicit EXECUTE allowlists.
do $$ declare t record; f record; begin
 for t in select tablename from pg_tables where schemaname='private' and tablename like 'finance_%' loop
  execute format('alter table private.%I enable row level security',t.tablename);
  execute format('revoke all on private.%I from public,anon,authenticated',t.tablename);
 end loop;
 for f in select p.oid::regprocedure name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='private' and p.proname like 'finance_%') or (n.nspname='public' and p.proname like 'finance_%') loop
  execute 'revoke all on function '||f.name||' from public,anon,authenticated';
 end loop;
end; $$;
grant execute on function public.finance_start_onboarding(text,uuid),public.finance_complete_onboarding(uuid,boolean),public.finance_save_auto(uuid,boolean,text,text),public.finance_request_funding(uuid,text,uuid),public.finance_request_payout(uuid,text,text,text),public.finance_retry_bank(uuid),public.finance_workspace(uuid,boolean),public.finance_review_case(uuid,text) to authenticated;
grant execute on function public.finance_schedule_auto(text,uuid),public.finance_claim(text,uuid),public.finance_sandbox_exchange(text,uuid,uuid),public.finance_settle(text,uuid,uuid),public.finance_defer(text,uuid,uuid),public.finance_reconcile(text,uuid) to anon;
grant execute on function public.finance_test_scenario(uuid,text),public.finance_test_return(uuid) to service_role;

create function public.finance_onboarding_session(p_session uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 select jsonb_build_object('id',id,'app_id',app_id,'kind',kind,'status',status,'expires_at',expires_at) into result from private.finance_onboarding where id=p_session and user_id=(select auth.uid());
 return result;
end; $$;
revoke all on function public.finance_onboarding_session(uuid) from public,anon,authenticated;
grant execute on function public.finance_onboarding_session(uuid) to authenticated;

create function public.finance_test_resolve(p_job uuid,p_state text) returns void language plpgsql security definer set search_path='' as $$
begin
 update private.finance_provider_objects o set state=p_state,updated_at=now() from private.finance_jobs j where j.id=o.job_id and o.job_id=p_job and o.state='pending'
 and ((j.kind='funding' and p_state in('available','failed')) or (j.kind='transfer' and p_state in('succeeded','failed')) or (j.kind='bank' and p_state in('paid','failed')));
 if not found then raise exception 'pending_provider_object_required';end if;
end; $$;
revoke all on function public.finance_test_resolve(uuid,text) from public,anon,authenticated;
grant execute on function public.finance_test_resolve(uuid,text) to service_role;
