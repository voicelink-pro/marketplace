-- E9: scoped support, in-app notifications, append-only operational audit and worker health.
create table private.ops_audit (
 id bigint generated always as identity primary key, actor_id uuid, app_id uuid,
 entity_id uuid not null, action text not null, note text,
 created_at timestamptz not null default now()
);
create index ops_audit_app_idx on private.ops_audit(app_id,created_at desc);
create table private.ops_notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null, code text not null, href text not null check(href in('/company/app','/company/integrations','/company/funding','/creator/payouts','/creator/earnings','/support')),
 created_at timestamptz not null default now(), read_at timestamptz, unique(user_id,event_key)
);
create index ops_notifications_user_idx on private.ops_notifications(user_id,created_at desc);
create table private.support_tickets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 app_id uuid references public.apps(id) on delete set null, category text not null check(category in('account','integration','funding','payout','other')),
 subject text not null check(length(btrim(subject)) between 5 and 160), status text not null default 'open' check(status in('open','in_progress','closed')),
 revision integer not null default 1, request_key uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,request_key)
);
create index support_tickets_app_idx on private.support_tickets(app_id);
create index support_tickets_status_idx on private.support_tickets(status,updated_at desc);
create table private.support_messages (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references private.support_tickets(id) on delete cascade,
 author_id uuid references auth.users(id) on delete set null, is_admin boolean not null,
 body text not null check(length(btrim(body)) between 5 and 3000), request_key uuid not null,
 created_at timestamptz not null default now(), unique(ticket_id,request_key)
);
create index support_messages_author_idx on private.support_messages(author_id);
create table private.ops_case_reviews (
 case_id uuid primary key references public.commission_review_cases(id) on delete cascade,
 state text not null check(state in('in_review','awaiting_policy')), note text not null,
 reviewer_id uuid references auth.users(id) on delete set null, updated_at timestamptz not null default now()
);
create index ops_case_reviews_reviewer_idx on private.ops_case_reviews(reviewer_id);
create table private.ops_worker_health (
 worker text not null check(worker in('payments','commissions','finance')), scope text not null,
 last_seen_at timestamptz not null default now(), ok boolean not null, primary key(worker,scope)
);
create function private.ops_audit_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'audit_is_immutable';end; $$;
create trigger ops_audit_immutable before update or delete on private.ops_audit for each row execute function private.ops_audit_immutable();
create function private.ops_notify(p_user uuid,p_key text,p_code text,p_href text) returns void language sql security definer set search_path='' as $$
 insert into private.ops_notifications(user_id,event_key,code,href) values(p_user,p_key,p_code,p_href) on conflict(user_id,event_key) do nothing;
$$;
create function private.ops_notify_company(p_app uuid,p_key text,p_code text,p_href text) returns void language sql security definer set search_path='' as $$
 insert into private.ops_notifications(user_id,event_key,code,href)
 select m.user_id,p_key,p_code,p_href from public.apps a join public.organization_members m on m.organization_id=a.organization_id where a.id=p_app
 on conflict(user_id,event_key) do nothing;
$$;
create function private.ops_capture() returns trigger language plpgsql security definer set search_path='' as $$
declare a uuid; entity uuid; code text; actor uuid:=(select auth.uid());
begin
 if tg_table_name='app_review_events' then
  a:=new.app_id;entity:=new.id;code:='app_'||new.event_type;actor:=new.actor_id;
  perform private.ops_notify_company(a,'review:'||entity,code,'/company/app');
 elsif tg_table_name='payment_integrations' then
  a:=new.app_id;entity:=new.id;code:=case when tg_op='INSERT' then 'integration_configured' else 'integration_configuration_changed' end;
 elsif tg_table_name='payment_events' then
  if new.status not in('waiting','failed') or (tg_op='UPDATE' and new.status=old.status and new.error_code is not distinct from old.error_code) then return new;end if;
  a:=new.app_id;entity:=new.id;code:='payment_event_needs_attention';
  perform private.ops_notify_company(a,'payment:'||entity||':'||coalesce(new.error_code,'unknown'),code,'/company/integrations');
 elsif tg_table_name='finance_notices' then
  a:=new.app_id;entity:=new.funding_id;code:=new.code;
  perform private.ops_notify_company(a,'funding-failure:'||entity,code,'/company/funding');
 elsif tg_table_name='finance_payouts' then
  if tg_op='UPDATE' and new.status=old.status then return new;end if;
  entity:=new.id;code:='payout_'||new.status;
  perform private.ops_notify(new.creator_id,'payout:'||entity||':'||new.status||':'||new.bank_attempt,code,'/creator/payouts');
 elsif tg_table_name='commission_review_cases' then
  a:=new.app_id;entity:=new.id;code:='commission_requires_review';
  perform private.ops_notify_company(a,'commission-review:'||entity,code,'/company/funding');
  if new.creator_id is not null then perform private.ops_notify(new.creator_id,'commission-review:'||entity,code,'/creator/earnings');end if;
 else return new;
 end if;
 insert into private.ops_audit(actor_id,app_id,entity_id,action) values(actor,a,entity,code);
 return new;
end; $$;
create trigger ops_app_review after insert on public.app_review_events for each row execute function private.ops_capture();
create trigger ops_integration_config after insert or update of provider_account_id,credential_ref on public.payment_integrations for each row execute function private.ops_capture();
create trigger ops_payment_problem after insert or update of status,error_code on public.payment_events for each row execute function private.ops_capture();
create trigger ops_funding_failure after insert on private.finance_notices for each row execute function private.ops_capture();
create trigger ops_payout_status after insert or update of status on private.finance_payouts for each row execute function private.ops_capture();
create trigger ops_commission_review after insert on public.commission_review_cases for each row execute function private.ops_capture();

create function public.ops_create_ticket(p_subject text,p_body text,p_category text,p_request_key uuid,p_app_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare t private.support_tickets%rowtype; me uuid:=(select auth.uid());
begin
 if me is null then raise exception 'not_authorized';end if;
 if p_subject is null or length(btrim(p_subject)) not between 5 and 160 or p_body is null or length(btrim(p_body)) not between 5 and 3000 or p_category is null or p_category not in('account','integration','funding','payout','other') or p_request_key is null then raise exception 'invalid_ticket';end if;
 if p_app_id is not null and not private.is_app_org_member(p_app_id) then raise exception 'not_authorized';end if;
 perform pg_advisory_xact_lock(hashtextextended(me::text,9));
 select * into t from private.support_tickets where user_id=me and request_key=p_request_key;
 if found then
  if t.subject<>btrim(p_subject) or t.category<>p_category or t.app_id is distinct from p_app_id or not exists(select 1 from private.support_messages where ticket_id=t.id and request_key=p_request_key and body=btrim(p_body)) then raise exception 'idempotency_conflict';end if;
  return t.id;
 end if;
 if (select count(*) from private.support_tickets where user_id=me and created_at>now()-interval '1 day')>=10 then raise exception 'ticket_rate_limit';end if;
 insert into private.support_tickets(user_id,app_id,category,subject,request_key) values(me,p_app_id,p_category,btrim(p_subject),p_request_key) returning * into t;
 insert into private.support_messages(ticket_id,author_id,is_admin,body,request_key) values(t.id,me,false,btrim(p_body),p_request_key);
 insert into private.ops_audit(actor_id,app_id,entity_id,action) values(me,p_app_id,t.id,'support_ticket_created');
 perform private.ops_notify(me,'support-created:'||t.id,'support_ticket_created','/support');
 return t.id;
end; $$;
create function public.ops_reply_ticket(p_ticket uuid,p_body text,p_request_key uuid,p_expected_revision integer,p_status text default null) returns void language plpgsql security definer set search_path='' as $$
declare t private.support_tickets%rowtype; me uuid:=(select auth.uid()); admin_mode boolean:=private.is_platform_admin(); m private.support_messages%rowtype;
begin
 select * into t from private.support_tickets where id=p_ticket and (user_id=me or admin_mode) for update;
 if not found or me is null then raise exception 'not_authorized';end if;
 if p_body is null or length(btrim(p_body)) not between 5 and 3000 or p_request_key is null or (p_status is not null and (not admin_mode or p_status not in('open','in_progress','closed'))) then raise exception 'invalid_reply';end if;
 select * into m from private.support_messages where ticket_id=t.id and request_key=p_request_key;
 if found then
  if m.author_id is distinct from me or m.body<>btrim(p_body) then raise exception 'idempotency_conflict';end if;return;
 end if;
 if p_expected_revision is distinct from t.revision then raise exception 'stale_ticket';end if;
 if (select count(*) from private.support_messages where author_id=me and created_at>now()-interval '1 hour')>=30 then raise exception 'reply_rate_limit';end if;
 insert into private.support_messages(ticket_id,author_id,is_admin,body,request_key) values(t.id,me,admin_mode,btrim(p_body),p_request_key);
 update private.support_tickets set status=case when admin_mode then coalesce(p_status,status) when status='closed' then 'open' else status end,revision=revision+1,updated_at=now() where id=t.id;
 insert into private.ops_audit(actor_id,app_id,entity_id,action) values(me,t.app_id,t.id,'support_ticket_replied');
 if admin_mode then perform private.ops_notify(t.user_id,'support-reply:'||p_request_key,'support_reply','/support');end if;
end; $$;
create function public.ops_mark_notification(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update private.ops_notifications set read_at=coalesce(read_at,now()) where id=p_id and user_id=(select auth.uid());
 if not found then raise exception 'not_authorized';end if;
end; $$;
create function public.ops_inbox() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare me uuid:=(select auth.uid()); result jsonb;
begin
 if me is null then raise exception 'not_authorized';end if;
 with tickets as(select id,subject,category,status,revision,created_at,updated_at from private.support_tickets where user_id=me order by updated_at desc,id limit 50)
 select jsonb_build_object('notifications',coalesce((select jsonb_agg(to_jsonb(n)) from (select id,code,href,created_at,read_at from private.ops_notifications where user_id=me order by created_at desc,id limit 100) n),'[]'),
 'unread',(select count(*) from private.ops_notifications where user_id=me and read_at is null),
 'tickets',coalesce((select jsonb_agg(to_jsonb(t)) from tickets t),'[]'),
 'messages',coalesce((select jsonb_agg(to_jsonb(m)) from (select id,ticket_id,is_admin,body,created_at from private.support_messages where ticket_id in(select id from tickets) order by created_at desc,id limit 500) m),'[]')) into result;
 return result;
end; $$;
create function public.ops_worker_heartbeat(p_backend text,p_worker text,p_scope uuid default null,p_ok boolean default true) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_payment_backend(p_backend);
 if p_worker is null or p_worker not in('payments','commissions','finance') or p_ok is null then raise exception 'invalid_heartbeat';end if;
 insert into private.ops_worker_health(worker,scope,ok) values(p_worker,coalesce(p_scope::text,'global'),p_ok)
 on conflict(worker,scope) do update set ok=excluded.ok,last_seen_at=now();
end; $$;
create function private.ops_health() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'workers',(select jsonb_agg(jsonb_build_object('worker',w.worker,'last_seen_at',h.last_seen_at,'state',case when h.worker is null then 'unknown' when h.last_seen_at<now()-interval '2 minutes' then 'stale' when not h.ok then 'error' else 'ok' end)) from (values('payments'),('commissions'),('finance')) w(worker) left join private.ops_worker_health h on h.worker=w.worker and h.scope='global'),
 'payment_attention',(select count(*) from public.payment_events where status in('waiting','failed') or (status='pending' and received_at<now()-interval '5 minutes') or (status='processing' and lease_until<now())),
 'commission_attention',(select count(*) from private.commission_jobs where status in('waiting','review') or (status='pending' and updated_at<now()-interval '5 minutes')),
 'finance_attention',(select count(*) from private.finance_jobs where status='review' or (status='processing' and lease_until<now()) or (status='pending' and next_at<now()-interval '5 minutes')),
 'open_tickets',(select count(*) from private.support_tickets where status<>'closed'),
 'live_enabled',false);
$$;
create function public.ops_health(p_backend text) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin perform private.require_payment_backend(p_backend);return private.ops_health();end; $$;
create function public.ops_admin_retry_event(p_event uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare e public.payment_events%rowtype;
begin
 if not private.is_platform_admin() then raise exception 'not_authorized';end if;
 if p_reason is null or length(btrim(p_reason)) not between 10 and 500 then raise exception 'review_note_required';end if;
 select * into e from public.payment_events where id=p_event for update;
 if not found or e.environment<>'sandbox' or e.status in('processed','ignored','blocked') or (e.status='processing' and e.lease_until>now()) then raise exception 'event_not_retryable';end if;
 update public.payment_events set status='pending',next_attempt_at=now(),attempts=0,lease=null,lease_until=null,error_code=null where id=e.id;
 insert into private.ops_audit(actor_id,app_id,entity_id,action,note) values((select auth.uid()),e.app_id,e.id,'admin_event_retry',btrim(p_reason));
end; $$;
create function public.ops_review_commission(p_case uuid,p_state text,p_note text) returns void language plpgsql security definer set search_path='' as $$
declare a uuid;
begin
 if not private.is_platform_admin() then raise exception 'not_authorized';end if;
 if p_state is null or p_state not in('in_review','awaiting_policy') or p_note is null or length(btrim(p_note)) not between 10 and 1000 then raise exception 'review_note_required';end if;
 select app_id into a from public.commission_review_cases where id=p_case;
 if not found then raise exception 'case_not_found';end if;
 insert into private.ops_case_reviews(case_id,state,note,reviewer_id) values(p_case,p_state,btrim(p_note),(select auth.uid()))
 on conflict(case_id) do update set state=excluded.state,note=excluded.note,reviewer_id=excluded.reviewer_id,updated_at=now();
 insert into private.ops_audit(actor_id,app_id,entity_id,action,note) values((select auth.uid()),a,p_case,'commission_'||p_state,btrim(p_note));
end; $$;
create function public.ops_admin_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_platform_admin() then raise exception 'not_authorized';end if;
 with tickets as(select id,user_id,app_id,subject,category,status,revision,created_at,updated_at from private.support_tickets order by (status<>'closed') desc,updated_at desc,id limit 100)
 select jsonb_build_object('health',private.ops_health(),
 'integrations',coalesce((select jsonb_agg(to_jsonb(i)) from (select i.id,i.app_id,a.name app_name,i.provider,i.environment,i.configured_at,i.verified_at,i.last_received_at,i.last_processed_at from public.payment_integrations i join public.apps a on a.id=i.app_id order by i.configured_at desc,i.id limit 100) i),'[]'),
 'events',coalesce((select jsonb_agg(to_jsonb(e)) from (select e.id,e.app_id,e.integration_id,e.environment,e.status,e.kind,e.error_code,e.attempts,e.received_at,e.next_attempt_at from public.payment_events e where e.status in('pending','processing','waiting','failed','blocked') order by e.received_at,e.id limit 100) e),'[]'),
 'commission_jobs',coalesce((select jsonb_agg(to_jsonb(j)) from (select transaction_id,app_id,status,error_code,attempts,updated_at from private.commission_jobs where status in('pending','waiting','review') order by updated_at,transaction_id limit 100) j),'[]'),
 'commission_cases',coalesce((select jsonb_agg(to_jsonb(c)) from (select c.id,c.app_id,c.transaction_id,c.code,c.created_at,coalesce(r.state,'open') state,r.note from public.commission_review_cases c left join private.ops_case_reviews r on r.case_id=c.id order by c.created_at desc,c.id limit 100) c),'[]'),
 'tickets',coalesce((select jsonb_agg(to_jsonb(t)) from tickets t),'[]'),
 'messages',coalesce((select jsonb_agg(to_jsonb(m)) from (select id,ticket_id,is_admin,body,created_at from private.support_messages where ticket_id in(select id from tickets) order by created_at desc,id limit 500) m),'[]'),
 'audit',coalesce((select jsonb_agg(to_jsonb(a)) from (select id::text,actor_id,app_id,entity_id,action,note,created_at from private.ops_audit order by id desc limit 100) a),'[]')) into result;
 return result;
end; $$;
-- Import existing funding failures into inboxes without modifying financial history.
select private.ops_notify_company(app_id,'funding-failure:'||funding_id,code,'/company/funding') from private.finance_notices;
do $$ declare t record; f record;begin
 for t in select tablename from pg_tables where schemaname='private' and (tablename like 'ops_%' or tablename like 'support_%') loop
  execute format('alter table private.%I enable row level security',t.tablename);
  execute format('revoke all on private.%I from public,anon,authenticated',t.tablename);
 end loop;
 for f in select p.oid::regprocedure name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('private','public') and p.proname like 'ops_%' loop
  execute 'revoke all on function '||f.name||' from public,anon,authenticated';
 end loop;
end; $$;
grant execute on function public.ops_create_ticket(text,text,text,uuid,uuid),public.ops_reply_ticket(uuid,text,uuid,integer,text),public.ops_mark_notification(uuid),public.ops_inbox(),public.ops_admin_workspace(),public.ops_admin_retry_event(uuid,text),public.ops_review_commission(uuid,text,text) to authenticated;
grant execute on function public.ops_worker_heartbeat(text,text,uuid,boolean),public.ops_health(text) to anon;
