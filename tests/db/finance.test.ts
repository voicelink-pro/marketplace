import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { as, asUser, createAuthUser, createTestDb, type TestDb } from './harness';

const backend = 'finance_fixture_backend_' + randomUUID() + randomUUID();
type Workspace = { accounts: { available_minor: string; reserved_minor: string; arrears_minor: string; paused: boolean }[]; funding: { id: string; status: string }[]; payouts: { id: string; status: string; bank_attempt: number }[]; available: { available_minor: string }[]; notices: unknown[]; cases: { resolved_at: string | null; code: string }[] };
describe('E8 sandbox financing, auto top-ups, payouts and reconciliation', () => {
  let db: TestDb, owner: string, creator: string, other: string, admin: string, app: string, appB: string, plan: string, referral: string, subscription: string;
  const worker = (sql: string, args: unknown[] = []) => as(db, 'anon', null, tx => tx.query<Record<string, unknown>>(sql, args), { commit: true });
  const service = (sql: string, args: unknown[] = []) => as(db, 'service_role', null, tx => tx.query<Record<string, unknown>>(sql, args), { commit: true });
  const user = (id: string, sql: string, args: unknown[] = []) => asUser(db, id, tx => tx.query<Record<string, unknown>>(sql, args), { commit: true });
  const ws = async (id = owner, appId: string | null = app, isAdmin = false) => (await asUser(db, id, tx => tx.query<{ v: Workspace }>('select public.finance_workspace($1,$2) v', [appId, isAdmin]))).rows[0]!.v;
  const fund = async (amount = '10000', key = randomUUID()) => String((await user(owner, 'select public.finance_request_funding($1,$2,$3) id', [app, amount, key])).rows[0]!.id);
  async function jobFor(id: string) { return (await db.query<{ id: string }>('select id from private.finance_jobs where funding_id=$1 or payout_id=$1 order by (status=\'pending\') desc,created_at desc,id desc limit 1', [id])).rows[0]!.id; }
  async function scenario(id: string, value: string) { await service('select public.finance_test_scenario($1,$2)', [await jobFor(id), value]); }
  async function step() {
    const r = await worker('select public.finance_claim($1,$2) j', [backend, app]);
    const j = r.rows[0]!.j as { id: string; lease: string } | null;
    if (!j) return null;
    const exchange = await worker('select public.finance_sandbox_exchange($1,$2,$3) v', [backend, j.id, j.lease]);
    if ((exchange.rows[0]!.v as { unknown?: boolean }).unknown) { await worker('select public.finance_defer($1,$2,$3)', [backend, j.id, j.lease]); return 'unknown'; }
    return (await worker('select public.finance_settle($1,$2,$3) v', [backend, j.id, j.lease])).rows[0]!.v;
  }
  async function ready(kind: string, id: string, appId: string | null = null) {
    const session = String((await user(id, 'select public.finance_start_onboarding($1,$2) id', [kind, appId])).rows[0]!.id);
    await user(id, 'select public.finance_complete_onboarding($1,true)', [session]); return session;
  }
  async function buy(amount = '1000', time = '2026-09-12T10:00:00Z') {
    const t = (await db.query<{ id: string }>(`insert into public.payment_transactions(app_id,environment,referral_id,subscription_id,plan_id,plan_name,amount_minor,currency,is_trial,kind,occurred_at,period_end) values($1,'sandbox',$2,$3,$4,'Test',$5,'EUR',false,'renewal',$6,$6::timestamptz+interval '1 month') returning id`, [app, referral, subscription, plan, amount, time])).rows[0]!.id;
    await worker('select public.declare_commission_basis($1,$2,$3)', [backend, t, amount]);
    await worker('select public.process_commission_jobs($1,100,$2)', [backend, app]); return t;
  }
  async function payout(key = randomUUID()) {
    const available = (await ws(creator, null)).available[0]?.available_minor ?? '0';
    return String((await user(creator, 'select public.finance_request_payout($1,$2,\'0\',\'EUR\') id', [key, available])).rows[0]!.id);
  }
  async function due() { await db.exec("update private.finance_jobs set next_at=now()-interval '1 second' where status='pending'"); }
  beforeAll(async () => {
    db = await createTestDb();
    await db.exec(readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8'));
    app = (await db.query<{ id: string }>("select id from public.apps where slug='pulse-coach'")).rows[0]!.id;
    appB = (await db.query<{ id: string }>('select id from public.apps where id<>$1 limit 1', [app])).rows[0]!.id;
    owner = await createAuthUser(db, { email: 'e8owner@example.test' }); creator = await createAuthUser(db, { email: 'e8creator@example.test' }); other = await createAuthUser(db, { email: 'e8other@example.test' }); admin = await createAuthUser(db, { email: 'e8admin@example.test' });
    await db.query("insert into public.platform_admins(user_id,granted_by) values($1,'E8 fixture')", [admin]);
    await db.query("insert into public.organization_members(organization_id,user_id,role) select organization_id,$1,'owner' from public.apps where id=$2", [owner, app]);
    await db.query('insert into public.creator_profiles(user_id) values($1)', [creator]);
    await db.query("insert into public.creator_social_links(creator_id,platform,url) values($1,'instagram','https://instagram.com/e8fixture')", [creator]);
    await user(creator, 'select public.join_program($1,(select terms_version_id from public.catalog_listings where app_id=$1),true)', [app]);
    const terms = (await db.query<{ terms_version_id: string }>('select terms_version_id from public.catalog_listings where app_id=$1', [app])).rows[0]!.terms_version_id;
    plan = (await db.query<{ plan_id: string }>('select plan_id from public.app_terms_plan_rates where terms_version_id=$1 order by sort_order limit 1', [terms])).rows[0]!.plan_id;
    const membership = (await db.query<{ id: string }>('select id from public.creator_program_memberships where creator_id=$1', [creator])).rows[0]!.id;
    referral = (await db.query<{ id: string }>("insert into public.customer_referrals(app_id,creator_id,membership_id,terms_version_id,source,policy_version) values($1,$2,$3,$4,'code','sandbox-v1') returning id", [app, creator, membership, terms])).rows[0]!.id;
    await service('select public.set_payment_backend_token($1)', [backend]);
    await service("select public.configure_commission_sandbox(1000,'2020-01-01')");
    const integration = String((await user(owner, "select public.configure_payment_integration($1,'generic','sandbox','finance_fixture','E8_GENERIC') id", [app])).rows[0]!.id);
    subscription = (await db.query<{ id: string }>("insert into public.payment_subscriptions(app_id,environment,referral_id,integration_id) values($1,'sandbox',$2,$3) returning id", [app, referral, integration])).rows[0]!.id;
  });
  afterAll(async () => { await db?.close(); });
  let firstFunding: string, payoutId: string;
  it('separates app sales from funding and requires owner/provider consent', async () => {
    await buy(); expect((await db.query('select id from public.commission_journals where funding_credit>0')).rows).toHaveLength(0);
    await expect(fund()).rejects.toThrow('payment_method_required');
    await expect(user(other, "select public.finance_start_onboarding('funding',$1)", [app])).rejects.toThrow('not_authorized');
    const session = String((await user(owner, "select public.finance_start_onboarding('funding',$1) id", [app])).rows[0]!.id);
    await expect(user(other, 'select public.finance_complete_onboarding($1,true)', [session])).rejects.toThrow('invalid_onboarding');
    await expect(user(owner, 'select public.finance_complete_onboarding($1,false)', [session])).rejects.toThrow('invalid_onboarding');
    await user(owner, 'select public.finance_complete_onboarding($1,true)', [session]);
    await user(owner, 'select public.finance_complete_onboarding($1,true)', [session]);
    firstFunding = await fund(); expect((await ws()).accounts[0]!.available_minor).toBe('0');
  });
  it('deduplicates pending deposits across keys and credits only confirmed availability', async () => {
    expect(await fund()).toBe(firstFunding); expect(await step()).toBe('available');
    const w = await ws(); expect(w.accounts[0]!.reserved_minor).toBe('150'); expect(w.accounts[0]!.available_minor).toBe('9850');
    expect((await db.query('select id from public.commission_journals where funding_credit>0')).rows).toHaveLength(1);
    expect((await db.query<{ v: string }>("select bucket v from private.commission_positions")).rows[0]!.v).toBe('accrued');
  });
  it('refuses stale leases, forged callbacks, wrong workers and unsupported currencies', async () => {
    await expect(worker('select public.finance_settle($1,$2,$3)', [backend, await jobFor(firstFunding), randomUUID()])).rejects.toThrow('stale_finance_lease');
    await expect(worker("select public.finance_claim('wrong',null)")).rejects.toThrow();
    await expect(user(owner, 'select public.finance_test_scenario($1,\'decline\')', [await jobFor(firstFunding)])).rejects.toThrow('permission denied');
    await expect(user(creator, "select public.finance_request_payout($1,'1','0','USD')", [randomUUID()])).rejects.toThrow('not_authorized');
  });
  it('blocks withdrawals before closing and protects funded open-month dispute wins', async () => {
    await ready('payout', creator);
    await expect(payout()).rejects.toThrow('no_withdrawable_funds');
    const tx = (await db.query<{ id: string }>('select id from public.payment_transactions limit 1')).rows[0]!.id;
    const adj = (await db.query<{ id: string }>("insert into public.payment_adjustments(app_id,environment,referral_id,transaction_id,kind,state,amount_minor,occurred_at,event_ref) values($1,'sandbox',$2,$3,'dispute','open',1000,now(),'e8dispute') returning id", [app, referral, tx])).rows[0]!.id;
    await worker('select public.process_commission_jobs($1,100,$2)', [backend, app]);
    await db.query("update public.payment_adjustments set state='won',occurred_at=now()+interval '1 second',event_ref='won' where id=$1", [adj]);
    await worker('select public.process_commission_jobs($1,100,$2)', [backend, app]);
    expect((await db.query<{ bucket: string }>('select bucket from private.commission_positions')).rows[0]!.bucket).toBe('accrued');
    await worker("select public.close_commission_month($1,$2,'2026-09-01')", [backend, app]);
    expect((await ws(creator, null)).available[0]!.available_minor).toBe('135');
  });
  it('atomically reserves once and reconciles transfer timeouts with one provider object', async () => {
    await expect(user(creator, "select public.finance_request_payout($1,'134','0','EUR')", [randomUUID()])).rejects.toThrow('earnings_changed');
    const key = randomUUID(); payoutId = await payout(key); expect(await payout(key)).toBe(payoutId);
    await expect(payout()).rejects.toThrow('no_withdrawable_funds');
    await scenario(payoutId, 'timeout_once'); expect(await step()).toBe('unknown');
    expect((await ws(creator, null)).payouts[0]!.status).toBe('requested'); expect((await ws(creator, null)).available).toHaveLength(0);
    await due(); expect(await step()).toBe('succeeded');
    expect((await db.query("select job_id from private.finance_provider_objects where kind='transfer'")).rows).toHaveLength(1);
  });
  it('does not repeat the platform transfer after a failed bank payout', async () => {
    await scenario(payoutId, 'decline'); expect(await step()).toBe('failed');
    expect((await ws(creator, null)).payouts[0]!.status).toBe('bank_failed');
    await user(creator, 'select public.finance_retry_bank($1)', [payoutId]);
    expect(await step()).toBe('paid');
    expect((await db.query("select job_id from private.finance_provider_objects where kind='transfer'")).rows).toHaveLength(1);
    expect((await ws(creator, null)).payouts[0]!.status).toBe('paid');
  });
  it('reconciles a returned bank payout and retries only the bank operation', async () => {
    await service('select public.finance_test_return($1)', [payoutId]);
    await worker('select public.finance_reconcile($1,$2)', [backend, app]);
    expect(await step()).toBe('returned');
    expect((await ws(creator, null)).payouts[0]!.status).toBe('returned');
    expect((await db.query<{ bucket: string }>('select bucket from private.commission_positions')).rows[0]!.bucket).toBe('in_payout');
    await user(creator, 'select public.finance_retry_bank($1)', [payoutId]); expect(await step()).toBe('paid');
    await expect(user(creator, 'select public.finance_retry_bank($1)', [payoutId])).rejects.toThrow('bank_retry_unavailable');
    expect((await db.query("select job_id from private.finance_provider_objects where kind='transfer'")).rows).toHaveLength(1);
  });
  it('runs one automatic charge per threshold episode, then pauses on failure and notifies', async () => {
    await user(owner, "select public.finance_save_auto($1,true,'9900','10000')", [app]);
    await worker('select public.finance_schedule_auto($1,$2)', [backend, app]); await worker('select public.finance_schedule_auto($1,$2)', [backend, app]);
    const f = (await ws()).funding.find(v => v.status === 'pending')!;
    expect((await db.query("select id from private.finance_funding where kind='automatic'")).rows).toHaveLength(1);
    await scenario(f.id, 'decline'); expect(await step()).toBe('failed');
    expect((await ws()).accounts[0]!.paused).toBe(true); expect((await ws()).notices).toHaveLength(1);
    expect((await worker('select public.finance_schedule_auto($1,$2) n', [backend, app])).rows[0]!.n).toBe(0);
  });
  it('blocks new joins, clicks and referred customers, while preserving existing renewals', async () => {
    const link = (await db.query<{ token: string }>('select token from public.creator_referral_links where app_id=$1', [app])).rows[0]!.token;
    await expect(worker('select public.record_referral_click($1)', [link])).rejects.toThrow('program_paused_funding');
    await db.query('insert into public.creator_profiles(user_id) values($1)', [other]); await db.query("insert into public.creator_social_links(creator_id,platform,url) values($1,'instagram','https://instagram.com/e8other')", [other]);
    await expect(user(other, 'select public.join_program($1,(select terms_version_id from public.catalog_listings where app_id=$1),true)', [app])).rejects.toThrow('program_paused_funding');
    const key = String((await user(owner, 'select public.rotate_attribution_api_key($1) k', [app])).rows[0]!.k);
    const code = (await db.query<{ referral_code: string }>('select referral_code from public.creator_program_memberships where creator_id=$1', [creator])).rows[0]!.referral_code;
    await expect(worker("select public.register_referred_customer($1,'new_customer','{}',$2)", [key, code])).rejects.toThrow('program_paused_funding');
    await buy('200000','2026-10-10'); expect((await ws()).accounts[0]!.arrears_minor).toBe('30000');
    expect((await db.query('select id from public.commission_earnings')).rows).toHaveLength(2);
  });
  it('recovers only after sufficient confirmed funding, preserving another publication gate', async () => {
    await fund('1'); await step(); expect((await ws()).accounts[0]!.paused).toBe(true);
    const f = await fund('50000'); await step(); expect((await ws()).funding.find(v => v.id === f)!.status).toBe('available');
    expect((await ws()).accounts[0]!.paused).toBe(false); expect((await ws()).accounts[0]!.arrears_minor).toBe('0');
    expect((await ws(creator, null)).available).toHaveLength(0); // October is still open.
  });
  it('retains reservations on unknown outcomes, bounds retries and exposes an admin case', async () => {
    const f = await fund('1000'); await scenario(f, 'unavailable');
    for (let n = 0; n < 3; n++) { await due(); expect(await step()).toBe('unknown'); }
    expect(await step()).toBeNull();
    expect((await ws(admin, null, true)).cases.some(c => c.code === 'provider_outcome_unknown' && !c.resolved_at)).toBe(true);
    await expect(user(admin, "select public.finance_review_case($1,'Checked missing provider evidence')", [await jobFor(f)])).rejects.toThrow('provider_evidence_required');
    // Supply an authoritative result from the separate provider test fixture.
    await service("select public.finance_test_scenario($1,'success')", [await jobFor(f)]);
    expect(await step()).toBe('available');
  });
  it('holds mismatched provider amounts for review and never credits them', async () => {
    const f = await fund('1234'); const claimed = (await worker('select public.finance_claim($1,$2) j', [backend, app])).rows[0]!.j as { id: string; lease: string };
    await worker('select public.finance_sandbox_exchange($1,$2,$3)', [backend, claimed.id, claimed.lease]);
    await db.query('update private.finance_provider_objects set amount_minor=999 where job_id=$1', [claimed.id]);
    expect((await worker('select public.finance_settle($1,$2,$3) v', [backend, claimed.id, claimed.lease])).rows[0]!.v).toBe('review');
    expect((await ws()).funding.find(v => v.id === f)!.status).toBe('pending');
    await expect(user(other, "select public.finance_review_case($1,'Attempt forged admin reconciliation')", [claimed.id])).rejects.toThrow('not_authorized');
    await db.query('update private.finance_provider_objects set amount_minor=1234 where job_id=$1', [claimed.id]);
    await user(admin, "select public.finance_review_case($1,'Verified corrected provider amount and currency')", [claimed.id]);
    expect(await step()).toBe('available');
  });
  it('keeps pending provider funds unavailable until an explicit settlement', async () => {
    const before = (await ws()).accounts[0]!.available_minor;
    const f = await fund('777'); await scenario(f, 'pending'); expect(await step()).toBe('pending');
    expect((await ws()).accounts[0]!.available_minor).toBe(before);
    await service("select public.finance_test_resolve($1,'available')", [await jobFor(f)]);
    await due(); expect(await step()).toBe('available');
    expect(BigInt((await ws()).accounts[0]!.available_minor)).toBe(BigInt(before) + 777n);
  });
  it('releases a definitively failed transfer once and refuses a contradictory success later', async () => {
    await buy('1000', '2026-08-10'); await worker("select public.close_commission_month($1,$2,'2026-08-01')", [backend, app]);
    const id = await payout(); await scenario(id, 'decline'); expect(await step()).toBe('failed');
    expect((await ws(creator, null)).available[0]!.available_minor).toBe('135');
    const job = await jobFor(id);
    await db.query("update private.finance_provider_objects set state='succeeded' where job_id=$1", [job]);
    await worker('select public.finance_reconcile($1,$2)', [backend, app]);
    await user(admin, "select public.finance_review_case($1,'Investigated contradictory provider outcome')", [job]);
    expect(await step()).toBe('review');
    expect((await ws(creator, null)).available[0]!.available_minor).toBe('135');
    expect((await ws(creator, null)).payouts.find(p => p.id === id)!.status).toBe('transfer_failed');
  });
  it('does not charge again while the same low-funding episode remains below threshold', async () => {
    const free = BigInt((await ws()).accounts[0]!.available_minor);
    const threshold = free + 100n, topup = threshold + 100n;
    await user(owner, 'select public.finance_save_auto($1,true,$2,$3)', [app, threshold.toString(), topup.toString()]);
    await worker('select public.finance_schedule_auto($1,$2)', [backend, app]);
    // An existing customer renews while the top-up is in flight. Its whole position
    // consumes most of the resulting funds; the same crossing must not recharge.
    await buy((((free + topup - 500n) * 10000n) / 1500n).toString(), '2026-10-15');
    expect(await step()).toBe('available');
    expect(BigInt((await ws()).accounts[0]!.available_minor)).toBeLessThan(threshold);
    expect((await worker('select public.finance_schedule_auto($1,$2) n', [backend, app])).rows[0]!.n).toBe(0);
  });
  it('isolates company and creator projections, blocks direct mutations and maintains a balanced ledger', async () => {
    await expect(ws(other)).rejects.toThrow('not_authorized'); await expect(ws(owner, appB)).rejects.toThrow('not_authorized'); await expect(ws(owner, null, true)).rejects.toThrow('not_authorized');
    expect((await ws(other, null)).funding).toHaveLength(0); expect((await ws(other, null)).payouts).toHaveLength(0);
    await expect(user(owner, "update private.finance_accounts set paused=false")).rejects.toThrow('permission denied');
    expect((await db.query('select id from public.commission_journals where not private.commission_entries_balanced(entries)')).rows).toHaveLength(0);
    expect((await db.query<{ valid: boolean }>('select private.finance_free($1,\'EUR\')>=0 valid', [app])).rows[0]!.valid).toBe(true);
    expect((await db.query<{ credit: string }>('select private.finance_free($1,\'EUR\')::text credit', [appB])).rows[0]!.credit).toBe('0');
  });
});
