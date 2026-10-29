import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { as, asUser, createAuthUser, createTestDb, type TestDb } from "./harness";

describe("E5 customer attribution and isolation", () => {
  let db: TestDb;
  let app: string, otherApp: string, key: string, otherKey: string;
  let creatorA: string, creatorB: string, owner: string;
  let codeA: string, codeB: string, linkA: string, linkB: string;
  async function register(customer: string, tokens: string[] = [], code: string | null = null, secret = key) {
    return as(db, "anon", null, async tx => (await tx.query<{result: {id: string; created: boolean; source: string}}>(
      `select public.register_referred_customer($1,$2,$3,$4) result`, [secret,customer,tokens,code])).rows[0]!.result, {commit:true});
  }
  async function click(link = linkA) {
    return as(db, "anon", null, async tx => (await tx.query<{result: {token: string; destination: string}}>(
      `select public.record_referral_click($1) result`, [link])).rows[0]!.result, {commit:true});
  }
  beforeAll(async () => {
    db=await createTestDb();
    await db.exec(readFileSync(new URL("../../supabase/seed.sql", import.meta.url),"utf8"));
    const apps=await db.query<{id:string;slug:string;created_by:string}>(`select id,slug,created_by from public.apps where slug in ('monetra','draftly') order by slug`);
    app=apps.rows.find(a=>a.slug==='monetra')!.id;
    otherApp=apps.rows.find(a=>a.slug==='draftly')!.id;
    owner=await createAuthUser(db,{email:'owner@example.test'});
    await db.query(`insert into public.organization_members(organization_id,user_id,role) select organization_id,$1,'owner' from public.apps where id=$2`,[owner,app]);
    key=await as(db,'service_role',null,async tx=>(await tx.query<{k:string}>(`select public.rotate_attribution_api_key($1) k`,[app])).rows[0]!.k,{commit:true});
    otherKey=await as(db,'service_role',null,async tx=>(await tx.query<{k:string}>(`select public.rotate_attribution_api_key($1) k`,[otherApp])).rows[0]!.k,{commit:true});
    const creators=[];
    for (const name of ['alpha','bravo']) {
      const id=await createAuthUser(db,{email:name+'@example.test'});
      await db.query(`insert into public.creator_profiles(user_id) values($1)`,[id]);
      await db.query(`insert into public.creator_social_links(creator_id,platform,url) values($1,'instagram',$2)`,[id,'https://instagram.com/'+name]);
      await asUser(db,id,async tx=>tx.query(`select public.join_program($1,(select terms_version_id from public.catalog_listings where app_id=$1),true)`,[app]),{commit:true});
      const m=await db.query<{referral_code:string;token:string}>(`select m.referral_code,l.token from public.creator_program_memberships m join public.creator_referral_links l on l.membership_id=m.id where m.creator_id=$1`,[id]);
      creators.push({id,code:m.rows[0]!.referral_code,link:m.rows[0]!.token});
    }
    [creatorA,creatorB]=creators.map(c=>c.id);
    [codeA,codeB]=creators.map(c=>c.code);
    [linkA,linkB]=creators.map(c=>c.link);
  });
  afterAll(async()=>{await db?.close();});
  it('uses unguessable per-click tokens, hashes secrets, and never exposes receipt material',async()=>{
    const c=await click(); expect(c.token).toMatch(/^blc_[a-f0-9]{64}$/);
    expect(c.destination).toMatch(/^https:/);
    expect((await db.query<{h:string}>(`select secret_hash h from private.attribution_api_keys where app_id=$1`,[app])).rows[0]!.h).not.toContain(key);
    await expect(asUser(db,creatorA,tx=>tx.query(`select * from private.referral_click_receipts`))).rejects.toThrow();
    await expect(as(db,'anon',null,tx=>tx.query(`select * from public.referral_clicks`))).rejects.toThrow();
  });
  it('registers anonymously to marketplace, persists once, and cannot change creator on retry',async()=>{
    const c=await click(); const first=await register('opaque-1',[c.token]);
    expect(first).toMatchObject({created:true,source:'link'});
    const retry=await register('opaque-1',[],codeB); expect(retry).toMatchObject({id:first.id,created:false,source:'link'});
    const row=await db.query<{creator_id:string}>(`select creator_id from public.customer_referrals where id=$1`,[first.id]);
    expect(row.rows[0]!.creator_id).toBe(creatorA);
  });
  it('chooses last valid click by server time rather than supplied array order',async()=>{
    const a=await click(linkA); const b=await click(linkB);
    const result=await register('last-click',[b.token,a.token]);
    const row=await db.query<{creator_id:string}>(`select creator_id from public.customer_referrals where id=$1`,[result.id]);
    expect(row.rows[0]!.creator_id).toBe(creatorB);
  });
  it('gives explicit code precedence and keeps code-only out of link totals',async()=>{
    const c=await click(); const result=await register('code-priority',[c.token],codeB);
    expect(result.source).toBe('code');
    const r=await db.query<{creator_id:string;link_id:null;click_id:null}>(`select creator_id,link_id,click_id from public.customer_referrals where id=$1`,[result.id]);
    expect(r.rows[0]).toEqual({creator_id:creatorB,link_id:null,click_id:null});
  });
  it('records an unattributed registration so it cannot be taken over later',async()=>{
    const first=await register('already-exists');
    expect(first.source).toBe('unattributed');
    expect(await register('already-exists',[],codeA)).toMatchObject({id:first.id,created:false,source:'unattributed'});
  });
  it('rejects wrong application, forged tokens, public share token, and bad credentials',async()=>{
    const c=await click();
    await expect(register('wrong-app',[c.token],null,otherKey)).rejects.toThrow(/invalid_click_token/);
    await expect(register('wrong-code',[],codeA,otherKey)).rejects.toThrow(/invalid_referral_code/);
    await expect(register('forged',['blc_'+'a'.repeat(64)])).rejects.toThrow(/invalid_click_token/);
    await expect(register('share',[linkA])).rejects.toThrow(/invalid_click_token/);
    await expect(register('bad-key',[],codeA,'invalid')).rejects.toThrow(/invalid_api_key/);
    await expect(register('email@example.test')).rejects.toThrow(/invalid_registration/);
  });
  it('rejects an expired token without creating a customer, but retries retain previous attribution',async()=>{
    const c=await click();
    // Fixture expiry is inserted before the immutable trigger; business updates remain forbidden.
    await db.exec(`alter table public.referral_clicks disable trigger referral_clicks_immutable`);
    await db.query(`update public.referral_clicks set expires_at=now()-interval '1 second' where id=(select click_id from private.referral_click_receipts where token_hash=encode(sha256(convert_to($1,'UTF8')),'hex'))`,[c.token]);
    await db.exec(`alter table public.referral_clicks enable trigger referral_clicks_immutable`);
    await expect(register('expired',[c.token])).rejects.toThrow(/expired_click_token/);
    expect((await register('opaque-1',[c.token])).created).toBe(false);
    expect((await db.query(`select 1 from private.app_customer_identities where customer_hash=encode(sha256(convert_to($1,'UTF8')),'hex')`,[app+':expired'])).rows).toHaveLength(0);
  });
  it('isolates creator and company reads; denies browser writes and key rotation by other users',async()=>{
    const a=await asUser(db,creatorA,tx=>tx.query<{creator_id:string}>(`select creator_id from public.customer_referrals`));
    expect(a.rows.length).toBeGreaterThan(0); expect(a.rows.every(r=>r.creator_id===creatorA)).toBe(true);
    const company=await asUser(db,owner,tx=>tx.query<{app_id:string}>(`select app_id from public.customer_referrals`));
    expect(company.rows.length).toBeGreaterThan(0);
    await expect(asUser(db,creatorA,tx=>tx.query(`update public.customer_referrals set creator_id=$1`,[creatorB]))).rejects.toThrow();
    await expect(asUser(db,creatorA,tx=>tx.query(`select public.rotate_attribution_api_key($1)`,[app]))).rejects.toThrow(/not_allowed/);
    await expect(asUser(db,creatorA,tx=>tx.query(`select public.register_referred_customer($1,'browser','{}',null)`,[key]))).rejects.toThrow();
    await expect(db.query(`update public.customer_referrals set creator_id=$1 where creator_id=$2`,[creatorB,creatorA])).rejects.toThrow(/immutable/);
  });
  it('blocks unsafe approved redirect targets and incompatible advertised windows before tracking',async()=>{
    const before=(await db.query<{n:number}>(`select count(*)::int n from public.referral_clicks`)).rows[0]!.n;
    const original=(await db.query<{website_url:string}>(`select website_url from public.apps where id=$1`,[app])).rows[0]!.website_url;
    await db.query(`update public.apps set website_url=$2 where id=$1`,[app,'https://safe.example/path'+String.fromCharCode(92)+'evil']);
    await db.query(`select private.publish_app_release($1,null)`,[app]);
    await expect(click()).rejects.toThrow(/unsafe_redirect/);
    expect((await db.query<{n:number}>(`select count(*)::int n from public.referral_clicks`)).rows[0]!.n).toBe(before);
    await db.query(`update public.apps set website_url=$2,attribution_window_days=31 where id=$1`,[app,original]);
    await db.query(`select private.publish_app_release($1,null)`,[app]);
    await expect(click()).rejects.toThrow(/unsupported_attribution_policy/);
    await expect(register('unsupported',[],codeA)).rejects.toThrow(/unsupported_attribution_policy/);
    await db.query(`update public.apps set attribution_window_days=30 where id=$1`,[app]);
    await db.query(`select private.publish_app_release($1,null)`,[app]);
  });
  it('limits committed registrations and redirect volume without fingerprinting',async()=>{
    await db.query(`insert into private.attribution_rate_limits(key_id,minute,requests) select id,date_trunc('minute',now()),119 from private.attribution_api_keys where app_id=$1 and revoked_at is null on conflict(key_id,minute) do update set requests=119`,[app]);
    expect((await register('limit-final',[],codeA)).created).toBe(true);
    expect(await register('over-limit',[],codeA)).toEqual({error:'rate_limited'});
    await db.query(`delete from private.attribution_rate_limits where key_id in(select id from private.attribution_api_keys where app_id=$1)`,[app]);
    await db.query(`insert into private.referral_link_rate_limits(link_id,minute,requests) select id,date_trunc('minute',now()),299 from public.creator_referral_links where token=$1 on conflict(link_id,minute) do update set requests=299`,[linkA]);
    await click(); await expect(click()).rejects.toThrow(/click_rate_limited/);
    await db.query(`delete from private.referral_link_rate_limits where link_id in(select id from public.creator_referral_links where token=$1)`,[linkA]);
  });
  it('rotates and revokes old credentials',async()=>{
    const newKey=await as(db,'service_role',null,async tx=>(await tx.query<{k:string}>(`select public.rotate_attribution_api_key($1) k`,[app])).rows[0]!.k,{commit:true});
    await expect(register('revoked',[],codeA)).rejects.toThrow(/invalid_api_key/);
    key=newKey; expect((await register('rotated',[],codeA)).created).toBe(true);
  });
});
