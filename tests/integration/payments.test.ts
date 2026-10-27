import {randomUUID,createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import type {Database} from '@/lib/supabase/database.types';
import {normalizePaymentEvent,type PaymentEvent} from '@/modules/payments/adapters';
import {handlePaymentWebhook,type IngressIntegration} from '@/modules/payments/ingress';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!,pubkey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const options={auth:{autoRefreshToken:false,persistSession:false}};
const make=()=>createClient<Database>(url,pubkey,options);
const service=createClient<Database>(url,process.env.SUPABASE_SECRET_KEY!,options),anon=make();
type Client=SupabaseClient<Database>;
function value<T>(r:{data:T;error:unknown}):NonNullable<T>{if(r.error)throw r.error;if(r.data===null)throw new Error('Expected result');return r.data!;}
const fixture=JSON.parse(readFileSync(new URL('../fixtures/payments/stripe-invoice-paid.json',import.meta.url),'utf8'));
describe('E6 real Data API: durable receipt, async worker, isolation and metrics',()=>{
 const users:string[]=[],orgs:string[]=[];
 const backend='pmw_fixture_'+randomUUID()+randomUUID();
 let owner:Client,other:Client,creator:Client,admin:Client,creatorId:string,app:string,integration:string,rc:string,plan:string,apiKey:string,referral:string;
 const secret='fixture-only-signature-secret-'+randomUUID();
 let config:IngressIntegration;
 function stripe(id:string,invoice:string){const raw=structuredClone(fixture);raw.id=id;raw.created=Math.floor(Date.now()/1000)-2;raw.data.object.id=invoice;raw.data.object.lines.data[0].period.end=Math.floor(Date.now()/1000)+86400*30;raw.data.object.payment_intent='pi_'+invoice;return JSON.stringify(raw);}
 async function user(){const email='it-payments-'+randomUUID()+'@example.test',password='Pass-'+randomUUID()+'1';const r=await service.auth.admin.createUser({email,password,email_confirm:true});if(r.error)throw r.error;users.push(r.data.user.id);const client=make();const auth=await client.auth.signInWithPassword({email,password});if(auth.error)throw auth.error;return {id:r.data.user.id,client};}
 async function ingest(raw:string){const time=Math.floor(Date.now()/1000);const sig=createHmac('sha256',secret).update(time+'.'+raw).digest('hex');return handlePaymentWebhook(new Request('https://boostlink.test/api/webhooks/stripe/'+integration,{method:'POST',headers:{'content-type':'application/json','stripe-signature':`t=${time},v1=${sig}`},body:raw}),'stripe',config,secret,async(id,env,body)=>await anon.rpc('ingest_payment_event',{p_backend:backend,p_integration:integration,p_event_ref:id,p_environment:env,p_raw:body}));}
 async function processOne(id:string){const jobs=value(await anon.rpc('claim_payment_events',{p_backend:backend,p_limit:50,p_integration:integration})) as {id:string;lease:string;raw:string}[];const job=jobs.find(j=>j.id===id)!;expect(job).toBeDefined();const n=normalizePaymentEvent('stripe',job.raw,'acct_fixture');return value(await anon.rpc('apply_payment_event',{p_backend:backend,p_event:id,p_lease:job.lease,p_normalized:n}));}
 beforeAll(async()=>{
  const accounts=await Promise.all([user(),user(),user(),user()]);[owner,other,creator,admin]=accounts.map(a=>a.client);creatorId=accounts[2]!.id;
  const g=await service.from('platform_admins').insert({user_id:accounts[3]!.id,granted_by:'E6 integration fixture'});if(g.error)throw g.error;
  const org=value(await owner.rpc('create_organization',{p_name:'E6 payment fixture'}));orgs.push(org);
  app=value(await owner.rpc('create_app',{p_organization_id:org,p_name:'Payment fixture'}));
  value(await owner.rpc('save_app_draft',{p_app_id:app,p_name:'Payment fixture',p_slug:'payments-'+randomUUID(),p_tagline:'Sandbox payment test application.',p_description:'A disposable app verifying durable payment event processing and account isolation.',p_categories:['productivity'],p_platforms:['web'],p_languages:['en'],p_website_url:'https://paymentfixture.example.com',p_logo_url:'/demo/logo-pulse.svg',p_cover_image_url:'/demo/cover-pulse.svg',p_terms_text:'Sandbox recurring commission with immutable customer attribution.'}));
  plan=value(await owner.rpc('upsert_app_plan',{p_app_id:app,p_name:'Monthly',p_external_plan_key:'monthly',p_billing_interval:'month',p_price_minor:1499,p_currency:'EUR',p_commission_bps:1500}));
  value(await owner.rpc('submit_app_for_review',{p_app_id:app}));const rev=value(await owner.from('apps').select('review_revision').eq('id',app).single()).review_revision;
  value(await admin.rpc('admin_review_app',{p_app_id:app,p_decision:'approve',p_expected_revision:rev}));
  const p=await creator.from('creator_profiles').insert({user_id:creatorId});if(p.error)throw p.error;
  const s=await creator.from('creator_social_links').insert({creator_id:creatorId,platform:'instagram',url:'https://instagram.com/paymentsfixture'});if(s.error)throw s.error;
  const listing=value(await anon.from('catalog_listings').select('terms_version_id').eq('app_id',app).single());
  value(await creator.rpc('join_program',{p_app_id:app,p_accepted_terms_version_id:listing.terms_version_id,p_accepted_terms:true}));
  const code=value(await creator.from('creator_program_memberships').select('referral_code').eq('app_id',app).single()).referral_code;
  apiKey=value(await owner.rpc('rotate_attribution_api_key',{p_app_id:app}));
  referral=(value(await anon.rpc('register_referred_customer',{p_api_key:apiKey,p_customer_id:'e6_customer_1',p_code:code})) as {id:string}).id;
  const set=await service.rpc('set_payment_backend_token',{p_token:backend});if(set.error)throw set.error;
  const suffix=randomUUID().replaceAll('-','').toUpperCase();
  integration=value(await owner.rpc('configure_payment_integration',{p_app_id:app,p_provider:'stripe',p_environment:'sandbox',p_account:'acct_fixture',p_credential_ref:'STRIPE_'+suffix}));
  rc=value(await owner.rpc('configure_payment_integration',{p_app_id:app,p_provider:'revenuecat',p_environment:'sandbox',p_account:'app_fixture',p_credential_ref:'RC_'+suffix}));
  value(await owner.rpc('set_payment_source',{p_integration:integration,p_store:'stripe'}).then(r=>({...r,data:true})));
  config={id:integration,provider:'stripe',environment:'sandbox',provider_account_id:'acct_fixture',credential_ref:'STRIPE_'+suffix};
 });
 afterAll(async()=>{
  const revoke=await service.rpc('revoke_payment_backend_token',{p_token:backend});if(revoke.error)throw revoke.error;
  if(creatorId){const r=await service.auth.admin.deleteUser(creatorId);if(r.error)throw r.error;}
  for(const id of orgs){const r=await service.from('organizations').delete().eq('id',id);if(r.error)throw r.error;}
  for(const id of users.filter(id=>id!==creatorId)){const d=await service.from('platform_admins').delete().eq('user_id',id);if(d.error)throw d.error;const r=await service.auth.admin.deleteUser(id);if(r.error)throw r.error;}
 });
 it('rejects a forged webhook and persists before ack without creating a synchronous purchase',async()=>{
  const body=stripe('evt_durable','in_1');const forged=await handlePaymentWebhook(new Request('https://boostlink.test',{method:'POST',headers:{'content-type':'application/json','stripe-signature':'t=1,v1=bad'},body}),'stripe',config,secret,async()=>{throw new Error('Must not persist');});expect(forged.status).toBe(401);
  const response=await ingest(body);expect(response.status).toBe(200);const receipt=await response.json();
  expect(value(await owner.from('payment_transactions').select('id').eq('app_id',app))).toHaveLength(0);
  expect(await processOne(receipt.id)).toBe('waiting_customer_mapping');
  expect(value(await owner.from('payment_integrations').select('verified_at').eq('id',integration).single()).verified_at).toBeNull();
 });
 it('repairs mappings and processes with the asynchronous lease, then exposes real creator metrics',async()=>{
  const customer=await anon.rpc('map_payment_customer',{p_integration:integration,p_provider_customer:'cus_fixture_1',p_customer_id:'e6_customer_1',p_app_api_key:apiKey});if(customer.error)throw customer.error;
  const planMap=await owner.rpc('map_payment_plan',{p_integration:integration,p_external_id:'price_fixture_monthly',p_plan_id:plan});if(planMap.error)throw planMap.error;
  const event=value(await owner.from('payment_events').select('id').eq('app_id',app).single());const retry=await owner.rpc('retry_payment_event',{p_event:event.id});if(retry.error)throw retry.error;
  expect(await processOne(event.id)).toBe('processed');
  expect(value(await creator.rpc('payment_metrics',{p_app_id:app}))).toEqual({paying_customers:1,active_paying_subscribers:1});
  expect(value(await creator.rpc('payment_customer_timeline',{p_referral:referral}))).toMatchObject([{kind:'purchase',amount_minor:'1499'}]);
 });
 it('deduplicates parallel deliveries and independent notifications for one transaction',async()=>{
  const body=stripe('evt_parallel','in_2');const responses=await Promise.all(Array.from({length:12},()=>ingest(body)));for(const r of responses)expect(r.status).toBe(200);
  const receipts=await Promise.all(responses.map(r=>r.json()));expect(new Set(receipts.map(r=>r.id)).size).toBe(1);
  const workers=await Promise.all(Array.from({length:2},()=>anon.rpc('claim_payment_events',{p_backend:backend,p_limit:1,p_integration:integration})));
  const jobs=workers.flatMap(r=>value(r) as {id:string;lease:string;raw:string}[]);expect(jobs).toHaveLength(1);
  const job=jobs[0]!;
  const parallel=await Promise.all([
   anon.rpc('apply_payment_event',{p_backend:backend,p_event:job.id,p_lease:job.lease,p_normalized:normalizePaymentEvent('stripe',job.raw,'acct_fixture')}),
   ...Array.from({length:6},()=>ingest(body)),
  ]);
  expect(value(parallel[0] as {data:unknown;error:unknown})).toBe('processed');
  for(const r of parallel.slice(1) as Response[])expect(r.status).toBe(200);
  const another=JSON.parse(body);another.id='evt_same_payment_other_type';another.type='invoice.payment_succeeded';
  const receipt=await (await ingest(JSON.stringify(another))).json();expect(await processOne(receipt.id)).toBe('processed');
  expect(value(await owner.from('payment_transactions').select('id').eq('app_id',app))).toHaveLength(2);
  const expiredLease=await anon.rpc('apply_payment_event',{p_backend:backend,p_event:receipt.id,p_lease:randomUUID(),p_normalized:normalizePaymentEvent('stripe',JSON.stringify(another),'acct_fixture')});expect(expiredLease.error?.message).toBe('stale_event_lease');
 });
 it('keeps secondary-provider Stripe receipts without a second economic effect and isolates readers',async()=>{
  const normalized:PaymentEvent={...normalizePaymentEvent('stripe',stripe('rc_mirror','unrelated_rc_transaction_id'),'acct_fixture')};
  const raw=JSON.stringify(normalized);const receipt=value(await anon.rpc('ingest_payment_event',{p_backend:backend,p_integration:rc,p_event_ref:normalized.event_id,p_environment:'sandbox',p_raw:raw})) as {id:string};
  const job=(value(await anon.rpc('claim_payment_events',{p_backend:backend,p_limit:20,p_integration:rc})) as {id:string;lease:string}[])[0]!;
  expect(value(await anon.rpc('apply_payment_event',{p_backend:backend,p_event:receipt.id,p_lease:job.lease,p_normalized:normalized}))).toBe('ignored');
  expect(value(await owner.from('payment_transactions').select('id').eq('app_id',app))).toHaveLength(2);
  expect(value(await other.from('payment_transactions').select('id').eq('app_id',app))).toHaveLength(0);
  expect(value(await other.from('payment_events').select('id').eq('app_id',app))).toHaveLength(0);
  expect((await creator.from('payment_transactions').update({amount_minor:1}).eq('app_id',app)).error).not.toBeNull();
  expect((await other.rpc('map_payment_plan',{p_integration:integration,p_external_id:'foreign',p_plan_id:plan})).error?.message).toBe('not_allowed');
 });
 it('does not create a duplicate sale for renewal retries and retains separate cancellation/refund timeline',async()=>{
  const body=JSON.parse(stripe('evt_renewal','in_3'));body.data.object.billing_reason='subscription_cycle';const receipt=await (await ingest(JSON.stringify(body))).json();expect(await processOne(receipt.id)).toBe('processed');
  const cancel={id:'evt_cancel',type:'customer.subscription.updated',created:Math.floor(Date.now()/1000),livemode:false,data:{object:{id:'sub_fixture_1',customer:'cus_fixture_1',status:'active',cancel_at_period_end:true}}};
  const cancelReceipt=await(await ingest(JSON.stringify(cancel))).json();expect(await processOne(cancelReceipt.id)).toBe('processed');
  expect(value(await owner.from('payment_adjustments').select('id').eq('app_id',app))).toHaveLength(0);
  const refund={id:'evt_refund',type:'refund.created',created:Math.floor(Date.now()/1000),livemode:false,data:{object:{id:'refund_3',payment_intent:'pi_in_3',amount:1499,currency:'eur',status:'succeeded'}}};
  const refundReceipt=await(await ingest(JSON.stringify(refund))).json();expect(await processOne(refundReceipt.id)).toBe('processed');
  const timeline=value(await creator.rpc('payment_customer_timeline',{p_referral:referral})) as {kind:string;state:string}[];
  expect(timeline.some(e=>e.kind==='renewal')).toBe(true);expect(timeline.some(e=>e.kind==='subscription'&&e.state==='cancel_scheduled')).toBe(true);expect(timeline.some(e=>e.kind==='refund')).toBe(true);
 });
});
