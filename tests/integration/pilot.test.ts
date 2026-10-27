import { createHmac, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import type { Database } from '@/lib/supabase/database.types';
import { normalizePaymentEvent } from '@/modules/payments/adapters';
import { handlePaymentWebhook } from '@/modules/payments/ingress';
import { sandboxProvider } from '@/modules/finance/provider.mjs';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, options), anon = createClient<Database>(url, key, options);
const base = process.env.E9_HTTP_BASE_URL;
const backend = base ? 'pmw_e9_pilot_fixture_backend_000000000000000000000000000000000000' : 'pmw_e9_fixture_' + randomUUID() + randomUUID();
const secret = 'fixture_e9_pilot_webhook_000000000000000000000000000000000000';
function value<T>(r: { data: T; error: unknown }): NonNullable<T> { if (r.error) throw r.error;if (r.data === null) throw Error('Expected result');return r.data!; }
const q = (text: string) => "'" + text.replaceAll("'", "''") + "'";
function sql(statement: string) { if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw Error('Local disposable fixtures required');return execFileSync('docker', ['exec', '-i', 'supabase_db_marketplace-roch', 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1'], { input: statement, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
type Client = SupabaseClient<Database>;
type Finance = { accounts: { paused: boolean; available_minor: string; arrears_minor: string }[]; payouts: { id: string; status: string }[]; available: { available_minor: string }[] };
describe('E9 connected pilot lifecycle and operational acceptance', () => {
  const users: string[] = [];
  let owner: Client, creator: Client, admin: Client, other: Client, creatorId: string, org: string, app: string, slug: string, plan: string, integration: string, referral: string, apiKey: string, policy: string, payoutId: string;
  const cookies: Record<string, string> = {};
  async function user(role: string) {
    const email = 'e9-pilot-' + randomUUID() + '@example.test', password = 'Pass-' + randomUUID() + '!1';
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });if (created.error) throw created.error;users.push(created.data.user.id);
    let stored: { name: string; value: string }[] = [];
    const client = createServerClient<Database>(url, key, { cookies: { getAll: () => stored, setAll: list => { for (const cookie of list) { stored = stored.filter(c => c.name !== cookie.name);stored.push(cookie); } } } });
    const signed = await client.auth.signInWithPassword({ email, password });if (signed.error) throw signed.error;
    cookies[role] = stored.map(c => c.name + '=' + c.value).join('; ');return { client, id: created.data.user.id };
  }
  const finance = async (client = owner, company = true) => value(await client.rpc('finance_workspace', { p_app_id: company ? app : undefined })) as unknown as Finance;
  const commission = () => anon.rpc('process_commission_jobs', { p_backend: backend, p_app_id: app, p_limit: 100 });
  async function fund(amount: string) { return value(await owner.rpc('finance_request_funding', { p_app_id: app, p_amount: amount, p_request_key: randomUUID() })); }
  async function financeStep() {
    const r = await anon.rpc('finance_claim', { p_backend: backend, p_app_id: app });if (r.error) throw r.error;
    return r.data ? sandboxProvider(anon, backend).execute(r.data as { id: string; lease: string }) : null;
  }
  async function ready(client: Client, kind: string) {
    const session = value(await client.rpc('finance_start_onboarding', { p_kind: kind, p_app_id: kind === 'funding' ? app : undefined }));
    const r = await client.rpc('finance_complete_onboarding', { p_session: session, p_consent: true });if (r.error) throw r.error;
  }
  function raw(id: string, kind: 'purchase' | 'renewal' | 'refund', time: string, transaction: string, amount = '1000') {
    return JSON.stringify({ id, account_id: 'e9_fixture_account', environment: 'sandbox', kind, occurred_at: time, store: 'generic', customer_id: 'provider_customer', subscription_id: 'provider_subscription', product_id: 'monthly', transaction_id: transaction, aliases: [], amount_minor: amount, currency: 'EUR', ...(kind === 'refund' ? { adjustment_id: 'refund_' + id, adjustment_state: 'succeeded' } : { period_end: '1977-02-28T00:00:00.000Z', is_trial: false, state: 'active', auto_renew: true }) });
  }
  async function deliver(body: string) {
    const timestamp = Math.floor(Date.now() / 1000), signature = createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex');
    const headers = { 'content-type': 'application/json', 'boostlink-signature': `t=${timestamp},v1=${signature}` };
    const path = '/api/webhooks/generic/' + integration;
    if (base) return fetch(base + path, { method: 'POST', headers, body });
    return handlePaymentWebhook(new Request('https://fixture.test' + path, { method: 'POST', headers, body }), 'generic', { id: integration, provider: 'generic', environment: 'sandbox', provider_account_id: 'e9_fixture_account', credential_ref: 'E9_PILOT_GENERIC' }, secret, async (id, environment, raw) => await anon.rpc('ingest_payment_event', { p_backend: backend, p_integration: integration, p_event_ref: id, p_environment: environment, p_raw: raw }));
  }
  async function paymentJobs() {
    const jobs = value(await anon.rpc('claim_payment_events', { p_backend: backend, p_integration: integration, p_limit: 20 })) as { id: string; lease: string; raw: string }[];
    for (const j of jobs) value(await anon.rpc('apply_payment_event', { p_backend: backend, p_event: j.id, p_lease: j.lease, p_normalized: normalizePaymentEvent('generic', j.raw, 'e9_fixture_account') }));
  }
  async function basisAll() {
    const inputs = value(await anon.rpc('commission_sandbox_inputs', { p_backend: backend, p_app_id: app })) as { id: string; amount_minor: string }[];
    for (const t of inputs) { const r = await anon.rpc('declare_commission_basis', { p_backend: backend, p_transaction: t.id, p_basis_minor: t.amount_minor });if (r.error) throw r.error; }
    value(await commission());
  }
  beforeAll(async () => {
    const accounts = await Promise.all(['owner', 'creator', 'admin', 'other'].map(user));[owner, creator, admin, other] = accounts.map(a => a.client);creatorId = accounts[1]!.id;
    const grant = await service.from('platform_admins').insert({ user_id: accounts[2]!.id, granted_by: 'E9 disposable pilot acceptance' });if (grant.error) throw grant.error;
    const token = await service.rpc('set_payment_backend_token', { p_token: backend });if (token.error) throw token.error;
    policy = value(await service.rpc('configure_commission_sandbox', { p_fee_bps: 1000, p_effective_at: new Date(Date.UTC(1975, 0, 1) + Math.floor(Math.random() * 8640000000)).toISOString() }));
  });
  afterAll(async () => {
    const revoke = await service.rpc('revoke_payment_backend_token', { p_token: backend });if (revoke.error) throw revoke.error;
    if (app && integration) sql(`delete from private.ops_worker_health where scope in(${q(app)},${q(integration)});`);
    if (org) { const r = await service.from('organizations').delete().eq('id', org);if (r.error) throw r.error; }
    if (policy) sql(`delete from private.commission_policies where id=${q(policy)} and not exists(select 1 from private.commission_bases where policy_id=${q(policy)});`);
    for (const id of users) { const a = await service.from('platform_admins').delete().eq('user_id', id);if (a.error) throw a.error;const r = await service.auth.admin.deleteUser(id);if (r.error) throw r.error; }
  });
  it('prepares a company app, plans, integration and confirmed funding before publication', async () => {
    org = value(await owner.rpc('create_organization', { p_name: 'E9 Pilot QA' }));app = value(await owner.rpc('create_app', { p_organization_id: org, p_name: 'E9 Pilot App' }));slug = 'pilot-' + randomUUID();
    value(await owner.rpc('save_app_draft', { p_app_id: app, p_name: 'E9 Pilot App', p_slug: slug, p_tagline: 'Disposable connected pilot acceptance.', p_description: 'A disposable test application exercising the complete company, creator, payments and accounting lifecycle.', p_categories: ['productivity'], p_platforms: ['web'], p_languages: ['en'], p_website_url: 'https://pilot.example.test', p_logo_url: '/demo/logo-pulse.svg', p_cover_image_url: '/demo/cover-pulse.svg', p_terms_text: 'Sandbox-only recurring commission with historical rates.' }));
    plan = value(await owner.rpc('upsert_app_plan', { p_app_id: app, p_name: 'Monthly', p_external_plan_key: 'monthly', p_billing_interval: 'month', p_price_minor: 1000, p_currency: 'EUR', p_commission_bps: 1500 }));
    integration = value(await owner.rpc('configure_payment_integration', { p_app_id: app, p_provider: 'generic', p_environment: 'sandbox', p_account: 'e9_fixture_account', p_credential_ref: 'E9_PILOT_GENERIC' }));
    const source = await owner.rpc('set_payment_source', { p_integration: integration, p_store: 'generic' });if (source.error) throw source.error;
    const mapping = await owner.rpc('map_payment_plan', { p_integration: integration, p_external_id: 'monthly', p_plan_id: plan });if (mapping.error) throw mapping.error;
    await ready(owner, 'funding');await fund('1000');expect((await finance()).accounts[0]!.available_minor).toBe('0');expect(await financeStep()).toBe('available');
    value(await owner.rpc('submit_app_for_review', { p_app_id: app }));
    const revision = value(await owner.from('apps').select('review_revision').eq('id', app).single()).review_revision;
    expect((await admin.rpc('admin_review_app', { p_app_id: app, p_decision: 'approve', p_environment: 'live', p_expected_revision: revision })).error).not.toBeNull();
    value(await admin.rpc('admin_review_app', { p_app_id: app, p_decision: 'approve', p_expected_revision: revision }));
  });
  it('joins with a social profile, creates a named link and attributes the registered customer', async () => {
    const p = await creator.from('creator_profiles').insert({ user_id: creatorId });if (p.error) throw p.error;
    const s = await creator.from('creator_social_links').insert({ creator_id: creatorId, platform: 'instagram', url: 'https://instagram.com/e9pilot' });if (s.error) throw s.error;
    const terms = value(await anon.from('catalog_listings').select('terms_version_id').eq('app_id', app).single()).terms_version_id;
    const membership = value(await creator.rpc('join_program', { p_app_id: app, p_accepted_terms_version_id: terms, p_accepted_terms: true }));
    value(await creator.rpc('create_referral_link', { p_membership_id: membership, p_label: 'Pilot Instagram bio', p_channel: 'instagram', p_destination_kind: 'website' }));
    const link = value(await creator.from('creator_referral_links').select('token').eq('membership_id', membership).eq('label', 'Pilot Instagram bio').single());
    let click: string;
    if (base) { const r = await fetch(base + '/r/' + link.token, { redirect: 'manual' });expect(r.status).toBe(302);click = new URL(r.headers.get('location')!).searchParams.get('bl_ref')!; }
    else click = (value(await anon.rpc('record_referral_click', { p_link_token: link.token })) as { token: string }).token;
    apiKey = value(await owner.rpc('rotate_attribution_api_key', { p_app_id: app }));
    if (base) { const r = await fetch(base + '/api/v1/customers', { method: 'POST', headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' }, body: JSON.stringify({ customer_id: 'pilot_customer', click_tokens: [click] }) });expect(r.status).toBe(201);referral = (await r.json()).id; }
    else referral = (value(await anon.rpc('register_referred_customer', { p_api_key: apiKey, p_customer_id: 'pilot_customer', p_click_tokens: [click] })) as { id: string }).id;
    const map = await anon.rpc('map_payment_customer', { p_integration: integration, p_provider_customer: 'provider_customer', p_customer_id: 'pilot_customer', p_app_api_key: apiKey });if (map.error) throw map.error;
  });
  it('receives authenticated purchase/renewal webhooks once and calculates historical commissions', async () => {
    const purchase = raw('e9_purchase', 'purchase', '1977-01-01T00:00:00.000Z', 'pilot_transaction_1');
    const responses = await Promise.all([deliver(purchase), deliver(purchase)]);for (const r of responses) expect(r.status).toBe(200);
    expect((await deliver(raw('e9_renewal', 'renewal', '1977-01-31T00:00:00.000Z', 'pilot_transaction_2'))).status).toBe(200);
    await paymentJobs();await basisAll();
    const earnings = value(await creator.rpc('commission_workspace', { p_creator_id: creatorId })) as { earnings: { commission_bps: number }[]; totals: { accrued: string; available: string }[] };
    expect(earnings.earnings).toHaveLength(2);expect(earnings.totals[0]).toMatchObject({ accrued: '270', available: '0' });
    expect(earnings.earnings.every(e => e.commission_bps === 1500)).toBe(true);
  });
  it('applies a partial refund, closes a month once and withdraws through transfer and bank payout', async () => {
    expect((await deliver(raw('e9_refund', 'refund', '1977-01-25T00:00:00.000Z', 'pilot_transaction_1', '200'))).status).toBe(200);await paymentJobs();value(await commission());
    const close = await Promise.all([1, 2].map(() => anon.rpc('close_commission_month', { p_backend: backend, p_app_id: app, p_month: '1977-01-01' })));expect(close.map(r => value(r)).sort()).toEqual(['already_closed', 'closed']);
    expect((await finance(creator, false)).available[0]!.available_minor).toBe('243');
    await ready(creator, 'payout');payoutId = value(await creator.rpc('finance_request_payout', { p_request_key: randomUUID(), p_expected_minor: '243', p_expected_fee: '0' }));
    expect(await financeStep()).toBe('succeeded');expect(await financeStep()).toBe('paid');expect((await finance(creator, false)).payouts.find(p => p.id === payoutId)!.status).toBe('paid');
  });
  it('routes a refund after payout to a policy investigation without assigning the cost', async () => {
    expect((await deliver(raw('e9_after_payout_refund', 'refund', '1977-02-01T00:00:00.000Z', 'pilot_transaction_1', '100'))).status).toBe(200);
    await paymentJobs();value(await commission());
    const review = value(await admin.from('commission_review_cases').select('id').eq('app_id', app).single());
    expect((await admin.rpc('ops_review_commission', { p_case: review.id, p_state: 'closed', p_note: 'Attempt to invent liability without a policy' })).error).not.toBeNull();
    const r = await admin.rpc('ops_review_commission', { p_case: review.id, p_state: 'awaiting_policy', p_note: 'Refund after payout needs the owner liability policy.' });if (r.error) throw r.error;
    const workspace = value(await admin.rpc('ops_admin_workspace')) as { commission_cases: { id: string; state: string }[] };
    expect(workspace.commission_cases.find(c => c.id === review.id)!.state).toBe('awaiting_policy');
    expect((await finance(creator, false)).payouts.find(p => p.id === payoutId)!.status).toBe('paid');
    const commissions = value(await creator.rpc('commission_workspace', { p_creator_id: creatorId })) as { totals: { paid: string }[] };
    expect(commissions.totals[0]!.paid).toBe('243');
  });
  it('pauses acquisition after failed auto-funding, accrues old renewals and resumes after sufficient funding', async () => {
    const settings = await owner.rpc('finance_save_auto', { p_app_id: app, p_enabled: true, p_threshold: '900', p_amount: '1000' });if (settings.error) throw settings.error;
    value(await anon.rpc('finance_schedule_auto', { p_backend: backend, p_app_id: app }));
    const job = sql(`select j.id from private.finance_jobs j join private.finance_funding f on f.id=j.funding_id where f.app_id=${q(app)} and j.status='pending';`);
    const fault = await service.rpc('finance_test_scenario', { p_job: job, p_scenario: 'decline' });if (fault.error) throw fault.error;
    expect(await financeStep()).toBe('failed');expect((await finance()).accounts[0]!.paused).toBe(true);
    const member = value(await creator.from('creator_program_memberships').select('referral_code').eq('app_id', app).single());
    if (base) { const r = await fetch(base + '/api/v1/customers', { method: 'POST', headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' }, body: JSON.stringify({ customer_id: 'blocked_customer', code: member.referral_code }) });expect(r.status).toBe(409); }
    else expect((await anon.rpc('register_referred_customer', { p_api_key: apiKey, p_customer_id: 'blocked_customer', p_code: member.referral_code })).error?.message).toBe('program_paused_funding');
    expect((await deliver(raw('e9_late_renewal', 'renewal', '1977-02-28T00:00:00.000Z', 'pilot_transaction_3', '10000'))).status).toBe(200);await paymentJobs();await basisAll();expect((await finance()).accounts[0]!.arrears_minor).toBe('1500');
    await fund('2000');expect(await financeStep()).toBe('available');expect((await finance()).accounts[0]!.paused).toBe(false);
  });
  it('handles a support conversation, notifications, health and an immutable admin audit', async () => {
    const key = randomUUID();const results = await Promise.all([1, 2, 3].map(() => owner.rpc('ops_create_ticket', { p_subject: 'Pilot funding review', p_body: 'Please review the sandbox funding recovery.', p_category: 'funding', p_request_key: key, p_app_id: app })));const ids = results.map(r => value(r));expect(new Set(ids).size).toBe(1);
    const replies = await Promise.all([1, 2].map(() => admin.rpc('ops_reply_ticket', { p_ticket: ids[0]!, p_body: 'The sandbox funding recovery was verified.', p_request_key: randomUUID(), p_expected_revision: 1, p_status: 'closed' })));expect(replies.filter(r => !r.error)).toHaveLength(1);expect(replies.find(r => r.error)?.error?.message).toBe('stale_ticket');
    const inbox = value(await owner.rpc('ops_inbox')) as { notifications: { id: string; code: string }[] };expect(inbox.notifications.some(n => n.code === 'automatic_topup_failed')).toBe(true);expect(inbox.notifications.some(n => n.code === 'support_reply')).toBe(true);
    expect((await other.rpc('ops_mark_notification', { p_id: inbox.notifications[0]!.id })).error?.message).toBe('not_authorized');
    const audit = value(await admin.rpc('ops_admin_workspace')) as { audit: { action: string }[] };expect(audit.audit.some(a => a.action === 'support_ticket_replied')).toBe(true);
    expect((await other.rpc('ops_admin_workspace')).error?.message).toBe('not_authorized');
    expect((await other.from('commission_earnings').select('id').eq('app_id', app)).data).toHaveLength(0);
    expect(sql(`select count(*) from public.commission_journals where app_id=${q(app)} and not private.commission_entries_balanced(entries);`)).toBe('0');
  });
  it('records worker liveness from the actual scoped CLI processes without privileged keys', () => {
    const env: NodeJS.ProcessEnv = { ...process.env, PAYMENT_BACKEND_TOKEN: backend };delete env.SUPABASE_SECRET_KEY;
    for (const args of [['scripts/payment-worker.mjs', '--once', '--integration', integration], ['scripts/commission-worker.mjs', '--once', '--app', app], ['scripts/finance-worker.mjs', '--once', '--app', app]]) {
      execFileSync('node', args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    }
    expect(sql(`select count(*) from private.ops_worker_health where (worker='payments' and scope=${q(integration)}) or (worker in('commissions','finance') and scope=${q(app)});`)).toBe('3');
  });
  it.skipIf(process.env.E9_RECOVERY_DRILL !== '1')('restores a consistent snapshot containing real fixture commissions, payouts and support data', () => {
    const directory = mkdtempSync(join(tmpdir(), 'boostlink-e9-restore-'));
    const file = join(directory, 'pilot.dump');
    try {
      const backup = execFileSync('node', ['scripts/local-backup.mjs', 'backup', '--local', '--output', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      expect(backup).toContain('"status":"pass"');
      const manifest = JSON.parse(readFileSync(file + '.manifest.json', 'utf8')) as { tables: { table: string; rows: string }[] };
      for (const table of ['commission_journals', 'finance_payouts', 'ops_notifications', 'support_tickets']) expect(Number(manifest.tables.find(t => t.table === table)!.rows), table).toBeGreaterThan(0);
      const restore = execFileSync('node', ['scripts/local-backup.mjs', 'verify', '--local', '--file', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      const report = JSON.parse(restore);
      expect(report).toMatchObject({ status: 'pass', exact_table_fingerprints: true, balanced_journals: true, foreign_user_rls: true, storage_unpacked_to_scratch: true, source_database_unchanged: true });
      console.log('PASS E9 nonempty database/Auth/Storage recovery drill, financial fingerprints and restored RLS');
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it.skipIf(!base)('submits the actual support Server Action from rendered form fields', async () => {
    const response = await fetch(base + '/support', { headers: { cookie: cookies.owner! } });
    const html = await response.text();
    const form = html.match(/<form[^>]*>[\s\S]*?name="subject"[\s\S]*?<\/form>/)?.[0];
    expect(form).toBeDefined();
    const body = new FormData();
    const decode = (text: string) => text.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    for (const input of form!.match(/<input\b[^>]*>/g) ?? []) {
      const name = input.match(/name="([^"]+)"/)?.[1], value = input.match(/value="([^"]*)"/)?.[1];
      if (name) body.append(decode(name), decode(value ?? ''));
    }
    expect([...body.keys()].some(key => key.startsWith('$ACTION_'))).toBe(true);
    body.set('subject', 'HTTP form acceptance');body.set('body', 'Submitted through the rendered support form during pilot QA.');body.set('category', 'other');
    const result = await fetch(base + '/support', { method: 'POST', headers: { cookie: cookies.owner!, origin: base! }, body });
    expect(result.status).toBe(200);
    const inbox = value(await owner.rpc('ops_inbox')) as { tickets: { subject: string }[] };
    expect(inbox.tickets.some(t => t.subject === 'HTTP form acceptance')).toBe(true);
  });
  it.skipIf(!base)('renders the current route inventory with authenticated SSR, including operational screens', async () => {
    const routes: [string, string, string][] = [['/admin/integrations', 'admin', 'Integration health'], ['/admin/issues', 'admin', 'Support requests'], ['/notifications', 'owner', 'Notifications'], ['/support', 'owner', 'Pilot funding review'], ['/creator/payouts', 'creator', 'Payout history'], ['/company/funding', 'owner', 'Deposit history'], ['/creator/referrals/' + referral, 'creator', 'Commission accounting'], ['/company/integrations', 'owner', 'Integrations'], ['/apps/' + slug, 'other', 'E9 Pilot App'], ...(['/creator', '/creator/programs', '/creator/programs/' + slug, '/creator/links', '/creator/referrals', '/creator/earnings', '/creator/settings'].map(path => [path, 'creator', 'BoostLink'] as [string, string, string])), ...(['/company', '/company/app', '/company/app/preview', '/company/plans', '/company/creators', '/company/referrals', '/company/referrals/' + referral, '/company/settings'].map(path => [path, 'owner', 'BoostLink'] as [string, string, string])), ...(['/admin', '/admin/users', '/admin/finance', '/admin/payouts'].map(path => [path, 'admin', 'BoostLink'] as [string, string, string])), ['/account', 'owner', 'BoostLink']];
    for (const [path, role, expected] of routes) { const r = await fetch(base + path, { headers: { cookie: cookies[role]! }, redirect: 'manual' });expect(r.status, path).toBe(200);const html = await r.text();expect(html, path).toContain(expected);expect(html, path).not.toContain('data-next-error');expect(html, path).not.toContain('Application error'); }
    const denied = await fetch(base + '/admin/issues', { headers: { cookie: cookies.other! }, redirect: 'manual' });const html = await denied.text();expect(html).not.toContain('Pilot funding review');expect(html).not.toContain('Operational audit');
  });
});
