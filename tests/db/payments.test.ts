import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,expect,it} from 'vitest';
import {as,asUser,createAuthUser,createTestDb,type TestDb} from './harness';
import type {PaymentEvent} from '@/modules/payments/adapters';
const token='fixture-payment-worker-token-00000000000000000000';
describe('E6 durable payments, RLS, ordering and economic deduplication',()=>{
 let db:TestDb,app:string,otherApp:string,owner:string,otherOwner:string,creator:string,integration:string,rc:string,live:string,plan:string,referral:string,apiKey:string;
 let seq=0;
 const now=()=>new Date(Date.now()-1000).toISOString();
 const future=()=>new Date(Date.now()+30*86400000).toISOString();
 async function event(changes:Partial<PaymentEvent>={}) {return {event_id:'event_'+(++seq),environment:'sandbox',kind:'purchase',occurred_at:now(),store:'stripe',customer_id:'cus_1',subscription_id:'sub_1',product_id:'price_1',transaction_id:'invoice_1',aliases:[],amount_minor:'1000',currency:'EUR',period_end:future(),is_trial:false,state:'active',...changes} as PaymentEvent;}
 async function ingest(n:PaymentEvent,i=integration,raw=JSON.stringify(n)) {return as(db,'anon',null,async tx=>(await tx.query<{v:{id:string;duplicate:boolean;conflict:boolean}}>(`select public.ingest_payment_event($1,$2,$3,$4,$5) v`,[token,i,n.event_id,n.environment,raw])).rows[0]!.v,{commit:true});}
 async function claim(){return as(db,'anon',null,async tx=>(await tx.query<{v:{id:string;lease:string;raw:string}[]}>(`select public.claim_payment_events($1,50) v`,[token])).rows[0]!.v,{commit:true});}
 async function apply(n:PaymentEvent,i=integration){const receipt=await ingest(n,i);const jobs=await claim();const job=jobs.find(j=>j.id===receipt.id)!;expect(job).toBeDefined();return as(db,'anon',null,async tx=>(await tx.query<{v:string}>(`select public.apply_payment_event($1,$2,$3,$4::jsonb) v`,[token,job.id,job.lease,JSON.stringify(n)])).rows[0]!.v,{commit:true});}
 async function mapping(){await asUser(db,owner,tx=>tx.query(`select public.map_payment_customer($1,'cus_1','customer_1')`,[integration]),{commit:true});await asUser(db,owner,tx=>tx.query(`select public.map_payment_plan($1,'price_1',$2)`,[integration,plan]),{commit:true});}
 beforeAll(async()=>{
  db=await createTestDb();await db.exec(readFileSync(new URL('../../supabase/seed.sql',import.meta.url),'utf8'));
  const apps=(await db.query<{id:string;organization_id:string;slug:string}>(`select id,organization_id,slug from public.apps where slug in('pulse-coach','lexi-notes')`)).rows;
  app=apps.find(a=>a.slug==='pulse-coach')!.id;otherApp=apps.find(a=>a.slug==='lexi-notes')!.id;
  owner=await createAuthUser(db,{email:'e6owner@example.test'});otherOwner=await createAuthUser(db,{email:'e6other@example.test'});creator=await createAuthUser(db,{email:'e6creator@example.test'});
  for(const [who,id] of [[owner,app],[otherOwner,otherApp]])await db.query(`insert into public.organization_members(organization_id,user_id,role) select organization_id,$1,'owner' from public.apps where id=$2`,[who,id]);
  await db.query(`insert into public.creator_profiles(user_id) values($1)`,[creator]);await db.query(`insert into public.creator_social_links(creator_id,platform,url) values($1,'instagram','https://instagram.com/fixturecreator')`,[creator]);
  await asUser(db,creator,tx=>tx.query(`select public.join_program($1,(select terms_version_id from public.catalog_listings where app_id=$1),true)`,[app]),{commit:true});
  const code=(await db.query<{c:string}>(`select referral_code c from public.creator_program_memberships where creator_id=$1`,[creator])).rows[0]!.c;
  apiKey=await as(db,'service_role',null,async tx=>(await tx.query<{k:string}>(`select public.rotate_attribution_api_key($1) k`,[app])).rows[0]!.k,{commit:true});
  referral=await as(db,'anon',null,async tx=>(await tx.query<{v:{id:string}}>(`select public.register_referred_customer($1,'customer_1','{}',$2) v`,[apiKey,code])).rows[0]!.v.id,{commit:true});
  await as(db,'service_role',null,tx=>tx.query(`select public.set_payment_backend_token($1)`,[token]),{commit:true});
  integration=await asUser(db,owner,async tx=>(await tx.query<{id:string}>(`select public.configure_payment_integration($1,'stripe','sandbox','acct_fixture','STRIPE_FIXTURE') id`,[app])).rows[0]!.id,{commit:true});
  rc=await asUser(db,owner,async tx=>(await tx.query<{id:string}>(`select public.configure_payment_integration($1,'revenuecat','sandbox','app_fixture','RC_FIXTURE') id`,[app])).rows[0]!.id,{commit:true});
  live=await asUser(db,owner,async tx=>(await tx.query<{id:string}>(`select public.configure_payment_integration($1,'stripe','live','acct_live','STRIPE_LIVE') id`,[app])).rows[0]!.id,{commit:true});
  plan=(await db.query<{id:string}>(`select id from public.app_plans where app_id=$1 limit 1`,[app])).rows[0]!.id;
  await asUser(db,owner,tx=>tx.query(`select public.set_payment_source($1,'stripe')`,[integration]),{commit:true});
 });
 afterAll(async()=>{await db?.close();});
 it('persists first, deduplicates delivery IDs and detects conflicting event payloads without overwriting',async()=>{
  const n=await event({transaction_id:'durable_tx'}),receipt=await ingest(n);expect(receipt.duplicate).toBe(false);
  expect((await db.query(`select 1 from public.payment_transactions`)).rows).toHaveLength(0);
  expect(await ingest(n)).toMatchObject({id:receipt.id,duplicate:true,conflict:false});
  expect(await ingest(n,integration,JSON.stringify({...n,amount_minor:'9999'}))).toMatchObject({id:receipt.id,conflict:true});
  const job=(await claim())[0]!;
  const result=await as(db,'anon',null,tx=>tx.query<{v:string}>(`select public.apply_payment_event($1,$2,$3,$4) v`,[token,job.id,job.lease,JSON.stringify(n)]),{commit:true});
  expect(result.rows[0]!.v).toBe('waiting_customer_mapping');
 });
 it('waits for mappings; configuring alone is never Verified; a retry can process after repair',async()=>{
  expect((await db.query<{verified_at:null}>(`select verified_at from public.payment_integrations where id=$1`,[integration])).rows[0]!.verified_at).toBeNull();
  await mapping();const e=(await db.query<{id:string}>(`select id from public.payment_events where status='waiting'`)).rows[0]!;
  await asUser(db,owner,tx=>tx.query(`select public.retry_payment_event($1)`,[e.id]),{commit:true});
  const job=(await claim())[0]!,n=JSON.parse(job.raw);
  expect((await as(db,'anon',null,tx=>tx.query<{v:string}>(`select public.apply_payment_event($1,$2,$3,$4) v`,[token,job.id,job.lease,JSON.stringify(n)]),{commit:true})).rows[0]!.v).toBe('processed');
  expect((await db.query(`select verified_at from public.payment_integrations where id=$1 and verified_at is not null`,[integration])).rows).toHaveLength(1);
 });
 it('deduplicates transactions across different event IDs and rejects amount conflicts',async()=>{
  const n=await event({transaction_id:'dedup_tx'});expect(await apply(n)).toBe('processed');
  expect(await apply({...n,event_id:'same_economic_transaction'})).toBe('processed');
  expect((await db.query(`select 1 from private.payment_transaction_keys where provider_transaction_id='dedup_tx'`)).rows).toHaveLength(1);
  expect((await db.query(`select 1 from public.customer_payment_timeline t join public.payment_events e on e.id=t.event_id where e.event_ref in($1,'same_economic_transaction')`,[n.event_id])).rows).toHaveLength(1);
  expect(await apply({...n,event_id:'conflicting_transaction',amount_minor:'1001'})).toBe('transaction_conflict');
 });
 it('has one store authority so Stripe and RevenueCat never double-count even unlike provider IDs',async()=>{
  expect(await apply(await event({transaction_id:'rc_different_id'}),rc)).toBe('ignored');
  expect((await db.query(`select 1 from private.payment_transaction_keys where provider_transaction_id='rc_different_id'`)).rows).toHaveLength(0);
  await expect(asUser(db,owner,tx=>tx.query(`select public.set_payment_source($1,'stripe')`,[rc]))).rejects.toThrow('source_locked_after_purchase');
 });
 it('records renewal, ignores zero/trial for paying acquisition, and scheduled cancellation does not refund',async()=>{
  expect(await apply(await event({transaction_id:'renewal_tx',kind:'renewal',aliases:[]}))).toBe('processed');
  const code=(await db.query<{c:string}>(`select referral_code c from public.creator_program_memberships where creator_id=$1`,[creator])).rows[0]!.c;
  await as(db,'anon',null,tx=>tx.query(`select public.register_referred_customer($1,'zero_customer','{}',$2)`,[apiKey,code]),{commit:true});
  await asUser(db,owner,tx=>tx.query(`select public.map_payment_customer($1,'cus_zero','zero_customer')`,[integration]),{commit:true});
  expect(await apply(await event({transaction_id:'zero_tx',customer_id:'cus_zero',subscription_id:'sub_zero',amount_minor:'0',is_trial:true,state:'trialing',aliases:[]}))).toBe('processed');
  const metrics=await asUser(db,creator,tx=>tx.query<{v:{paying_customers:number;active_paying_subscribers:number}}>(`select public.payment_metrics() v`));
  expect(metrics.rows[0]!.v).toEqual({paying_customers:1,active_paying_subscribers:1});
  expect(await apply(await event({kind:'subscription',auto_renew:false,state:'active',occurred_at:new Date().toISOString()}))).toBe('processed');
  expect((await db.query(`select 1 from public.payment_adjustments`)).rows).toHaveLength(0);
 });
 it('processes refunds before purchase via waiting/retry, supports partial refund and dispute lifecycle',async()=>{
  const end=future(),time=now();const refund=await event({kind:'refund',transaction_id:'later_tx',adjustment_id:'refund_later',adjustment_state:'succeeded',amount_minor:'400',occurred_at:time,period_end:end});
  expect(await apply(refund)).toBe('waiting_transaction');
  expect(await apply(await event({transaction_id:'later_tx',aliases:[],period_end:end,occurred_at:time}))).toBe('processed');
  const id=(await db.query<{id:string}>(`select id from public.payment_events where event_ref=$1`,[refund.event_id])).rows[0]!.id;
  await asUser(db,owner,tx=>tx.query(`select public.retry_payment_event($1)`,[id]),{commit:true});
  const job=(await claim())[0]!;expect((await as(db,'anon',null,tx=>tx.query<{v:string}>(`select public.apply_payment_event($1,$2,$3,$4) v`,[token,job.id,job.lease,JSON.stringify(refund)]),{commit:true})).rows[0]!.v).toBe('processed');
  expect(await apply(await event({kind:'dispute',transaction_id:'later_tx',adjustment_id:'dispute_1',adjustment_state:'open'}))).toBe('processed');
  expect(await apply(await event({kind:'dispute',transaction_id:'later_tx',adjustment_id:'dispute_1',adjustment_state:'won',occurred_at:new Date().toISOString()}))).toBe('processed');
  expect((await db.query(`select state from public.payment_adjustments where kind='dispute'`)).rows[0]).toEqual({state:'won'});
 });
 it('does not resurrect subscription state when old events arrive and preserves permanent E5 attribution',async()=>{
  const end=new Date().toISOString();expect(await apply(await event({kind:'subscription',state:'expired',occurred_at:end}))).toBe('processed');
  expect(await apply(await event({kind:'subscription',state:'active',occurred_at:new Date(Date.now()-86400000).toISOString()}))).toBe('processed');
  expect((await db.query<{state:string}>(`select state from public.payment_subscriptions s join private.payment_subscription_keys k on k.subscription_id=s.id where k.provider_subscription_id='sub_1'`)).rows[0]!.state).toBe('expired');
  expect((await db.query<{creator_id:string}>(`select creator_id from public.customer_referrals where id=$1`,[referral])).rows[0]!.creator_id).toBe(creator);
 });
 it('does not pick an arbitrary ID order when subscription states conflict at the same timestamp',async()=>{
  const same=new Date().toISOString();
  expect(await apply(await event({kind:'subscription',subscription_id:'sub_tie',state:'active',occurred_at:same}))).toBe('processed');
  expect(await apply(await event({kind:'subscription',subscription_id:'sub_tie',state:'expired',occurred_at:same}))).toBe('processed');
  expect((await db.query<{state:string}>(`select state from public.payment_subscriptions s join private.payment_subscription_keys k on k.subscription_id=s.id where k.provider_subscription_id='sub_tie'`)).rows[0]!.state).toBe('unknown');
  expect((await db.query(`select 1 from public.payment_events where error_code='subscription_order_ambiguous'`)).rows).toHaveLength(1);
 });
 it('repairs a missing plan without partially creating a subscription or purchase',async()=>{
  const n=await event({transaction_id:'new_plan_tx',subscription_id:'sub_new_plan',product_id:'unmapped_price'});
  expect(await apply(n)).toBe('waiting_plan_mapping');
  expect((await db.query(`select 1 from private.payment_subscription_keys where provider_subscription_id='sub_new_plan'`)).rows).toHaveLength(0);
  await asUser(db,owner,tx=>tx.query(`select public.map_payment_plan($1,'unmapped_price',$2)`,[integration,plan]),{commit:true});
  const e=(await db.query<{id:string}>(`select id from public.payment_events where event_ref=$1`,[n.event_id])).rows[0]!;
  await asUser(db,owner,tx=>tx.query(`select public.retry_payment_event($1)`,[e.id]),{commit:true});
  const job=(await claim())[0]!;
  expect((await as(db,'anon',null,tx=>tx.query<{v:string}>(`select public.apply_payment_event($1,$2,$3,$4) v`,[token,job.id,job.lease,JSON.stringify(n)]),{commit:true})).rows[0]!.v).toBe('processed');
 });
 it('removes fully refunded/lost-dispute customers from paid metrics while preserving event history',async()=>{
  const code=(await db.query<{c:string}>(`select referral_code c from public.creator_program_memberships where creator_id=$1`,[creator])).rows[0]!.c;
  await as(db,'anon',null,tx=>tx.query(`select public.register_referred_customer($1,'refund_customer','{}',$2)`,[apiKey,code]),{commit:true});
  await asUser(db,owner,tx=>tx.query(`select public.map_payment_customer($1,'cus_refund','refund_customer')`,[integration]),{commit:true});
  const base=await event({transaction_id:'refund_full_tx',subscription_id:'sub_refund',customer_id:'cus_refund'});
  expect(await apply(base)).toBe('processed');
  const count=async()=>(await asUser(db,creator,tx=>tx.query<{v:{paying_customers:number}}>(`select public.payment_metrics() v`))).rows[0]!.v.paying_customers;
  expect(await count()).toBe(2);
  expect(await apply(await event({kind:'dispute',transaction_id:'refund_full_tx',adjustment_id:'full_dispute',adjustment_state:'lost',occurred_at:new Date().toISOString()}))).toBe('processed');
  expect(await count()).toBe(1);
  expect(await apply(await event({kind:'dispute',transaction_id:'refund_full_tx',adjustment_id:'full_dispute',adjustment_state:'won',occurred_at:new Date(Date.now()+1).toISOString()}))).toBe('processed');
  expect(await count()).toBe(2);
  expect(await apply(await event({kind:'refund',transaction_id:'refund_full_tx',adjustment_id:'full_refund',adjustment_state:'succeeded'}))).toBe('processed');
  expect(await count()).toBe(1);
 });
 it('does not regress terminal adjustments to pending or guess between conflicting same-time outcomes',async()=>{
  const same=new Date().toISOString();
  expect(await apply(await event({kind:'dispute',transaction_id:'refund_full_tx',adjustment_id:'tie_dispute',adjustment_state:'lost',occurred_at:same,event_id:'a_terminal'}))).toBe('processed');
  expect(await apply(await event({kind:'dispute',transaction_id:'refund_full_tx',adjustment_id:'tie_dispute',adjustment_state:'open',occurred_at:same,event_id:'z_pending'}))).toBe('processed');
  expect((await db.query<{state:string}>(`select state from public.payment_adjustments where event_ref='a_terminal'`)).rows[0]!.state).toBe('lost');
  expect(await apply(await event({kind:'dispute',transaction_id:'refund_full_tx',adjustment_id:'tie_dispute',adjustment_state:'won',occurred_at:same,event_id:'m_conflicting_terminal'}))).toBe('processed');
  expect((await db.query<{state:string}>(`select state from public.payment_adjustments where event_ref='a_terminal'`)).rows[0]!.state).toBe('needs_review');
 });
 it('recovers abandoned leases and revokes one worker token without affecting another',async()=>{
  const n=await event({transaction_id:'lease_tx'}),r=await ingest(n);await claim();
  await db.query(`update public.payment_events set lease_until=now()-interval '1 second' where id=$1`,[r.id]);
  const recovered=(await claim()).find(j=>j.id===r.id)!;expect(recovered).toBeDefined();
  await db.query(`update public.payment_events set lease_until=now()-interval '1 second',attempts=10 where id=$1`,[r.id]);
  await claim();expect((await db.query<{status:string}>(`select status from public.payment_events where id=$1`,[r.id])).rows[0]!.status).toBe('failed');
  const temporary=token+'temporary';
  await as(db,'service_role',null,tx=>tx.query(`select public.set_payment_backend_token($1)`,[temporary]),{commit:true});
  await as(db,'service_role',null,tx=>tx.query(`select public.revoke_payment_backend_token($1)`,[temporary]),{commit:true});
  await expect(as(db,'anon',null,tx=>tx.query(`select public.claim_payment_events($1,1)`,[temporary]))).rejects.toThrow('invalid_backend_token');
  expect(await claim()).toEqual([]);
 });
 it('keeps creator metrics scoped even when the same account has organization read rights',async()=>{
  const company=(await asUser(db,owner,tx=>tx.query<{v:{paying_customers:number}}>(`select public.payment_metrics($1) v`,[app]))).rows[0]!.v;
  expect(company.paying_customers).toBeGreaterThan(0);
  const creatorView=(await asUser(db,owner,tx=>tx.query<{v:{paying_customers:number}}>(`select public.payment_metrics($1,$2) v`,[app,owner]))).rows[0]!.v;
  expect(creatorView.paying_customers).toBe(0);
  expect((await asUser(db,owner,tx=>tx.query<{v:unknown[]}>(`select public.payment_customer_timeline(null,$1,$2) v`,[app,owner]))).rows[0]!.v).toEqual([]);
  expect((await asUser(db,owner,tx=>tx.query<{v:{registrations:number}}>(`select public.attribution_summary($1,$2) v`,[app,owner]))).rows[0]!.v.registrations).toBe(0);
 });
 it('keeps live isolated, fails closed, checks leases and forbids unauthorized reads/writes/mapping changes',async()=>{
  const n=await event({environment:'live'});await ingest(n,live);
  expect((await db.query(`select 1 from public.payment_events where integration_id=$1 and status='blocked'`,[live])).rows).toHaveLength(1);
  expect((await claim()).length).toBe(0);
  await expect(as(db,'anon',null,tx=>tx.query(`select public.claim_payment_events('wrong',20)`))).rejects.toThrow('invalid_backend_token');
  await expect(asUser(db,otherOwner,tx=>tx.query(`select public.map_payment_plan($1,'foreign',$2)`,[integration,plan]))).rejects.toThrow();
  expect((await asUser(db,otherOwner,tx=>tx.query(`select id from public.payment_transactions where app_id=$1`,[app]))).rows).toHaveLength(0);
  expect((await asUser(db,creator,tx=>tx.query(`select id from public.payment_transactions`))).rows.length).toBeGreaterThan(0);
  await expect(asUser(db,creator,tx=>tx.query(`select * from private.payment_event_payloads`))).rejects.toThrow();
  await expect(asUser(db,creator,tx=>tx.query(`update public.payment_transactions set amount_minor=1`))).rejects.toThrow();
  await expect(as(db,'anon',null,tx=>tx.query(`select * from public.payment_events`))).rejects.toThrow();
  await expect(as(db,'anon',null,tx=>tx.query(`select public.apply_payment_event($1,gen_random_uuid(),gen_random_uuid(),null,null)`,[token]))).rejects.toThrow('stale_event_lease');
 });
});
