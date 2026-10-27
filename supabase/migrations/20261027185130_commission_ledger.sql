-- E7: sandbox-only accounting. No default platform fee, live money or payout execution.
create table private.commission_policies (
 id uuid primary key default gen_random_uuid(), effective_at timestamptz not null unique,
 platform_fee_bps integer not null check(platform_fee_bps between 0 and 10000),
 basis_policy text not null check(basis_policy='sandbox_explicit_paid_including_tax'),
 created_at timestamptz not null default now()
);
create table private.commission_bases (
 transaction_id uuid primary key references public.payment_transactions(id) on delete cascade,
 basis_minor bigint not null check(basis_minor>=0), policy_id uuid not null references private.commission_policies(id),
 created_at timestamptz not null default now()
);
create index commission_bases_policy_idx on private.commission_bases(policy_id);
create table private.commission_jobs (
 transaction_id uuid primary key references public.payment_transactions(id) on delete cascade,
 app_id uuid not null references public.apps(id) on delete cascade,
 status text not null default 'pending' check(status in('pending','processed','waiting','review','ignored')),
 error_code text, attempts integer not null default 0, updated_at timestamptz not null default now()
);
create index commission_jobs_work_idx on private.commission_jobs(app_id,status,transaction_id);
create table public.commission_earnings (
 id uuid primary key default gen_random_uuid(), transaction_id uuid not null unique references public.payment_transactions(id) on delete cascade,
 app_id uuid not null references public.apps(id) on delete cascade, creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
 referral_id uuid not null references public.customer_referrals(id) on delete cascade,
 terms_version_id uuid not null references public.app_terms_versions(id) on delete cascade,
 plan_name text not null, billing_interval text not null, currency text not null check(currency ~ '^[A-Z]{3}$'),
 sale_minor bigint not null check(sale_minor>0), commission_basis_minor bigint not null check(commission_basis_minor between 0 and sale_minor),
 commission_bps integer not null check(commission_bps between 0 and 10000), platform_fee_bps integer not null check(platform_fee_bps between 0 and 10000),
 gross_minor bigint not null check(gross_minor>=0), platform_fee_minor bigint not null check(platform_fee_minor>=0), creator_minor bigint not null check(creator_minor>=0),
 policy_id uuid not null references private.commission_policies(id), occurred_at timestamptz not null,
 created_at timestamptz not null default now(), check(gross_minor=platform_fee_minor+creator_minor)
);
create index commission_earnings_app_idx on public.commission_earnings(app_id,occurred_at);
create index commission_earnings_creator_idx on public.commission_earnings(creator_id,occurred_at);
create index commission_earnings_referral_idx on public.commission_earnings(referral_id);
create index commission_earnings_terms_idx on public.commission_earnings(terms_version_id);
create index commission_earnings_policy_idx on public.commission_earnings(policy_id);
create table private.commission_positions (
 earning_id uuid primary key references public.commission_earnings(id) on delete cascade,
 gross_minor bigint not null, creator_minor bigint not null, fee_minor bigint not null,
 bucket text not null default 'accrued' check(bucket in('accrued','unfunded','available','held','in_payout','paid')),
 funded boolean not null default false, effective_month date not null,
 check(gross_minor>=0 and creator_minor>=0 and fee_minor>=0 and gross_minor=creator_minor+fee_minor)
);
create table public.commission_month_closures (
 app_id uuid not null references public.apps(id) on delete cascade, month date not null check(extract(day from month)=1),
 closed_at timestamptz not null default now(), primary key(app_id,month)
);
-- One immutable journal contains its complete, balanced set of postings. It cannot be half-written.
create function private.commission_entries_balanced(p_entries jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare v jsonb; total numeric:=0;
begin
 if jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)<2 or jsonb_array_length(p_entries)>12 then return false; end if;
 for v in select * from jsonb_array_elements(p_entries) loop
  if (v->>'account') !~ '^(company_due|sandbox_cash|sandbox_funding|creator_(accrued|unfunded|available|held|in_payout|paid)|platform_(accrued|unfunded|available|held|in_payout|paid))$'
   or v->>'account' is null or v->>'amount_minor' is null or (v->>'amount_minor') !~ '^-?[0-9]{1,18}$' then return false; end if;
  total:=total+(v->>'amount_minor')::numeric;
 end loop;
 return total=0;
end; $$;
create table public.commission_journals (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 creator_id uuid references public.creator_profiles(user_id) on delete cascade,
 transaction_id uuid references public.payment_transactions(id) on delete cascade,
 currency text not null check(currency ~ '^[A-Z]{3}$'), idempotency_key text not null,
 kind text not null, source_at timestamptz not null, source_month date not null, effective_month date not null,
 sale_delta bigint not null default 0, basis_delta bigint not null default 0,
 gross_delta bigint not null default 0, creator_delta bigint not null default 0, fee_delta bigint not null default 0,
 funding_credit bigint not null default 0, funding_used bigint not null default 0,
 entries jsonb not null check(private.commission_entries_balanced(entries)), created_at timestamptz not null default now(),
 unique(app_id,idempotency_key), check(gross_delta=creator_delta+fee_delta)
);
create index commission_journals_creator_idx on public.commission_journals(creator_id,effective_month);
create index commission_journals_app_month_idx on public.commission_journals(app_id,effective_month,currency);
create index commission_journals_transaction_idx on public.commission_journals(transaction_id);
create table public.commission_statements (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
 month date not null, currency text not null, sale_minor bigint not null, basis_minor bigint not null,
 gross_minor bigint not null, creator_minor bigint not null, fee_minor bigint not null,
 created_at timestamptz not null default now(), unique(app_id,creator_id,month,currency), check(gross_minor=creator_minor+fee_minor),
 foreign key(app_id,month) references public.commission_month_closures(app_id,month) on delete cascade
);
create index commission_statements_creator_idx on public.commission_statements(creator_id,month);
create table public.commission_review_cases (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.apps(id) on delete cascade,
 creator_id uuid references public.creator_profiles(user_id) on delete cascade,
 transaction_id uuid not null references public.payment_transactions(id) on delete cascade,
 code text not null, source_digest text not null, created_at timestamptz not null default now(), unique(transaction_id,code,source_digest)
);
create index commission_review_app_idx on public.commission_review_cases(app_id,created_at);
create index commission_review_creator_idx on public.commission_review_cases(creator_id);
-- Financial history permits cascade cleanup only when its app/transaction is being removed.
create function private.commission_immutable() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' and not exists(select 1 from public.apps where id=old.app_id) then return old; end if;
 if tg_op='DELETE' and tg_table_name in('commission_earnings','commission_journals','commission_review_cases') then
  if old.transaction_id is not null and not exists(select 1 from public.payment_transactions where id=old.transaction_id) then return old; end if;
 end if;
 raise exception 'commission_history_is_immutable';
end; $$;
create trigger commission_earnings_immutable before update or delete on public.commission_earnings for each row execute function private.commission_immutable();
create trigger commission_journals_immutable before update or delete on public.commission_journals for each row execute function private.commission_immutable();
create trigger commission_statements_immutable before update or delete on public.commission_statements for each row execute function private.commission_immutable();
create trigger commission_closures_immutable before update or delete on public.commission_month_closures for each row execute function private.commission_immutable();
create trigger commission_cases_immutable before update or delete on public.commission_review_cases for each row execute function private.commission_immutable();
create function private.commission_round(p_amount bigint,p_bps integer) returns bigint language sql immutable set search_path='' as $$
 select trunc((p_amount::numeric*p_bps+5000)/10000)::bigint;
$$;
create function private.commission_month(p_time timestamptz) returns date language sql immutable set search_path='' as $$ select date_trunc('month',p_time at time zone 'UTC')::date; $$;
create function private.commission_open_month(p_app uuid,p_time timestamptz) returns date language sql stable set search_path='' as $$
 select case when exists(select 1 from public.commission_month_closures where app_id=p_app and month=private.commission_month(p_time))
 then greatest(private.commission_month(now()),(select max(month)+interval '1 month' from public.commission_month_closures where app_id=p_app)::date)
 else private.commission_month(p_time) end;
$$;
create function private.commission_post(p_app uuid,p_creator uuid,p_tx uuid,p_currency text,p_key text,p_kind text,p_time timestamptz,p_entries jsonb,
 p_sale bigint default 0,p_basis bigint default 0,p_gross bigint default 0,p_creator_delta bigint default 0,p_fee bigint default 0,p_credit bigint default 0,p_used bigint default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 insert into public.commission_journals(app_id,creator_id,transaction_id,currency,idempotency_key,kind,source_at,source_month,effective_month,entries,sale_delta,basis_delta,gross_delta,creator_delta,fee_delta,funding_credit,funding_used)
 values(p_app,p_creator,p_tx,p_currency,p_key,p_kind,p_time,private.commission_month(p_time),private.commission_open_month(p_app,p_time),p_entries,p_sale,p_basis,p_gross,p_creator_delta,p_fee,p_credit,p_used)
 returning id into v_id;
 return v_id;
end; $$;
create function private.commission_move(p_id uuid,p_to text,p_key text) returns void language plpgsql security definer set search_path='' as $$
declare e public.commission_earnings%rowtype; p private.commission_positions%rowtype;
begin
 select * into e from public.commission_earnings where id=p_id; select * into p from private.commission_positions where earning_id=p_id;
 if p.bucket=p_to then return; end if;
 perform private.commission_post(e.app_id,e.creator_id,e.transaction_id,e.currency,p_key,'transfer',now(),jsonb_build_array(
 jsonb_build_object('account','creator_'||p.bucket,'amount_minor',(-p.creator_minor)::text),jsonb_build_object('account','platform_'||p.bucket,'amount_minor',(-p.fee_minor)::text),
 jsonb_build_object('account','creator_'||p_to,'amount_minor',p.creator_minor::text),jsonb_build_object('account','platform_'||p_to,'amount_minor',p.fee_minor::text)),p_used=>case when not p.funded and p_to='available' then p.gross_minor when p.funded and p_to='unfunded' then -p.gross_minor else 0 end);
 update private.commission_positions set bucket=p_to,funded=case when p_to='unfunded' then false else funded or p_to='available' end where earning_id=p_id;
end; $$;
create function private.commission_enqueue() returns trigger language plpgsql security definer set search_path='' as $$
declare v_tx uuid; v_app uuid;
begin
 if tg_table_name='payment_transactions' then v_tx:=new.id;v_app:=new.app_id;else v_tx:=new.transaction_id;v_app:=new.app_id;end if;
 insert into private.commission_jobs(transaction_id,app_id) values(v_tx,v_app)
 on conflict(transaction_id) do update set status='pending',error_code=null,updated_at=now();
 return new;
end; $$;
create trigger commission_purchase_queue after insert on public.payment_transactions for each row execute function private.commission_enqueue();
create trigger commission_adjustment_queue after insert or update on public.payment_adjustments for each row execute function private.commission_enqueue();
insert into private.commission_jobs(transaction_id,app_id) select id,app_id from public.payment_transactions;

-- Policy/basis declarations are operator-only and explicitly sandbox. They are never inferred from browser input.
create function public.configure_commission_sandbox(p_fee_bps integer,p_effective_at timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if p_fee_bps is null or p_fee_bps not between 0 and 10000 or p_effective_at is null then raise exception 'invalid_sandbox_policy'; end if;
 if exists(select 1 from private.commission_bases b join public.payment_transactions t on t.id=b.transaction_id where t.occurred_at>=p_effective_at and not exists(select 1 from private.commission_policies p where p.id=b.policy_id and p.effective_at>p_effective_at)) then raise exception 'policy_cannot_rewrite_declared_history'; end if;
 insert into private.commission_policies(effective_at,platform_fee_bps,basis_policy) values(p_effective_at,p_fee_bps,'sandbox_explicit_paid_including_tax') returning id into v_id;
 return v_id;
end; $$;
create function public.declare_commission_basis(p_backend text,p_transaction uuid,p_basis_minor text) returns void language plpgsql security definer set search_path='' as $$
declare t public.payment_transactions%rowtype; v_policy uuid; v_basis bigint;
begin
 perform private.require_payment_backend(p_backend);
 select * into t from public.payment_transactions where id=p_transaction;
 if not found or t.environment<>'sandbox' then raise exception 'sandbox_transaction_required'; end if;
 if p_basis_minor is null or p_basis_minor !~ '^[0-9]{1,16}$' then raise exception 'invalid_commission_basis'; end if;
 v_basis:=p_basis_minor::bigint;if v_basis>t.amount_minor then raise exception 'invalid_commission_basis'; end if;
 select id into v_policy from private.commission_policies where effective_at<=t.occurred_at order by effective_at desc limit 1;
 if v_policy is null then raise exception 'sandbox_policy_missing'; end if;
 if exists(select 1 from private.commission_bases where transaction_id=t.id and (basis_minor<>v_basis or policy_id<>v_policy)) then raise exception 'commission_basis_is_immutable'; end if;
 insert into private.commission_bases values(t.id,v_basis,v_policy,now()) on conflict do nothing;
 insert into private.commission_jobs(transaction_id,app_id) values(t.id,t.app_id) on conflict(transaction_id) do update set status='pending',error_code=null;
end; $$;

create function private.reconcile_commission(p_tx uuid) returns text language plpgsql security definer set search_path='' as $$
declare t public.payment_transactions%rowtype; r public.customer_referrals%rowtype; e public.commission_earnings%rowtype; p private.commission_positions%rowtype;
 b private.commission_bases%rowtype; rate public.app_terms_plan_rates%rowtype; fee integer; g bigint; f bigint; c bigint; refunded bigint; net_basis bigint;
 dg bigint; df bigint; dc bigint; sale_change bigint; basis_change bigint; held boolean; source_time timestamptz; digest text; v_id uuid; v_month date; free_funding numeric;
begin
 select * into t from public.payment_transactions where id=p_tx;
 if t.environment<>'sandbox' then return 'ignored_live'; end if;
 select * into r from public.customer_referrals where id=t.referral_id;
 if r.creator_id is null or t.amount_minor=0 or t.is_trial then return 'ignored_nonqualifying'; end if;
 select * into b from private.commission_bases where transaction_id=t.id;
 if not found then raise exception 'waiting_commission_basis'; end if;
 select * into rate from public.app_terms_plan_rates where terms_version_id=r.terms_version_id and plan_id=t.plan_id;
 if not found or rate.currency<>t.currency then raise exception 'historical_plan_requires_review'; end if;
 select * into e from public.commission_earnings where transaction_id=t.id;
 if not found then
  select platform_fee_bps into fee from private.commission_policies where id=b.policy_id;
  g:=private.commission_round(b.basis_minor,rate.commission_bps);f:=private.commission_round(g,fee);c:=g-f;
  insert into public.commission_earnings(transaction_id,app_id,creator_id,referral_id,terms_version_id,plan_name,billing_interval,currency,sale_minor,commission_basis_minor,commission_bps,platform_fee_bps,gross_minor,platform_fee_minor,creator_minor,policy_id,occurred_at)
  values(t.id,t.app_id,r.creator_id,r.id,r.terms_version_id,rate.plan_name,rate.billing_interval::text,t.currency,t.amount_minor,b.basis_minor,rate.commission_bps,fee,g,f,c,b.policy_id,t.occurred_at) returning * into e;
  v_id:=private.commission_post(t.app_id,r.creator_id,t.id,t.currency,'accrual:'||t.id,'accrual',t.occurred_at,jsonb_build_array(
   jsonb_build_object('account','company_due','amount_minor',(-g)::text),jsonb_build_object('account','creator_accrued','amount_minor',c::text),jsonb_build_object('account','platform_accrued','amount_minor',f::text)),t.amount_minor,b.basis_minor,g,c,f);
  select effective_month into v_month from public.commission_journals where id=v_id;
  insert into private.commission_positions values(e.id,g,c,f,'accrued',false,v_month);
 end if;
 select * into p from private.commission_positions where earning_id=e.id;
 select least(t.amount_minor,coalesce(sum(amount_minor) filter(where kind='refund' and state='succeeded'),0)
  +coalesce(sum(amount_minor) filter(where kind='dispute' and state='lost'),0))::bigint,
  coalesce(bool_or(state in('open','pending','needs_review')),false), greatest(t.occurred_at,coalesce(max(occurred_at),t.occurred_at)),
  md5(coalesce(string_agg(id::text||':'||state||':'||amount_minor::text||':'||occurred_at::text||':'||event_ref,',' order by id),''))
 into refunded,held,source_time,digest from public.payment_adjustments where transaction_id=t.id;
 net_basis:=trunc(e.commission_basis_minor::numeric*(t.amount_minor-refunded)/t.amount_minor)::bigint;
 g:=private.commission_round(net_basis,e.commission_bps);f:=private.commission_round(g,e.platform_fee_bps);c:=g-f;
 dg:=g-p.gross_minor;df:=f-p.fee_minor;dc:=c-p.creator_minor;
 select -refunded-coalesce(sum(sale_delta),0),net_basis-e.commission_basis_minor-coalesce(sum(basis_delta),0) into sale_change,basis_change from public.commission_journals where transaction_id=t.id and kind='adjustment';
 if p.bucket in('in_payout','paid') and (sale_change<>0 or basis_change<>0 or held) then
  insert into public.commission_review_cases(app_id,creator_id,transaction_id,code,source_digest) values(t.app_id,r.creator_id,t.id,'adjustment_after_payout_requires_policy',digest) on conflict do nothing;
  return 'review_after_payout';
 end if;
 if dg>0 and p.funded then
  select coalesce(sum(funding_credit::numeric-funding_used),0) into free_funding from public.commission_journals where app_id=t.app_id and currency=t.currency;
  if free_funding<dg then
   perform private.commission_move(e.id,'unfunded','defund:'||t.id||':'||digest);
   select * into p from private.commission_positions where earning_id=e.id;
  end if;
 end if;
 if dg<>0 or df<>0 or dc<>0 or sale_change<>0 or basis_change<>0 then
  perform private.commission_post(t.app_id,r.creator_id,t.id,t.currency,'adjustment:'||t.id||':'||digest,'adjustment',source_time,jsonb_build_array(
  jsonb_build_object('account','company_due','amount_minor',(-dg)::text),jsonb_build_object('account','creator_'||p.bucket,'amount_minor',dc::text),jsonb_build_object('account','platform_'||p.bucket,'amount_minor',df::text)),
  sale_change,basis_change,dg,dc,df,p_used=>case when p.funded then dg else 0 end);
  update private.commission_positions set gross_minor=g,creator_minor=c,fee_minor=f where earning_id=e.id;
 end if;
 if held and p.bucket<>'held' then perform private.commission_move(e.id,'held','hold:'||t.id||':'||digest);
 elsif not held and p.bucket='held' then
  perform private.commission_move(e.id,case when p.funded then 'available' when exists(select 1 from public.commission_month_closures where app_id=t.app_id and month=p.effective_month) then 'unfunded' else 'accrued' end,'unhold:'||t.id||':'||digest);
 end if;
 return 'processed';
end; $$;

create function private.commission_release(p_app uuid) returns void language plpgsql security definer set search_path='' as $$
declare v record; available numeric;
begin
 for v in select e.id,e.currency,p.gross_minor from public.commission_earnings e join private.commission_positions p on p.earning_id=e.id
 where e.app_id=p_app and p.bucket='unfunded' and not p.funded and p.gross_minor>0 order by p.effective_month,e.occurred_at,e.id loop
  select coalesce(sum(funding_credit::numeric-funding_used),0) into available from public.commission_journals where app_id=p_app and currency=v.currency;
  if available>=v.gross_minor then perform private.commission_move(v.id,'available','fund:'||v.id||':'||(select count(*) from public.commission_journals where transaction_id=(select transaction_id from public.commission_earnings where id=v.id))); end if;
 end loop;
end; $$;
create function public.process_commission_jobs(p_backend text,p_limit integer default 20,p_app_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare j record; v_status text; v_error text; result jsonb:='[]';
begin
 perform private.require_payment_backend(p_backend);
 for j in select transaction_id,app_id from private.commission_jobs where status='pending' and (p_app_id is null or app_id=p_app_id) order by app_id,transaction_id limit greatest(1,least(p_limit,100)) loop
  perform pg_advisory_xact_lock(hashtextextended(j.app_id::text,7));
  perform 1 from private.commission_jobs where transaction_id=j.transaction_id and status='pending' for update;
  if not found then continue; end if;
  v_error:=null;
  begin
   v_status:=private.reconcile_commission(j.transaction_id);
  exception when others then
   v_error:=case when sqlerrm in('waiting_commission_basis','historical_plan_requires_review') then sqlerrm else 'commission_processing_error' end;
   v_status:=case when v_error='historical_plan_requires_review' then 'review' else 'waiting' end;
   if v_status='review' then
    insert into public.commission_review_cases(app_id,creator_id,transaction_id,code,source_digest)
    select j.app_id,r.creator_id,t.id,v_error,md5(coalesce(r.terms_version_id::text,'')||t.plan_id::text||t.currency) from public.payment_transactions t join public.customer_referrals r on r.id=t.referral_id where t.id=j.transaction_id on conflict do nothing;
   end if;
  end;
  update private.commission_jobs set status=case when v_status like 'ignored_%' then 'ignored' when v_status like 'review_%' then 'review' else v_status end,error_code=v_error,attempts=attempts+1,updated_at=now() where transaction_id=j.transaction_id;
  perform private.commission_release(j.app_id);
  result:=result||jsonb_build_array(jsonb_build_object('status',v_status,'error_code',v_error));
 end loop;
 return result;
end; $$;
create function public.close_commission_month(p_backend text,p_app_id uuid,p_month date) returns text language plpgsql security definer set search_path='' as $$
declare v record;
begin
 perform private.require_payment_backend(p_backend);
 if p_month is null or extract(day from p_month)<>1 or p_month>=private.commission_month(now()) then raise exception 'completed_utc_month_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_app_id::text,7));
 if exists(select 1 from public.commission_month_closures where app_id=p_app_id and month=p_month) then return 'already_closed'; end if;
 if exists(select 1 from private.commission_jobs j join public.payment_transactions t on t.id=j.transaction_id where j.app_id=p_app_id and t.environment='sandbox' and private.commission_month(t.occurred_at)<=p_month and j.status in('pending','waiting')) then raise exception 'unreconciled_commission_jobs'; end if;
 insert into public.commission_month_closures(app_id,month) values(p_app_id,p_month);
 for v in select e.id from public.commission_earnings e join private.commission_positions p on p.earning_id=e.id where e.app_id=p_app_id and p.bucket='accrued' and p.effective_month=p_month order by e.id loop
  perform private.commission_move(v.id,'unfunded','close:'||p_month||':'||v.id);
 end loop;
 insert into public.commission_statements(app_id,creator_id,month,currency,sale_minor,basis_minor,gross_minor,creator_minor,fee_minor)
 select p_app_id,creator_id,p_month,currency,sum(sale_delta),sum(basis_delta),sum(gross_delta),sum(creator_delta),sum(fee_delta)
 from public.commission_journals where app_id=p_app_id and effective_month=p_month and creator_id is not null group by creator_id,currency;
 perform private.commission_release(p_app_id);
 return 'closed';
end; $$;
create function public.fund_commission_sandbox(p_app_id uuid,p_currency text,p_amount_minor text,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare v_amount bigint; v_old public.commission_journals%rowtype;
begin
 if p_currency !~ '^[A-Z]{3}$' or p_currency is null or p_amount_minor is null or p_amount_minor !~ '^[0-9]{1,16}$' or p_reference is null or p_reference !~ '^[A-Za-z0-9_-]{1,100}$' then raise exception 'invalid_fixture_funding'; end if;
 v_amount:=p_amount_minor::bigint;if v_amount<=0 then raise exception 'invalid_fixture_funding'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_app_id::text,7));
 select * into v_old from public.commission_journals where app_id=p_app_id and idempotency_key='fixture-funding:'||p_reference;
 if found then if v_old.currency<>p_currency or v_old.funding_credit<>v_amount then raise exception 'funding_reference_conflict'; end if;return;end if;
 perform private.commission_post(p_app_id,null,null,p_currency,'fixture-funding:'||p_reference,'sandbox_fixture_funding',now(),jsonb_build_array(
 jsonb_build_object('account','sandbox_cash','amount_minor',v_amount::text),jsonb_build_object('account','sandbox_funding','amount_minor',(-v_amount)::text)),p_credit=>v_amount);
 perform private.commission_release(p_app_id);
end; $$;
-- Controlled operator fixture for acceptance of post-payout corrections; no payment is executed.
create function public.simulate_commission_payout(p_earning uuid,p_paid boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare e public.commission_earnings%rowtype; p private.commission_positions%rowtype; target text;
begin
 select * into e from public.commission_earnings where id=p_earning;if not found then raise exception 'earning_not_found';end if;
 perform pg_advisory_xact_lock(hashtextextended(e.app_id::text,7));select * into p from private.commission_positions where earning_id=e.id;
 target:=case when p_paid then 'paid' else 'in_payout' end;
 if p.bucket=target then return;end if;
 if (not p_paid and p.bucket<>'available') or (p_paid and p.bucket<>'in_payout') then raise exception 'invalid_fixture_payout_state';end if;
 if exists(select 1 from private.commission_jobs where transaction_id=e.transaction_id and status not in('processed','ignored')) then raise exception 'unreconciled_commission_jobs';end if;
 perform private.commission_move(e.id,target,'fixture-payout:'||e.id||':'||target);
end; $$;

-- Read-only API: explicit creator vs company context prevents dual-role data mixing; money is text.
create function private.commission_readable(p_app uuid,p_creator uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_creator=(select auth.uid()) or private.is_app_org_member(p_app) or private.is_platform_admin();
$$;
alter table public.commission_earnings enable row level security;
alter table public.commission_journals enable row level security;
alter table public.commission_month_closures enable row level security;
alter table public.commission_statements enable row level security;
alter table public.commission_review_cases enable row level security;
create policy "commission earnings read" on public.commission_earnings for select to authenticated using(private.commission_readable(app_id,creator_id));
create policy "commission journals read" on public.commission_journals for select to authenticated using(private.commission_readable(app_id,creator_id));
create policy "commission closures read" on public.commission_month_closures for select to authenticated using(private.is_app_org_member(app_id) or private.is_platform_admin() or exists(select 1 from public.commission_earnings e where e.app_id=commission_month_closures.app_id and e.creator_id=(select auth.uid())));
create policy "commission statements read" on public.commission_statements for select to authenticated using(private.commission_readable(app_id,creator_id));
create policy "commission cases read" on public.commission_review_cases for select to authenticated using(private.commission_readable(app_id,creator_id));
grant select on public.commission_earnings,public.commission_journals,public.commission_month_closures,public.commission_statements,public.commission_review_cases to authenticated;
create function public.commission_workspace(p_app_id uuid default null,p_creator_id uuid default null,p_referral_id uuid default null) returns jsonb language sql stable security definer set search_path='' as $$
 with visible as (
 select e.*,p.gross_minor net_gross,p.creator_minor net_creator,p.fee_minor net_fee,p.bucket,p.effective_month,p.funded
 from public.commission_earnings e join private.commission_positions p on p.earning_id=e.id
 where private.commission_readable(e.app_id,e.creator_id) and (p_app_id is null or e.app_id=p_app_id) and (p_creator_id is null or e.creator_id=p_creator_id) and (p_referral_id is null or e.referral_id=p_referral_id)
 ), totals as (
 select currency,coalesce(sum(net_creator) filter(where bucket='accrued' and effective_month=private.commission_month(now())),0)::text accrued_this_month,
 coalesce(sum(net_creator) filter(where bucket='accrued'),0)::text accrued,
 coalesce(sum(net_creator) filter(where bucket='unfunded'),0)::text awaiting_funding,
 coalesce(sum(net_creator) filter(where bucket='available'),0)::text available,
 coalesce(sum(net_creator) filter(where bucket='held'),0)::text held,
 coalesce(sum(net_creator) filter(where bucket='in_payout'),0)::text in_payout,
 coalesce(sum(net_creator) filter(where bucket='paid'),0)::text paid from visible group by currency
 ) select jsonb_build_object('totals',coalesce((select jsonb_agg(to_jsonb(t)) from totals t),'[]'),
 'earnings',coalesce((select jsonb_agg(to_jsonb(x)) from (
 select id,app_id,referral_id,plan_name,billing_interval,currency,occurred_at,commission_bps,platform_fee_bps,
 sale_minor::text,commission_basis_minor::text,gross_minor::text,platform_fee_minor::text,creator_minor::text,
 net_gross::text,net_creator::text,net_fee::text,bucket,effective_month,funded from visible order by occurred_at desc,id limit 100) x),'[]'),
 'statements',coalesce((select jsonb_agg(to_jsonb(s)) from (select id,app_id,creator_id,month,currency,sale_minor::text,basis_minor::text,gross_minor::text,creator_minor::text,fee_minor::text,created_at from public.commission_statements where p_referral_id is null and private.commission_readable(app_id,creator_id) and (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id) order by month desc,id limit 100) s),'[]'),
 'corrections',coalesce((select jsonb_agg(to_jsonb(j)) from (select id,transaction_id,kind,(select private.commission_month(t.occurred_at) from public.payment_transactions t where t.id=commission_journals.transaction_id) original_month,source_month,effective_month,currency,gross_delta::text,creator_delta::text,fee_delta::text from public.commission_journals where kind='adjustment' and (p_referral_id is null or transaction_id in(select transaction_id from visible)) and private.commission_readable(app_id,creator_id) and (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id) order by created_at desc,id limit 100) j),'[]'),
 'cases',coalesce((select jsonb_agg(to_jsonb(c)) from (select id,transaction_id,code,created_at from public.commission_review_cases where (p_referral_id is null or transaction_id in(select transaction_id from visible)) and private.commission_readable(app_id,creator_id) and (p_app_id is null or app_id=p_app_id) and (p_creator_id is null or creator_id=p_creator_id) order by created_at desc limit 100) c),'[]'),
 'jobs',coalesce((select jsonb_agg(to_jsonb(j)) from (select j.transaction_id,j.status,j.error_code from private.commission_jobs j join public.payment_transactions t on t.id=j.transaction_id join public.customer_referrals r on r.id=t.referral_id where j.status in('waiting','review') and private.commission_readable(j.app_id,r.creator_id) and (p_app_id is null or j.app_id=p_app_id) and (p_creator_id is null or r.creator_id=p_creator_id) and (p_referral_id is null or r.id=p_referral_id) order by j.updated_at desc limit 100) j),'[]'));
$$;
-- Explicit grants: no financial mutation for anon/authenticated, including forged frontend forms.
revoke all on function public.configure_commission_sandbox(integer,timestamptz),public.fund_commission_sandbox(uuid,text,text,text),public.simulate_commission_payout(uuid,boolean) from public,anon,authenticated;
grant execute on function public.configure_commission_sandbox(integer,timestamptz),public.fund_commission_sandbox(uuid,text,text,text),public.simulate_commission_payout(uuid,boolean) to service_role;
revoke all on function public.declare_commission_basis(text,uuid,text),public.process_commission_jobs(text,integer,uuid),public.close_commission_month(text,uuid,date) from public,authenticated;
grant execute on function public.declare_commission_basis(text,uuid,text),public.process_commission_jobs(text,integer,uuid),public.close_commission_month(text,uuid,date) to anon;
revoke all on function public.commission_workspace(uuid,uuid,uuid) from public,anon;
grant execute on function public.commission_workspace(uuid,uuid,uuid) to authenticated;
do $$ declare f record; begin
 for f in select p.oid::regprocedure name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and (p.proname like 'commission_%' or p.proname='reconcile_commission') loop
 execute 'revoke all on function '||f.name||' from public,anon,authenticated';
 end loop;
end; $$;
grant execute on function private.commission_readable(uuid,uuid),private.commission_entries_balanced(jsonb) to authenticated;
alter table private.commission_policies enable row level security;
alter table private.commission_bases enable row level security;
alter table private.commission_jobs enable row level security;
alter table private.commission_positions enable row level security;
create function public.commission_sandbox_inputs(p_backend text,p_app_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform private.require_payment_backend(p_backend);
 return coalesce((select jsonb_agg(to_jsonb(t)) from (select t.id,t.amount_minor::text from public.payment_transactions t left join private.commission_bases b on b.transaction_id=t.id join public.customer_referrals r on r.id=t.referral_id where t.app_id=p_app_id and t.environment='sandbox' and t.amount_minor>0 and not t.is_trial and r.creator_id is not null and b.transaction_id is null order by t.id limit 100) t),'[]');
end; $$;
revoke all on function public.commission_sandbox_inputs(text,uuid) from public,authenticated;
grant execute on function public.commission_sandbox_inputs(text,uuid) to anon;
