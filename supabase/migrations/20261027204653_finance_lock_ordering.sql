-- E8: job -> case/scenario lock ordering for operator review and worker reconciliation.
create or replace function public.finance_review_case(p_job uuid,p_note text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_platform_admin() then raise exception 'not_authorized';end if;
 if p_note is null or length(btrim(p_note)) not between 10 and 500 then raise exception 'review_note_required';end if;
 -- Claim the job before its case, matching settle/defer/reconciliation.
 perform 1 from private.finance_jobs where id=p_job for update;
 perform 1 from private.finance_cases where job_id=p_job and resolved_at is null for update;
 if not found then raise exception 'case_not_open';end if;
 if not exists(select 1 from private.finance_provider_objects where job_id=p_job) then raise exception 'provider_evidence_required';end if;
 update private.finance_jobs set status='pending',attempts=0,next_at=now(),lease_id=null,lease_until=null where id=p_job and status in('review','done');
 if not found then raise exception 'case_in_progress';end if;
 insert into private.finance_audit(actor,action,entity_id,note) values((select auth.uid()),'reconciliation_requested',p_job,btrim(p_note));
end; $$;

create or replace function public.finance_test_scenario(p_job uuid,p_scenario text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from private.finance_jobs where id=p_job for update;
 if exists(select 1 from private.finance_jobs where id=p_job and status not in('pending','review')) or exists(select 1 from private.finance_provider_objects where job_id=p_job) then raise exception 'scenario_already_started';end if;
 insert into private.finance_scenarios(job_id,scenario) values(p_job,p_scenario) on conflict(job_id) do update set scenario=excluded.scenario;
 update private.finance_jobs set status='pending',attempts=0,next_at=now(),lease_id=null,lease_until=null where id=p_job and status='review';
 insert into private.finance_audit(action,entity_id,note) values('sandbox_scenario_set',p_job,p_scenario);
end; $$;

create or replace function public.finance_reconcile(p_backend text,p_app_id uuid default null) returns integer language plpgsql security definer set search_path='' as $$
declare j record; expected text; n integer:=0;
begin
 perform private.require_payment_backend(p_backend);
 -- Exhausted workers retain reservations until authoritative evidence or operator review.
 for j in select id from private.finance_jobs where status='processing' and lease_until<now() and attempts>=3 order by id loop
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
    or j.scope_ref<>(case when j.kind='funding' then j.app_id::text else j.account_ref end) or j.state<>expected
    or (j.kind='funding' and j.funding_status='available' and not exists(select 1 from public.commission_journals where app_id=j.app_id and idempotency_key='provider-funding:'||j.funding_id and funding_credit=j.funding_amount and currency=j.funding_currency))
    or (j.kind='bank' and exists(select 1 from private.finance_payout_items i join private.commission_positions pos on pos.earning_id=i.earning_id where i.payout_id=j.payout_id and pos.bucket<>(case when j.payout_status='paid' then 'paid' else 'in_payout' end))) then
   perform 1 from private.finance_jobs where id=j.id for update;
   perform private.finance_case(j.id,'provider_ledger_mismatch');n:=n+1;
   -- A bank return reverses the paid projection, never the platform transfer.
   if j.kind='bank' and j.state='returned' and expected='paid' then
    update private.finance_jobs set status='pending',attempts=0,next_at=now() where id=j.id and status='done';
   end if;
  end if;
 end loop;
 return n;
end; $$;
