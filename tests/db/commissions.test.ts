import{readFileSync}from'node:fs';import{randomUUID}from'node:crypto';import{beforeAll,afterAll,describe,it,expect}from'vitest';import{as,asUser,createAuthUser,createTestDb,type TestDb}from'./harness';
const backend='fixture-commission-worker-token-000000000000000000000';
describe('E7 immutable balanced commissions, history, corrections and month close',()=>{
 let db:TestDb,app:string,owner:string,creator:string,other:string,referral:string,integration:string,subscription:string,plan:string,usdPlan:string,annualPlan:string,annualRate:number,rate:number;
 const run=(sql:string,args:unknown[]=[])=>as(db,'anon',null,tx=>tx.query(sql,args),{commit:true});
 const service=(sql:string,args:unknown[]=[])=>as(db,'service_role',null,tx=>tx.query(sql,args),{commit:true});
 const process=()=>run(`select public.process_commission_jobs($1,100,$2) v`,[backend,app]);
 const workspace=(user=creator)=>asUser(db,user,tx=>tx.query<{v:{totals:Record<string,string>[];earnings:Record<string,string>[];statements:Record<string,string>[];cases:Record<string,string>[]}}>(`select public.commission_workspace($1,$2) v`,[app,user===creator?creator:null]));
 async function buy(amount='1499',time='2026-09-12T10:00:00Z',p=plan,trial=false,currency='EUR',env='sandbox',kind='purchase'){
  const t=(await db.query<{id:string}>(`insert into public.payment_transactions(app_id,environment,referral_id,subscription_id,plan_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end) values($1,$2,$3,$4,$5,'fixture',$6,$7,$8,$10,$9,$9::timestamptz+interval '1 year') returning id`,[app,env,referral,subscription,p,amount,currency,trial,time,kind])).rows[0]!.id;return t;
 }
 const basis=(tx:string,value='1499')=>run(`select public.declare_commission_basis($1,$2,$3)`,[backend,tx,value]);
 const close=()=>run(`select public.close_commission_month($1,$2,'2026-09-01') v`,[backend,app]);
 async function adjust(tx:string,amount:string,state='succeeded',kind='refund',time='2026-10-01T12:00:00Z'){
  return(await db.query<{id:string}>(`insert into public.payment_adjustments(app_id,environment,referral_id,transaction_id,kind,state,amount_minor,occurred_at,event_ref) values($1,'sandbox',$2,$3,$4,$5,$6,$7,$8) returning id`,[app,referral,tx,kind,state,amount,time,randomUUID()])).rows[0]!.id;
 }
 beforeAll(async()=>{
  db=await createTestDb();await db.exec(readFileSync(new URL('../../supabase/seed.sql',import.meta.url),'utf8'));app=(await db.query<{id:string}>(`select id from public.apps where slug='pulse-coach'`)).rows[0]!.id;
  owner=await createAuthUser(db,{email:'e7owner@example.test'});creator=await createAuthUser(db,{email:'e7creator@example.test'});other=await createAuthUser(db,{email:'e7other@example.test'});
  await db.query(`insert into public.organization_members(organization_id,user_id,role) select organization_id,$1,'owner' from public.apps where id=$2`,[owner,app]);
  await db.query(`insert into public.creator_profiles(user_id) values($1)`,[creator]);await db.query(`insert into public.creator_social_links(creator_id,platform,url) values($1,'instagram','https://instagram.com/e7fixture')`,[creator]);
  await asUser(db,creator,tx=>tx.query(`select public.join_program($1,(select terms_version_id from public.catalog_listings where app_id=$1),true)`,[app]),{commit:true});
  const terms=(await db.query<{terms_version_id:string}>(`select terms_version_id from public.catalog_listings where app_id=$1`,[app])).rows[0]!.terms_version_id;
  const p=(await db.query<{plan_id:string;commission_bps:number}>(`select plan_id,commission_bps from public.app_terms_plan_rates where terms_version_id=$1 order by sort_order limit 1`,[terms])).rows[0]!;plan=p.plan_id;rate=p.commission_bps;
  const annual=(await db.query<{plan_id:string;commission_bps:number}>(`select plan_id,commission_bps from public.app_terms_plan_rates where terms_version_id=$1 and billing_interval='year'`,[terms])).rows[0]!;annualPlan=annual.plan_id;annualRate=annual.commission_bps;
  usdPlan=(await db.query<{id:string}>(`insert into public.app_plans(app_id,name,external_plan_key,billing_interval,price_minor,currency,commission_bps,sort_order) values($1,'USD fixture','usd_fixture','month',1000,'USD',2000,8) returning id`,[app])).rows[0]!.id;
  await db.query(`insert into public.app_terms_plan_rates(terms_version_id,plan_id,plan_name,external_plan_key,billing_interval,price_minor,currency,commission_bps,sort_order) values($1,$2,'USD fixture','usd_fixture','month',1000,'USD',2000,8)`,[terms,usdPlan]);
  const membership=(await db.query<{id:string}>(`select id from public.creator_program_memberships where creator_id=$1`,[creator])).rows[0]!.id;
  referral=(await db.query<{id:string}>(`insert into public.customer_referrals(app_id,creator_id,membership_id,terms_version_id,source,policy_version) values($1,$2,$3,$4,'code','sandbox-v1') returning id`,[app,creator,membership,terms])).rows[0]!.id;
  await service(`select public.set_payment_backend_token($1)`,[backend]);
  integration=(await asUser(db,owner,tx=>tx.query<{id:string}>(`select public.configure_payment_integration($1,'generic','sandbox','fixture','E7_GENERIC') id`,[app]),{commit:true})).rows[0]!.id;
  subscription=(await db.query<{id:string}>(`insert into public.payment_subscriptions(app_id,environment,referral_id,integration_id) values($1,'sandbox',$2,$3) returning id`,[app,referral,integration])).rows[0]!.id;
 });
 afterAll(async()=>{await db?.close()});
 let first:string,refundTx:string,paidTx:string;
 it('waits for explicit policy and basis, then freezes historical plan rate and platform split',async()=>{
  first=await buy();expect(JSON.stringify((await process()).rows)).toContain('waiting_commission_basis');
  await expect(basis(first)).rejects.toThrow('sandbox_policy_missing');await service(`select public.configure_commission_sandbox(1000,'2020-01-01')`);await basis(first);await process();
  const e=(await workspace()).rows[0]!.v.earnings[0]!;expect(e.commission_bps).toBe(rate);expect(BigInt(e.net_gross!)).toBe((1499n*BigInt(rate)+5000n)/10000n);expect(BigInt(e.net_fee!)+BigInt(e.net_creator!)).toBe(BigInt(e.net_gross!));expect(e.bucket).toBe('accrued');
  await expect(basis(first,'1400')).rejects.toThrow('commission_basis_is_immutable');
 });
 it('deduplicates reconciliation and records one annual payment once',async()=>{
  await process();await db.query(`update private.commission_jobs set status='pending' where transaction_id=$1`,[first]);await process();expect((await db.query(`select id from public.commission_journals where transaction_id=$1 and kind='accrual'`,[first])).rows).toHaveLength(1);
  await db.query(`update public.app_plans set commission_bps=9000 where id=$1`,[plan]);const t=await buy('12000',undefined,annualPlan);await basis(t,'12000');await process();const e=(await db.query<{commission_bps:number}>(`select commission_bps from public.commission_earnings where transaction_id=$1`,[t])).rows[0]!;expect(e.commission_bps).toBe(annualRate);expect((await db.query<{billing_interval:string}>(`select billing_interval from public.commission_earnings where transaction_id=$1`,[t])).rows[0]!.billing_interval).toBe('year');
 });
 it('excludes zero, trial and live; unknown new plans require review',async()=>{
  await buy('0');await buy('1000',undefined,undefined,true);await buy('1000',undefined,undefined,false,'EUR','live');await process();expect((await db.query(`select id from public.commission_earnings`)).rows).toHaveLength(2);
  const newPlan=(await db.query<{id:string}>(`insert into public.app_plans(app_id,name,external_plan_key,billing_interval,price_minor,currency,commission_bps,sort_order) values($1,'New','new','month',1000,'EUR',8000,9) returning id`,[app])).rows[0]!.id;
  const t=await buy('1000',undefined,newPlan);await basis(t,'1000');expect(JSON.stringify((await process()).rows)).toContain('historical_plan_requires_review');
 });
 it('keeps statements immutable and releases only funded closed amounts',async()=>{
  refundTx=await buy('2000');await basis(refundTx,'2000');paidTx=await buy('3000');await basis(paidTx,'3000');const waiting=await buy('1000','2026-09-13T10:00:00Z');await basis(waiting,'1000');await process();await close();expect(((await close()).rows[0] as {v:string}).v).toBe('already_closed');
  let w=(await workspace()).rows[0]!.v;expect(w.statements).toHaveLength(1);expect(BigInt(w.totals[0]!.awaiting_funding!)).toBeGreaterThan(0n);expect(w.totals[0]!.available).toBe('0');
  const fund=(await db.query<{v:string}>(`select (sum(gross_minor)-private.commission_round(1000,$1))::text v from private.commission_positions`,[rate])).rows[0]!.v;
  await service(`select public.fund_commission_sandbox($1,'EUR',$2,'funding_fixture')`,[app,fund]);w=(await workspace()).rows[0]!.v;expect(BigInt(w.totals[0]!.awaiting_funding!)).toBeGreaterThan(0n);expect(BigInt(w.totals[0]!.available!)).toBeGreaterThan(0n);
  await service(`select public.fund_commission_sandbox($1,'EUR',$2,'funding_fixture')`,[app,fund]);expect((await db.query(`select id from public.commission_journals where kind='sandbox_fixture_funding'`)).rows).toHaveLength(1);
  await expect(db.query(`update public.commission_statements set gross_minor=0`)).rejects.toThrow('immutable');
 });
 it('appends partial/full refund corrections after closure without rewriting its statement',async()=>{
  const original=JSON.stringify((await workspace()).rows[0]!.v.statements);const a=await adjust(refundTx,'1000');await process();let e=(await db.query<{gross_minor:string}>(`select gross_minor from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[refundTx])).rows[0]!;expect(BigInt(e.gross_minor)).toBe((1000n*BigInt(rate)+5000n)/10000n);
  await adjust(refundTx,'1000');await process();e=(await db.query<{gross_minor:string}>(`select gross_minor from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[refundTx])).rows[0]!;expect(e.gross_minor).toBe(0);expect(JSON.stringify((await workspace()).rows[0]!.v.statements)).toBe(original);
  expect((await db.query<{effective_month:string}>(`select effective_month::text from public.commission_journals where transaction_id=$1 and kind='adjustment'`,[refundTx])).rows.every(x=>x.effective_month==='2026-10-01')).toBe(true);
  await db.query(`update public.payment_adjustments set state='reversed',occurred_at='2026-10-02',event_ref='reversed' where id=$1`,[a]);await process();expect((await db.query<{gross_minor:number}>(`select gross_minor from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[refundTx])).rows[0]!.gross_minor).toBeGreaterThan(0);
 });
 it('freezes disputed funds and restores them on win; payout refunds require a case',async()=>{
  const a=await adjust(first,'1499','open','dispute');await process();expect((await workspace()).rows[0]!.v.earnings.find(e=>e.sale_minor==='1499')!.bucket).toBe('held');
  await db.query(`update public.payment_adjustments set state='won',occurred_at='2026-10-03',event_ref='won' where id=$1`,[a]);await process();expect((await workspace()).rows[0]!.v.earnings.find(e=>e.sale_minor==='1499')!.bucket).toBe('available');
  const id=(await db.query<{id:string}>(`select id from public.commission_earnings where transaction_id=$1`,[paidTx])).rows[0]!.id;await service(`select public.simulate_commission_payout($1,false)`,[id]);await service(`select public.simulate_commission_payout($1,true)`,[id]);await adjust(paidTx,'3000');await process();await process();expect((await workspace()).rows[0]!.v.cases.filter(c=>c.code==='adjustment_after_payout_requires_policy')).toHaveLength(1);expect((await workspace()).rows[0]!.v.earnings.find(e=>e.id===id)!.bucket).toBe('paid');
 });
 it('records late payments in the next open month, preserves separate currencies and balanced entries',async()=>{
  const t=await buy('999');await basis(t,'999');await process();expect((await db.query<{effective_month:string}>(`select effective_month::text from public.commission_journals where transaction_id=$1`,[t])).rows[0]!.effective_month).toBe(new Date().toISOString().slice(0,7)+'-01');
  const usd=await buy('1000',undefined,usdPlan,false,'USD');await basis(usd,'1000');await process();expect((await workspace()).rows[0]!.v.totals.map(t=>t.currency).sort()).toEqual(['EUR','USD']);
  expect((await db.query(`select id from public.commission_journals where not private.commission_entries_balanced(entries)`)).rows).toHaveLength(0);
  await expect(db.query(`update public.commission_journals set kind='tampered'`)).rejects.toThrow('immutable');
  await expect(db.query(`insert into public.commission_journals(app_id,currency,idempotency_key,kind,source_at,source_month,effective_month,entries) values($1,'EUR','bad','bad',now(),'2026-10-01','2026-10-01','[{"account":"company_due","amount_minor":"1"},{"account":"creator_accrued","amount_minor":"2"}]')`,[app])).rejects.toThrow();
 });
 it('does not overspend funding when a refunded amount is restored after its funds were reused',async()=>{
  await db.query(`update public.payment_adjustments set state='reversed',occurred_at='2026-10-04',event_ref='second_reversal' where transaction_id=$1 and state='succeeded'`,[refundTx]);await process();
  expect((await db.query<{bucket:string}>(`select bucket from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[refundTx])).rows[0]!.bucket).toBe('unfunded');
  expect((await db.query<{v:boolean}>(`select sum(funding_credit::numeric)>=sum(funding_used) v from public.commission_journals where currency='EUR'`)).rows[0]!.v).toBe(true);
  await service(`select public.fund_commission_sandbox($1,'EUR','99999','later_funding')`,[app]);
  expect((await db.query<{bucket:string}>(`select bucket from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[refundTx])).rows[0]!.bucket).toBe('available');
 });
 it('uses the original rate on renewals and does not release an older unclosed month',async()=>{
  const renewal=await buy('1499','2025-08-12T10:00:00Z',plan,false,'EUR','sandbox','renewal');await basis(renewal);await process();
  expect((await db.query<{commission_bps:number}>(`select commission_bps from public.commission_earnings where transaction_id=$1`,[renewal])).rows[0]!.commission_bps).toBe(rate);
  await run(`select public.close_commission_month($1,$2,'2025-09-01')`,[backend,app]);
  expect((await db.query<{bucket:string}>(`select bucket from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[renewal])).rows[0]!.bucket).toBe('accrued');
  await run(`select public.close_commission_month($1,$2,'2025-08-01')`,[backend,app]);
  expect((await db.query<{bucket:string}>(`select bucket from private.commission_positions where earning_id=(select id from public.commission_earnings where transaction_id=$1)`,[renewal])).rows[0]!.bucket).toBe('available');
 });
 it('isolates creators/companies and rejects browser financial writes and forged worker access',async()=>{
  expect((await workspace(other)).rows[0]!.v.earnings).toHaveLength(0);expect((await asUser(db,other,tx=>tx.query(`select id from public.commission_earnings`))).rows).toHaveLength(0);
  await expect(asUser(db,owner,tx=>tx.query(`update public.commission_earnings set creator_minor=999`))).rejects.toThrow('permission denied');await expect(asUser(db,owner,tx=>tx.query(`select public.fund_commission_sandbox($1,'EUR','1','fake')`,[app]))).rejects.toThrow('permission denied');
  await expect(run(`select public.process_commission_jobs('wrong',20,$1)`,[app])).rejects.toThrow();
 });
});
