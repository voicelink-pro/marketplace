import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { Database } from '@/lib/supabase/database.types';
import { handleCustomerRegistration } from '@/modules/attribution/http';

type Client=SupabaseClient<Database>;
const options={auth:{persistSession:false,autoRefreshToken:false}};
const url=process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const make=()=>createClient<Database>(url,publicKey,options);
const service=createClient<Database>(url,process.env.SUPABASE_SECRET_KEY!,options);
const anon=make();
function value<T>(r:{data:T;error:unknown}):NonNullable<T> {if(r.error)throw r.error;if(r.data===null)throw new Error('Expected data');return r.data!;}

describe('E5 real PostgREST attribution, concurrency and HTTP contract',()=>{
  const users:string[]=[];
  const orgs:string[]=[];
  let owner:Client, other:Client, creator:Client, secondCreator:Client, admin:Client;
  let creatorId:string, secondId:string, app:string, otherApp:string, key:string, otherKey:string;
  let code:string, codeB:string, share:string, shareB:string;
  const slug='attribution-'+randomUUID();
  async function user() {
    const email='it-attr-'+randomUUID()+'@example.test',password='Pass-'+randomUUID()+'1';
    const response=await service.auth.admin.createUser({email,password,email_confirm:true});
    if(response.error)throw response.error;
    const created=response.data; users.push(created.user.id);
    const client=make();const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;
    return {client,id:created.user.id};
  }
  async function publish(client:Client,appId:string) {
    value(await client.rpc('submit_app_for_review',{p_app_id:appId}));
    const revision=value(await client.from('apps').select('review_revision').eq('id',appId).single()).review_revision;
    value(await admin.rpc('admin_review_app',{p_app_id:appId,p_decision:'approve',p_expected_revision:revision}));
  }
  async function click(token=share) {
    return value(await anon.rpc('record_referral_click',{p_link_token:token})) as {token:string;destination:string};
  }
  function register(customer:string,tokens:string[]=[],explicitCode?:string,secret=key) {
    return anon.rpc('register_referred_customer',{p_api_key:secret,p_customer_id:customer,p_click_tokens:tokens,p_code:explicitCode});
  }
  beforeAll(async()=>{
    const accounts=await Promise.all([user(),user(),user(),user(),user()]);
    [owner,other,creator,secondCreator,admin]=accounts.map(a=>a.client);
    creatorId=accounts[2]!.id; secondId=accounts[3]!.id;
    const grant=await service.from('platform_admins').insert({user_id:accounts[4]!.id,granted_by:'E5 integration fixture'});if(grant.error)throw grant.error;
    for(const [i,client] of [owner,other].entries()) {
      const org=value(await client.rpc('create_organization',{p_name:'Attribution fixture '+i}));orgs.push(org);
      const id=value(await client.rpc('create_app',{p_organization_id:org,p_name:'Attribution fixture '+i}));
      if(i===0)app=id;else otherApp=id;
      value(await client.rpc('save_app_draft',{p_app_id:id,p_name:'Attribution Demo '+i,p_slug:slug+'-'+i,
        p_tagline:'A real sandbox integration fixture.',p_description:'An application for testing attribution across distinct organizations.',
        p_categories:['productivity'],p_platforms:['web'],p_languages:['en'],p_website_url:'https://demo.localhost:3443/',
        p_logo_url:'/demo/logo-pulse.svg',p_cover_image_url:'/demo/cover-pulse.svg',
        p_terms_text:'Sandbox: last valid click within 30 days; explicit code wins. Immutable customer attribution.'}));
      value(await client.rpc('upsert_app_plan',{p_app_id:id,p_name:'Monthly',p_external_plan_key:'monthly',p_billing_interval:'month',p_price_minor:1000,p_currency:'EUR',p_commission_bps:1500}));
      await publish(client,id);
    }
    const listing=value(await anon.from('catalog_listings').select('terms_version_id').eq('app_id',app).single());
    for(const [client,id] of [[creator,creatorId],[secondCreator,secondId]] as const) {
      const p=await client.from('creator_profiles').insert({user_id:id});if(p.error)throw p.error;
      const social=await client.from('creator_social_links').insert({creator_id:id,platform:'instagram',url:'https://instagram.com/attributiontest'});if(social.error)throw social.error;
      value(await client.rpc('join_program',{p_app_id:app,p_accepted_terms_version_id:listing.terms_version_id,p_accepted_terms:true}));
    }
    code=value(await creator.from('creator_program_memberships').select('referral_code').eq('app_id',app).single()).referral_code;
    codeB=value(await secondCreator.from('creator_program_memberships').select('referral_code').eq('app_id',app).single()).referral_code;
    share=value(await creator.from('creator_referral_links').select('token').eq('app_id',app).single()).token;
    shareB=value(await secondCreator.from('creator_referral_links').select('token').eq('app_id',app).single()).token;
    key=value(await owner.rpc('rotate_attribution_api_key',{p_app_id:app}));
    otherKey=value(await other.rpc('rotate_attribution_api_key',{p_app_id:otherApp}));
  });
  afterAll(async()=>{
    // Remove only fixtures created here. Creator deletion removes their own memberships/attributions.
    for(const id of [creatorId,secondId].filter(Boolean)) {const r=await service.auth.admin.deleteUser(id);if(r.error)throw r.error;}
    for(const id of orgs) {const r=await service.from('organizations').delete().eq('id',id);if(r.error)throw r.error;}
    for(const id of users.filter(id=>id!==creatorId&&id!==secondId)) {const r=await service.from('platform_admins').delete().eq('user_id',id);if(r.error)throw r.error;const u=await service.auth.admin.deleteUser(id);if(u.error)throw u.error;}
  });
  it('serializes competing creators for one customer and returns exactly one durable identity',async()=>{
    const [a,b]=await Promise.all([click(),click(shareB)]);
    const results=await Promise.all(Array.from({length:8},(_,i)=>register('concurrent-customer',[i%2?a.token:b.token])));
    const rows=results.map(r=>value(r) as {id:string;created:boolean});
    expect(new Set(rows.map(r=>r.id)).size).toBe(1);expect(rows.filter(r=>r.created)).toHaveLength(1);
    const before=value(await owner.from('customer_referrals').select('creator_id,terms_version_id').eq('id',rows[0]!.id).single());
    expect((value(await register('concurrent-customer',[],before.creator_id===creatorId?codeB:code)) as {created:boolean}).created).toBe(false);
    expect(value(await owner.from('customer_referrals').select('creator_id,terms_version_id').eq('id',rows[0]!.id).single())).toEqual(before);
  });
  it('enforces app-scoped codes/tokens and prevents customer adoption after unattributed registration',async()=>{
    const c=await click();
    expect((await register('cross-app',[c.token],undefined,otherKey)).error?.message).toBe('invalid_click_token');
    expect((await register('cross-code',[],code,otherKey)).error?.message).toBe('invalid_referral_code');
    const first=value(await register('organic')) as {id:string;source:string};expect(first.source).toBe('unattributed');
    expect(value(await register('organic',[],code))).toMatchObject({id:first.id,created:false,source:'unattributed'});
  });
  it('records separate code-only source and aggregates exact per-link counts without PII',async()=>{
    const c=await click(); value(await register('link-account',[c.token])); value(await register('code-account',[c.token],codeB));
    const rows=value(await creator.from('customer_referrals').select('*'));
    expect(rows.every(r=>r.creator_id===creatorId)).toBe(true);
    expect(rows.some(r=>r.source==='link')).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('link-account');
    const b=value(await secondCreator.from('customer_referrals').select('*').eq('source','code'));
    expect(b).toHaveLength(1); expect(b[0]!.link_id).toBeNull();
    const summary=value(await creator.rpc('attribution_summary',{p_app_id:app})) as {clicks:number;registrations:number;code_registrations:number;links:{clicks:number;registrations:number}[]};
    expect(summary.clicks).toBe(summary.links.reduce((n,l)=>n+l.clicks,0));
    expect(summary.registrations).toBe(summary.links.reduce((n,l)=>n+l.registrations,0)+summary.code_registrations);
    expect(value(await other.from('customer_referrals').select('id').eq('app_id',app))).toEqual([]);
    expect(value(await other.from('referral_clicks').select('id').eq('app_id',app))).toEqual([]);
    expect((await anon.from('customer_referrals').select('*')).error).not.toBeNull();
    expect((await creator.from('customer_referrals').update({creator_id:secondId}).eq('app_id',app)).error).not.toBeNull();
    expect((await other.rpc('rotate_attribution_api_key',{p_app_id:app})).error?.message).toBe('not_allowed');
  });
  it('handles real API payload validation and idempotent HTTP statuses without a marketplace customer session',async()=>{
    const token=(await click()).token;
    const req=()=>new Request('https://boostlink.test/api/v1/customers',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({customer_id:'http-customer',click_tokens:[token]})});
    const call=async(args:Parameters<Parameters<typeof handleCustomerRegistration>[1]>[0])=>await anon.rpc('register_referred_customer',args);
    const created=await handleCustomerRegistration(req(),call);expect(created.status).toBe(201);
    const retry=await handleCustomerRegistration(req(),call);expect(retry.status).toBe(200);
    expect((await retry.json()).id).toBe((await created.json()).id);
  });
  it('retains customer snapshot across republication and rejects revoked credentials',async()=>{
    const initial=value(await owner.from('customer_referrals').select('id,creator_id,terms_version_id').eq('source','link').limit(1).single());
    const plan=value(await owner.from('app_plans').select('*').eq('app_id',app).single());
    value(await owner.rpc('upsert_app_plan',{p_app_id:app,p_plan_id:plan.id,p_name:plan.name,p_external_plan_key:plan.external_plan_key,p_billing_interval:'month',p_price_minor:1000,p_currency:'EUR',p_commission_bps:2500}));
    await publish(owner,app);
    expect(value(await owner.from('customer_referrals').select('id,creator_id,terms_version_id').eq('id',initial.id).single())).toEqual(initial);
    const c=await click(); const newer=value(await register('new-version',[c.token])) as {id:string};
    const version=value(await owner.from('customer_referrals').select('terms_version_id').eq('id',newer.id).single()).terms_version_id;
    expect(version).not.toBe(initial.terms_version_id);
    // Another publication leaves neither creator's accepted version nor current catalog pointing at version.
    value(await owner.rpc('upsert_app_plan',{p_app_id:app,p_plan_id:plan.id,p_name:plan.name,p_external_plan_key:plan.external_plan_key,p_billing_interval:'month',p_price_minor:1000,p_currency:'EUR',p_commission_bps:3500}));
    await publish(owner,app);
    expect(value(await creator.from('app_terms_versions').select('id').eq('id',version!).single()).id).toBe(version);
    expect(value(await creator.from('app_terms_plan_rates').select('commission_bps').eq('terms_version_id',version!))[0]!.commission_bps).toBe(2500);
    const newKey=value(await owner.rpc('rotate_attribution_api_key',{p_app_id:app}));
    expect((await register('revoked',[],code)).error?.message).toBe('invalid_api_key');
    key=newKey;expect((value(await register('after-rotation',[],code)) as {created:boolean}).created).toBe(true);
  });
});
