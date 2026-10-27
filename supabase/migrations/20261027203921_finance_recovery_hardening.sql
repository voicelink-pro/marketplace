-- E8: reconciliation cannot undo a terminal platform transfer or silently accept a missing funding journal.
create or replace function public.finance_settle(p_backend text,p_job uuid,p_lease uuid) returns text language plpgsql security definer set search_path='' as $$
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

 -- Terminal platform effects cannot be reversed or recreated by an inconsistent receipt.
 -- A bank return is handled separately below and never reverses a transfer.
 if (j.kind='funding' and f.status='available' and (o.state='failed' or not exists(select 1 from public.commission_journals where app_id=f.app_id and idempotency_key='provider-funding:'||f.id and funding_credit=f.amount_minor and currency=f.currency)))
 or (j.kind='transfer' and ((p.status='transfer_failed' and o.state='succeeded') or (p.status not in('requested','transfer_failed') and o.state='failed'))) then
  perform private.finance_case(j.id,'terminal_effect_requires_review');
  update private.finance_jobs set status='review' where id=j.id;return 'review';
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

create or replace function public.finance_test_scenario(p_job uuid,p_scenario text) returns void language plpgsql security definer set search_path='' as $$
begin
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
    or j.scope_ref<>(case when j.kind='funding' then j.app_id::text else j.account_ref end) or j.state<>expected
    or (j.kind='funding' and j.funding_status='available' and not exists(select 1 from public.commission_journals where app_id=j.app_id and idempotency_key='provider-funding:'||j.funding_id and funding_credit=j.funding_amount and currency=j.funding_currency))
    or (j.kind='bank' and exists(select 1 from private.finance_payout_items i join private.commission_positions pos on pos.earning_id=i.earning_id where i.payout_id=j.payout_id and pos.bucket<>(case when j.payout_status='paid' then 'paid' else 'in_payout' end))) then
   perform private.finance_case(j.id,'provider_ledger_mismatch');n:=n+1;
   -- A bank return reverses the paid projection, never the platform transfer.
   if j.kind='bank' and j.state='returned' and expected='paid' then
    update private.finance_jobs set status='pending',attempts=0,next_at=now() where id=j.id and status='done';
   end if;
  end if;
 end loop;
 return n;
end; $$;
