-- E8: admin-only evidence comparison; no provider credentials, payloads or KYC.
create or replace function public.finance_workspace(p_app_id uuid default null,p_admin boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
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
  select c.job_id,c.code,c.created_at,c.resolved_at,j.kind,j.status,j.attempts,j.funding_id,j.payout_id,
   (case when j.kind='funding' then f.amount_minor when j.kind='bank' then p.amount_minor-p.fee_minor else p.amount_minor end)::text expected_amount_minor,
   coalesce(f.currency,p.currency) expected_currency, o.state provider_state,o.amount_minor::text provider_amount_minor,o.currency provider_currency,o.provider_ref,
   coalesce(f.status,p.status) ledger_status
  from private.finance_cases c join private.finance_jobs j on j.id=c.job_id
  left join private.finance_funding f on f.id=j.funding_id left join private.finance_payouts p on p.id=j.payout_id
  left join private.finance_provider_objects o on o.job_id=j.id
  where admin_mode order by c.created_at desc limit 100
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
-- Existing E7 balances must remain visible before payment-method onboarding.
insert into private.finance_accounts(app_id,currency) select id,'EUR' from public.apps on conflict do nothing;
create function private.finance_initialize_account() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.finance_accounts(app_id,currency) values(new.id,'EUR');
 return new;
end; $$;
revoke all on function private.finance_initialize_account() from public,anon,authenticated;
create trigger finance_app_account after insert on public.apps for each row execute function private.finance_initialize_account();
