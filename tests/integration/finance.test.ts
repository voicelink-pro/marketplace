import{randomUUID}from'node:crypto';import{execFileSync}from'node:child_process';import{createClient,type SupabaseClient}from'@supabase/supabase-js';import{createServerClient}from'@supabase/ssr';import{beforeAll,afterAll,describe,it,expect}from'vitest';import { sandboxProvider } from '../../src/modules/finance/provider.mjs';import type{Database}from'@/lib/supabase/database.types';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient<Database>(url,process.env.SUPABASE_SECRET_KEY!,options),anon=createClient<Database>(url,key,options);
function value<T>(r:{data:T;error:unknown}):NonNullable<T>{if(r.error)throw r.error;if(r.data===null)throw Error('Expected result');return r.data!}
// Local database fixtures only; business effects below go through authenticated Data API RPCs.
function sql(statement:string){if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('E8 concurrency fixtures require local Supabase');return execFileSync('docker',['exec','-i','supabase_db_marketplace-roch','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:statement,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim()}
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
describe('E8 real Postgres finance concurrency, durable provider and HTTP panels',()=>{
 const users:string[]=[],backend='pmw_fixture_e8_'+randomUUID()+randomUUID();let owner:SupabaseClient<Database>,creator:SupabaseClient<Database>,other:SupabaseClient<Database>,admin:SupabaseClient<Database>,creatorId:string,app:string,org:string,plan:string,referral:string,policy:string,tx1:string,tx2:string,ownerCookie='',creatorCookie='',adminCookie='';
 async function user(){const email='e8-concurrency-'+randomUUID()+'@example.test',password='Pass-'+randomUUID()+'!1';const created=await service.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;const u=created.data;users.push(u.user.id);let cookies:{name:string;value:string}[]=[];const c=createServerClient<Database>(url,key,{cookies:{getAll:()=>cookies,setAll:list=>{for(const cookie of list){cookies=cookies.filter(x=>x.name!==cookie.name);cookies.push(cookie)}}}});const signed=await c.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;return{id:u.user.id,client:c,cookie:()=>cookies.map(x=>x.name+'='+x.value).join('; ')}}
 const work=()=>anon.rpc('process_commission_jobs',{p_backend:backend,p_app_id:app,p_limit:20});
 beforeAll(async()=>{
  const accounts=await Promise.all([user(),user(),user(),user()]);[owner,creator,other,admin]=accounts.map(x=>x.client);creatorId=accounts[1]!.id;ownerCookie=accounts[0]!.cookie();creatorCookie=accounts[1]!.cookie();adminCookie=accounts[3]!.cookie();
  const a=await service.from('platform_admins').insert({user_id:accounts[3]!.id,granted_by:'E8 disposable concurrency fixtures'});if(a.error)throw a.error;
  org=value(await owner.rpc('create_organization',{p_name:'E8 disposable commission QA'}));app=value(await owner.rpc('create_app',{p_organization_id:org,p_name:'E8 Commission QA'}));
  value(await owner.rpc('save_app_draft',{p_app_id:app,p_name:'E8 Commission QA',p_slug:'e8-'+randomUUID(),p_tagline:'Disposable commission concurrency fixture.',p_description:'A disposable sandbox app to verify balanced journal processing and idempotent monthly closing.',p_categories:['productivity'],p_platforms:['web'],p_languages:['en'],p_website_url:'https://fixture.example.test',p_logo_url:'/demo/presets/logo-orbitly.png',p_cover_image_url:'/demo/presets/orbitly.png',p_terms_text:'Sandbox recurring commission with historical plan rates.'}));
  plan=value(await owner.rpc('upsert_app_plan',{p_app_id:app,p_name:'Monthly',p_external_plan_key:'monthly',p_billing_interval:'month',p_price_minor:1499,p_currency:'EUR',p_commission_bps:1500}));value(await owner.rpc('submit_app_for_review',{p_app_id:app}));const rev=value(await owner.from('apps').select('review_revision').eq('id',app).single()).review_revision;value(await admin.rpc('admin_review_app',{p_app_id:app,p_decision:'approve',p_expected_revision:rev}));
  const p=await creator.from('creator_profiles').insert({user_id:creatorId});if(p.error)throw p.error;const l=await creator.from('creator_social_links').insert({creator_id:creatorId,platform:'instagram',url:'https://instagram.com/e7fixture'});if(l.error)throw l.error;
  const terms=value(await anon.from('catalog_listings').select('terms_version_id').eq('app_id',app).single()).terms_version_id;value(await creator.rpc('join_program',{p_app_id:app,p_accepted_terms_version_id:terms,p_accepted_terms:true}));const code=value(await creator.from('creator_program_memberships').select('referral_code').eq('app_id',app).single()).referral_code;const appKey=value(await owner.rpc('rotate_attribution_api_key',{p_app_id:app}));referral=(value(await anon.rpc('register_referred_customer',{p_api_key:appKey,p_customer_id:'e8_fixture_customer',p_code:code})) as{id:string}).id;
  const integration=value(await owner.rpc('configure_payment_integration',{p_app_id:app,p_provider:'generic',p_environment:'sandbox',p_account:'e8_fixture',p_credential_ref:'E7_'+randomUUID().replaceAll('-','').toUpperCase()}));
  const subscription=sql(`insert into public.payment_subscriptions(app_id,environment,referral_id,integration_id) values(${quote(app)},'sandbox',${quote(referral)},${quote(integration)}) returning id;`).split('\n')[0]!;
  const effective=new Date(Date.UTC(1973,0,1)+Math.floor(Math.random()*86400000*100)).toISOString();policy=value(await service.rpc('configure_commission_sandbox',{p_fee_bps:1000,p_effective_at:effective}));const b=await service.rpc('set_payment_backend_token',{p_token:backend});if(b.error)throw b.error;
  const insert=()=>sql(`insert into public.payment_transactions(app_id,environment,referral_id,subscription_id,plan_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end) values(${quote(app)},'sandbox',${quote(referral)},${quote(subscription)},${quote(plan)},'Monthly',1499,'EUR',false,'purchase','1974-01-12','1974-02-12') returning id;`).split('\n')[0]!;tx1=insert();tx2=insert();
  for(const t of[tx1,tx2]){const r=await anon.rpc('declare_commission_basis',{p_backend:backend,p_transaction:t,p_basis_minor:'1499'});if(r.error)throw r.error}
  for (const [client,kind] of [[owner,'funding'],[creator,'payout']] as const) {
   const session=value(await client.rpc('finance_start_onboarding',{p_kind:kind,p_app_id:kind==='funding'?app:undefined}));
   const r=await client.rpc('finance_complete_onboarding',{p_session:session,p_consent:true});if(r.error)throw r.error;
  }

 });
 afterAll(async()=>{
  const r=await service.rpc('revoke_payment_backend_token',{p_token:backend});if(r.error)throw r.error;
  if(org){const d=await service.from('organizations').delete().eq('id',org);if(d.error)throw d.error}
  if(policy)sql(`delete from private.commission_policies where id=${quote(policy)} and not exists(select 1 from private.commission_bases where policy_id=${quote(policy)});`);
  for(const id of users){const a=await service.from('platform_admins').delete().eq('user_id',id);if(a.error)throw a.error;const d=await service.auth.admin.deleteUser(id);if(d.error)throw d.error}
 });
 const workerProvider = sandboxProvider(anon, backend);
 type Job = { id: string; lease: string; kind: string };
 async function step() {
  const job=valueOrNull(await anon.rpc('finance_claim',{p_backend:backend,p_app_id:app})) as Job|null;
  return job ? workerProvider.execute(job) : null;
 }
 function valueOrNull<T>(r:{data:T;error:unknown}):T {if(r.error)throw r.error;return r.data}
 type W = {accounts:{available_minor:string;reserved_minor:string;arrears_minor:string;paused:boolean}[];funding:{id:string;status:string}[];payouts:{id:string;status:string;bank_attempt:number}[];available:{available_minor:string}[];cases:{job_id:string;code:string;resolved_at:string|null}[]};
 async function workspace(client=owner,company=true){return value(await client.rpc('finance_workspace',{p_app_id:company?app:undefined})) as unknown as W}
 function due(){sql(`update private.finance_jobs set next_at=now()-interval '1 second' where (funding_id in(select id from private.finance_funding where app_id=${quote(app)}) or payout_id in(select payout_id from private.finance_payout_items i join public.commission_earnings e on e.id=i.earning_id where e.app_id=${quote(app)})) and status='pending';`)}
 function jobFor(id:string){return sql(`select id from private.finance_jobs where funding_id=${quote(id)} or payout_id=${quote(id)} order by (status='pending') desc,created_at desc,id desc limit 1;`)}
 async function scenario(id:string,scenario:string){const r=await service.rpc('finance_test_scenario',{p_job:jobFor(id),p_scenario:scenario});if(r.error)throw r.error}
 async function fund(amount='10000'){return value(await owner.rpc('finance_request_funding',{p_app_id:app,p_amount:amount,p_request_key:randomUUID()}))}
 let payoutId:string;
 it('serializes simultaneous deposits and workers; sales alone never create funding',async()=>{
  for(const r of await Promise.all([work(),work()]))if(r.error)throw r.error;
  expect(sql(`select coalesce(sum(funding_credit),0) from public.commission_journals where app_id=${quote(app)};`)).toBe('0');
  const key=randomUUID();const funding=await Promise.all(Array.from({length:8},()=>owner.rpc('finance_request_funding',{p_app_id:app,p_amount:'10000',p_request_key:key})));
  expect(new Set(funding.map(r=>value(r))).size).toBe(1);
  const claims=await Promise.all(Array.from({length:8},()=>anon.rpc('finance_claim',{p_backend:backend,p_app_id:app})));
  const jobs=claims.map(r=>valueOrNull(r)).filter(Boolean) as unknown as Job[];expect(jobs).toHaveLength(1);
  expect(await workerProvider.execute(jobs[0]!)).toBe('available');
  expect((await workspace()).accounts[0]).toMatchObject({available_minor:'9550',reserved_minor:'450'});
  expect(sql(`select count(*) from public.commission_journals where app_id=${quote(app)} and funding_credit>0;`)).toBe('1');
 });
 it('reserves earnings once under concurrent Withdraw and rejects another key',async()=>{
  for(const r of await Promise.all([1,2].map(()=>anon.rpc('close_commission_month',{p_backend:backend,p_app_id:app,p_month:'1974-01-01'}))))value(r);
  const key=randomUUID();const results=await Promise.all(Array.from({length:8},()=>creator.rpc('finance_request_payout',{p_request_key:key,p_expected_minor:'404',p_expected_fee:'0'})));
  const ids=results.map(r=>value(r));expect(new Set(ids).size).toBe(1);payoutId=ids[0]!;
  expect((await creator.rpc('finance_request_payout',{p_request_key:randomUUID(),p_expected_minor:'404',p_expected_fee:'0'})).error?.message).toBe('no_withdrawable_funds');
  expect((await workspace(creator,false)).available).toHaveLength(0);
  expect(sql(`select count(*) from private.finance_payout_items where payout_id=${quote(payoutId)};`)).toBe('2');
 });
 it('survives a lost response after transfer creation and never creates a second transfer',async()=>{
  await scenario(payoutId,'timeout_once');expect(await step()).toBe('unknown');
  expect((await workspace(creator,false)).payouts[0]!.status).toBe('requested');due();
  expect(await step()).toBe('succeeded');
  expect(sql(`select count(*) from private.finance_provider_objects o join private.finance_jobs j on j.id=o.job_id where j.payout_id=${quote(payoutId)} and j.kind='transfer';`)).toBe('1');
 });
 it('keeps transfer ownership during bank failure, return and simultaneous retries',async()=>{
  await scenario(payoutId,'decline');expect(await step()).toBe('failed');
  const retries=await Promise.all([1,2].map(()=>creator.rpc('finance_retry_bank',{p_payout:payoutId})));
  expect(retries.filter(r=>!r.error)).toHaveLength(1);expect(await step()).toBe('paid');
  const returned=await service.rpc('finance_test_return',{p_payout:payoutId});if(returned.error)throw returned.error;
  value(await anon.rpc('finance_reconcile',{p_backend:backend,p_app_id:app}));expect(await step()).toBe('returned');
  expect((await workspace(creator,false)).payouts[0]!.status).toBe('returned');
  const r=await creator.rpc('finance_retry_bank',{p_payout:payoutId});if(r.error)throw r.error;expect(await step()).toBe('paid');
  expect(sql(`select count(*) from private.finance_provider_objects o join private.finance_jobs j on j.id=o.job_id where j.payout_id=${quote(payoutId)} and j.kind='transfer';`)).toBe('1');
 });
 it('one threshold crossing creates one charge; failure pauses referrals and confirmed funds resume',async()=>{
  const settings=await owner.rpc('finance_save_auto',{p_app_id:app,p_enabled:true,p_threshold:'9900',p_amount:'10000'});if(settings.error)throw settings.error;
  const schedule=await Promise.all(Array.from({length:8},()=>anon.rpc('finance_schedule_auto',{p_backend:backend,p_app_id:app})));
  expect(schedule.map(r=>value(r)).reduce((a,b)=>a+b,0)).toBe(1);
  const f=(await workspace()).funding.find(v=>v.status==='pending')!;await scenario(f.id,'decline');expect(await step()).toBe('failed');expect((await workspace()).accounts[0]!.paused).toBe(true);
  const code=value(await creator.from('creator_program_memberships').select('referral_code').eq('app_id',app).single()).referral_code;
  const appKey=value(await owner.rpc('rotate_attribution_api_key',{p_app_id:app}));
  expect((await anon.rpc('register_referred_customer',{p_api_key:appKey,p_customer_id:'blocked_new_customer',p_code:code})).error?.message).toBe('program_paused_funding');
  const recovery=await fund('10000');expect((await workspace()).accounts[0]!.paused).toBe(true);expect(await step()).toBe('available');expect((await workspace()).accounts[0]!.paused).toBe(false);
  expect((await workspace()).funding.find(f=>f.id===recovery)!.status).toBe('available');
 });
 it('serializes administrator reconciliation against concurrent worker scans',async()=>{
  const f=await fund('333');await scenario(f,'decline');expect(await step()).toBe('failed');
  const job=jobFor(f);
  sql(`update private.finance_provider_objects set state='available' where job_id=${quote(job)};`);
  value(await anon.rpc('finance_reconcile',{p_backend:backend,p_app_id:app}));
  const results=await Promise.all([
   admin.rpc('finance_review_case',{p_job:job,p_note:'Verified the corrected provider funding evidence'}),
   anon.rpc('finance_reconcile',{p_backend:backend,p_app_id:app}),
   anon.rpc('finance_reconcile',{p_backend:backend,p_app_id:app}),
  ]);
  for(const r of results)if(r.error)throw r.error;
  expect(await step()).toBe('available');
  expect(sql(`select count(*) from public.commission_journals where app_id=${quote(app)} and idempotency_key='provider-funding:'||${quote(f)};`)).toBe('1');
 });
 it('processes the real worker CLI and preserves company isolation and balanced journals',async()=>{
  await fund('1000');
  const env:NodeJS.ProcessEnv={...process.env,PAYMENT_BACKEND_TOKEN:backend};delete env.SUPABASE_SECRET_KEY;
  const output=execFileSync('node',['scripts/finance-worker.mjs','--once','--app',app],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});expect(output).toContain('Sandbox finance: available');
  expect((await other.rpc('finance_workspace',{p_app_id:app})).error?.message).toBe('not_authorized');
  expect((await owner.rpc('finance_workspace',{p_admin:true})).error?.message).toBe('not_authorized');
  expect((await creator.rpc('finance_test_return',{p_payout:payoutId})).error).not.toBeNull();
  expect(sql(`select count(*) from public.commission_journals where app_id=${quote(app)} and not private.commission_entries_balanced(entries);`)).toBe('0');
  expect(sql(`select private.finance_free(${quote(app)},'EUR')>=0;`)).toBe('t');
 });
 it.skipIf(!process.env.E8_HTTP_BASE_URL)('renders Funding/Payouts and provider onboarding with actual authenticated HTTP sessions',async()=>{
  if(!process.env.E8_HTTP_BASE_URL) return;
  for(const [path,cookie,expected] of [['/company/funding',ownerCookie,'Deposit history'],['/creator/payouts',creatorCookie,'Payout history'],['/admin/finance',adminCookie,'Provider reconciliation'],['/admin/payouts',adminCookie,'Payout history']]) {
   const r=await fetch(process.env.E8_HTTP_BASE_URL+path,{headers:{cookie:cookie!},redirect:'manual'});expect(r.status).toBe(200);const html=await r.text();expect(html).toContain(expected);expect(html).not.toContain('data-next-error');expect(html).not.toContain('Application error');
  }
  const session=value(await owner.rpc('finance_start_onboarding',{p_kind:'funding',p_app_id:app}));
  const r=await fetch(process.env.E8_HTTP_BASE_URL+'/sandbox/finance/'+session,{headers:{cookie:ownerCookie}});expect(r.status).toBe(200);const html=await r.text();expect(html).toContain('Sandbox payment authorization');expect(html).not.toContain('data-next-error');
 });
});
