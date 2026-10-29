import{randomUUID}from'node:crypto';import{execFileSync}from'node:child_process';import{createClient,type SupabaseClient}from'@supabase/supabase-js';import{createServerClient}from'@supabase/ssr';import{beforeAll,afterAll,describe,it,expect}from'vitest';import type{Database}from'@/lib/supabase/database.types';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient<Database>(url,process.env.SUPABASE_SECRET_KEY!,options),anon=createClient<Database>(url,key,options);
function value<T>(r:{data:T;error:unknown}):NonNullable<T>{if(r.error)throw r.error;if(r.data===null)throw Error('Expected result');return r.data!}
// Local database fixtures only; business effects below go through authenticated Data API RPCs.
function sql(statement:string){if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('E7 concurrency fixtures require local Supabase');return execFileSync('docker',['exec','-i','supabase_db_marketplace-roch','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:statement,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim()}
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
describe('E7 real Postgres concurrent processing and closing through Data API',()=>{
 const users:string[]=[],backend='pmw_fixture_e7_'+randomUUID()+randomUUID();let owner:SupabaseClient<Database>,creator:SupabaseClient<Database>,other:SupabaseClient<Database>,admin:SupabaseClient<Database>,creatorId:string,app:string,org:string,plan:string,referral:string,policy:string,tx1:string,tx2:string,ownerCookie='',creatorCookie='';
 async function user(){const email='e7-concurrency-'+randomUUID()+'@example.test',password='Pass-'+randomUUID()+'!1';const created=await service.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;const u=created.data;users.push(u.user.id);let cookies:{name:string;value:string}[]=[];const c=createServerClient<Database>(url,key,{cookies:{getAll:()=>cookies,setAll:list=>{for(const cookie of list){cookies=cookies.filter(x=>x.name!==cookie.name);cookies.push(cookie)}}}});const signed=await c.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;return{id:u.user.id,client:c,cookie:()=>cookies.map(x=>x.name+'='+x.value).join('; ')}}
 const work=()=>anon.rpc('process_commission_jobs',{p_backend:backend,p_app_id:app,p_limit:20});
 beforeAll(async()=>{
  const accounts=await Promise.all([user(),user(),user(),user()]);[owner,creator,other,admin]=accounts.map(x=>x.client);creatorId=accounts[1]!.id;ownerCookie=accounts[0]!.cookie();creatorCookie=accounts[1]!.cookie();
  const a=await service.from('platform_admins').insert({user_id:accounts[3]!.id,granted_by:'E7 disposable concurrency fixtures'});if(a.error)throw a.error;
  org=value(await owner.rpc('create_organization',{p_name:'E7 disposable commission QA'}));app=value(await owner.rpc('create_app',{p_organization_id:org,p_name:'E7 Commission QA'}));
  value(await owner.rpc('save_app_draft',{p_app_id:app,p_name:'E7 Commission QA',p_slug:'e7-'+randomUUID(),p_tagline:'Disposable commission concurrency fixture.',p_description:'A disposable sandbox app to verify balanced journal processing and idempotent monthly closing.',p_categories:['productivity'],p_platforms:['web'],p_languages:['en'],p_website_url:'https://fixture.example.test',p_logo_url:'/demo/presets/logo-orbitly.png',p_cover_image_url:'/demo/presets/orbitly.png',p_terms_text:'Sandbox recurring commission with historical plan rates.'}));
  plan=value(await owner.rpc('upsert_app_plan',{p_app_id:app,p_name:'Monthly',p_external_plan_key:'monthly',p_billing_interval:'month',p_price_minor:1499,p_currency:'EUR',p_commission_bps:1500}));value(await owner.rpc('submit_app_for_review',{p_app_id:app}));const rev=value(await owner.from('apps').select('review_revision').eq('id',app).single()).review_revision;value(await admin.rpc('admin_review_app',{p_app_id:app,p_decision:'approve',p_expected_revision:rev}));
  const p=await creator.from('creator_profiles').insert({user_id:creatorId});if(p.error)throw p.error;const l=await creator.from('creator_social_links').insert({creator_id:creatorId,platform:'instagram',url:'https://instagram.com/e7fixture'});if(l.error)throw l.error;
  const terms=value(await anon.from('catalog_listings').select('terms_version_id').eq('app_id',app).single()).terms_version_id;value(await creator.rpc('join_program',{p_app_id:app,p_accepted_terms_version_id:terms,p_accepted_terms:true}));const code=value(await creator.from('creator_program_memberships').select('referral_code').eq('app_id',app).single()).referral_code;const appKey=value(await owner.rpc('rotate_attribution_api_key',{p_app_id:app}));referral=(value(await anon.rpc('register_referred_customer',{p_api_key:appKey,p_customer_id:'e7_fixture_customer',p_code:code})) as{id:string}).id;
  const integration=value(await owner.rpc('configure_payment_integration',{p_app_id:app,p_provider:'generic',p_environment:'sandbox',p_account:'e7_fixture',p_credential_ref:'E7_'+randomUUID().replaceAll('-','').toUpperCase()}));
  const subscription=sql(`insert into public.payment_subscriptions(app_id,environment,referral_id,integration_id) values(${quote(app)},'sandbox',${quote(referral)},${quote(integration)}) returning id;`).split('\n')[0]!;
  const effective=new Date(Date.UTC(1971,0,1)+Math.floor(Math.random()*86400000*100)).toISOString();policy=value(await service.rpc('configure_commission_sandbox',{p_fee_bps:1000,p_effective_at:effective}));const b=await service.rpc('set_payment_backend_token',{p_token:backend});if(b.error)throw b.error;
  const insert=()=>sql(`insert into public.payment_transactions(app_id,environment,referral_id,subscription_id,plan_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end) values(${quote(app)},'sandbox',${quote(referral)},${quote(subscription)},${quote(plan)},'Monthly',1499,'EUR',false,'purchase','1972-01-12','1972-02-12') returning id;`).split('\n')[0]!;tx1=insert();tx2=insert();
  for(const t of[tx1,tx2]){const r=await anon.rpc('declare_commission_basis',{p_backend:backend,p_transaction:t,p_basis_minor:'1499'});if(r.error)throw r.error}
 });
 afterAll(async()=>{
  const r=await service.rpc('revoke_payment_backend_token',{p_token:backend});if(r.error)throw r.error;
  if(org){const d=await service.from('organizations').delete().eq('id',org);if(d.error)throw d.error}
  if(policy)sql(`delete from private.commission_policies where id=${quote(policy)} and not exists(select 1 from private.commission_bases where policy_id=${quote(policy)});`);
  for(const id of users){const a=await service.from('platform_admins').delete().eq('user_id',id);if(a.error)throw a.error;const d=await service.auth.admin.deleteUser(id);if(d.error)throw d.error}
 });
 it('concurrent workers create one effect per payment and keep every journal balanced',async()=>{
  for(const r of await Promise.all([work(),work()]))if(r.error)throw r.error;
  expect(value(await owner.from('commission_earnings').select('id,gross_minor,creator_minor,platform_fee_minor').eq('app_id',app))).toEqual(expect.arrayContaining([expect.objectContaining({gross_minor:225,creator_minor:202,platform_fee_minor:23})]));
  expect(value(await owner.from('commission_earnings').select('id').eq('app_id',app))).toHaveLength(2);expect(sql(`select count(*) from public.commission_journals where app_id=${quote(app)} and not private.commission_entries_balanced(entries);`)).toBe('0');
 });
 it('two simultaneous month closures produce one immutable statement and repeat safely',async()=>{
  const results=await Promise.all([1,2].map(()=>anon.rpc('close_commission_month',{p_backend:backend,p_app_id:app,p_month:'1972-01-01'})));expect(results.map(r=>value(r)).sort()).toEqual(['already_closed','closed']);expect(value(await owner.from('commission_statements').select('id,creator_minor').eq('app_id',app))).toEqual([expect.objectContaining({creator_minor:404})]);
 });
 it('concurrent funding retries unlock older commission immediately, once',async()=>{
  for(const r of await Promise.all([1,2].map(()=>service.rpc('fund_commission_sandbox',{p_app_id:app,p_currency:'EUR',p_amount_minor:'450',p_reference:'concurrent_funding'}))))if(r.error)throw r.error;
  const w=value(await creator.rpc('commission_workspace',{p_creator_id:creatorId,p_app_id:app})) as{totals:{available:string;awaiting_funding:string}[]};expect(w.totals[0]).toMatchObject({available:'404',awaiting_funding:'0'});expect(value(await owner.from('commission_journals').select('id').eq('app_id',app).eq('kind','sandbox_fixture_funding'))).toHaveLength(1);
 });
 it('concurrent refund processing appends one correction and preserves the closed statement',async()=>{
  sql(`insert into public.payment_adjustments(app_id,environment,referral_id,transaction_id,kind,state,amount_minor,occurred_at,event_ref) values(${quote(app)},'sandbox',${quote(referral)},${quote(tx1)},'refund','succeeded',1499,now(),'e7_refund_fixture');`);
  for(const r of await Promise.all([work(),work()]))if(r.error)throw r.error;
  expect(value(await owner.from('commission_journals').select('id').eq('app_id',app).eq('kind','adjustment'))).toHaveLength(1);expect(value(await owner.from('commission_statements').select('creator_minor').eq('app_id',app))).toEqual([{creator_minor:404}]);
  const w=value(await creator.rpc('commission_workspace',{p_creator_id:creatorId,p_app_id:app})) as{totals:{available:string}[]};expect(w.totals[0]!.available).toBe('202');
 });
 it('processes a declared late purchase with the real CLI worker without touching other app queues',async()=>{
  const subscription=sql(`select subscription_id from public.payment_transactions where id=${quote(tx2)};`);
  const id=sql(`insert into public.payment_transactions(app_id,environment,referral_id,subscription_id,plan_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end) values(${quote(app)},'sandbox',${quote(referral)},${quote(subscription)},${quote(plan)},'Monthly',1499,'EUR',false,'renewal','1972-01-14','1972-02-14') returning id;`).split('\n')[0]!;
  const b=await anon.rpc('declare_commission_basis',{p_backend:backend,p_transaction:id,p_basis_minor:'1499'});if(b.error)throw b.error;
  const env:NodeJS.ProcessEnv={...process.env,PAYMENT_BACKEND_TOKEN:backend};delete env.SUPABASE_SECRET_KEY;
  const output=execFileSync('node',['scripts/commission-worker.mjs','--once','--app',app],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});expect(output).toContain('Commission result: processed');
  expect(value(await owner.from('commission_earnings').select('id').eq('app_id',app))).toHaveLength(3);
 });
 it('exposes safe read-only results and isolates foreign users; optional local SSR smoke',async()=>{
  expect(value(await other.from('commission_earnings').select('id').eq('app_id',app))).toHaveLength(0);expect((await owner.rpc('fund_commission_sandbox',{p_app_id:app,p_currency:'EUR',p_amount_minor:'9999',p_reference:'forged_frontend'})).error).not.toBeNull();expect((await creator.from('commission_earnings').update({creator_minor:9999}).eq('app_id',app)).error).not.toBeNull();
  const w=value(await other.rpc('commission_workspace',{p_app_id:app})) as{earnings:unknown[]};expect(w.earnings).toEqual([]);
  if(process.env.E7_HTTP_BASE_URL){for(const[path,cookie,text]of[['/creator/earnings',creatorCookie,'Subscription commissions'],['/company/funding',ownerCookie,'Monthly statements'],['/creator/referrals/'+referral,creatorCookie,'Commission accounting']]){const r=await fetch(process.env.E7_HTTP_BASE_URL+path,{headers:{cookie:cookie!},redirect:'manual'});expect(r.status).toBe(200);const html=await r.text();expect(html).toContain(text);expect(html).not.toContain('data-next-error');expect(html).not.toContain('Application error');}console.log('PASS E7 actual HTTP SSR: creator earnings, company statements and customer details')}
 });
});
