import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { as, asUser, createAuthUser, createTestDb, type TestDb } from './harness';
const backend = 'pmw_ops_fixture_' + randomUUID() + randomUUID();
describe('E9 support, notifications, operational access and audit', () => {
  let db: TestDb, owner: string, creator: string, other: string, admin: string, app: string, integration: string, ticket: string;
  const user = (id: string, sql: string, args: unknown[] = []) => asUser(db, id, tx => tx.query<Record<string, unknown>>(sql, args), { commit: true });
  const worker = (sql: string, args: unknown[] = []) => as(db, 'anon', null, tx => tx.query<Record<string, unknown>>(sql, args), { commit: true });
  async function inbox(id: string) { return (await user(id, 'select public.ops_inbox() v')).rows[0]!.v as { notifications: { id: string; code: string; read_at: string | null }[]; unread: number; tickets: { id: string; status: string; revision: number }[]; messages: { body: string }[] }; }
  beforeAll(async () => {
    db = await createTestDb(); await db.exec(readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8'));
    app = (await db.query<{ id: string }>("select id from public.apps where slug='monetra'")).rows[0]!.id;
    owner = await createAuthUser(db, { email: 'e9owner@example.test' });creator = await createAuthUser(db, { email: 'e9creator@example.test' });other = await createAuthUser(db, { email: 'e9other@example.test' });admin = await createAuthUser(db, { email: 'e9admin@example.test' });
    await db.query("insert into public.organization_members(organization_id,user_id,role) select organization_id,$1,'owner' from public.apps where id=$2", [owner, app]);
    await db.query("insert into public.platform_admins(user_id,granted_by) values($1,'E9 fixture')", [admin]);
    integration = String((await user(owner, "select public.configure_payment_integration($1,'generic','sandbox','fixture','E9_DB_GENERIC') id", [app])).rows[0]!.id);
    await as(db, 'service_role', null, tx => tx.query('select public.set_payment_backend_token($1)', [backend]), { commit: true });
  });
  afterAll(async () => { await db?.close(); });
  it('creates one request on retries and rejects changed content or another company scope', async () => {
    const key = randomUUID();
    const create = () => user(owner, "select public.ops_create_ticket('Funding question','Please investigate this funding request','funding',$1,$2) id", [key, app]);
    ticket = String((await create()).rows[0]!.id);expect((await create()).rows[0]!.id).toBe(ticket);
    await expect(user(owner, "select public.ops_create_ticket('Changed subject','Please investigate this funding request','funding',$1,$2)", [key, app])).rejects.toThrow('idempotency_conflict');
    await expect(user(other, "select public.ops_create_ticket('Foreign app request','Attempt to read another company','funding',$1,$2)", [randomUUID(), app])).rejects.toThrow('not_authorized');
    expect((await inbox(other)).tickets).toHaveLength(0);
  });
  it('isolates messages, requires a current revision and allows audited admin replies', async () => {
    await expect(user(other, "select public.ops_reply_ticket($1,'Forged foreign response',$2,1)", [ticket, randomUUID()])).rejects.toThrow('not_authorized');
    await expect(user(owner, "select public.ops_reply_ticket($1,'Cannot close my own ticket',$2,1,'closed')", [ticket, randomUUID()])).rejects.toThrow('invalid_reply');
    const key = randomUUID();const reply = () => user(admin, "select public.ops_reply_ticket($1,'We checked the provider evidence',$2,1,'closed')", [ticket, key]);
    await reply();await reply();
    expect((await inbox(owner)).tickets[0]).toMatchObject({ status: 'closed', revision: 2 });
    expect((await inbox(owner)).messages).toHaveLength(2);
    await expect(user(owner, "select public.ops_reply_ticket($1,'I have more relevant information',$2,1)", [ticket, randomUUID()])).rejects.toThrow('stale_ticket');
    await user(owner, "select public.ops_reply_ticket($1,'I have more relevant information',$2,2)", [ticket, randomUUID()]);
    expect((await inbox(owner)).tickets[0]!.status).toBe('open');
  });
  it('keeps notifications scoped, deduplicated and individually readable', async () => {
    const before = await inbox(owner);expect(before.notifications.some(n => n.code === 'support_reply')).toBe(true);
    const n = before.notifications[0]!;
    await expect(user(other, 'select public.ops_mark_notification($1)', [n.id])).rejects.toThrow('not_authorized');
    await user(owner, 'select public.ops_mark_notification($1)', [n.id]);await user(owner, 'select public.ops_mark_notification($1)', [n.id]);
    expect((await inbox(owner)).unread).toBe(before.unread - 1);
    expect((await inbox(other)).notifications).toHaveLength(0);
  });
  it('notifies owners about payment problems and allows only audited sandbox retries', async () => {
    const event = (await db.query<{ id: string }>("insert into public.payment_events(integration_id,app_id,environment,event_ref,digest,status,error_code) values($1,$2,'sandbox','e9_event','fixture','failed','waiting_customer_mapping') returning id", [integration, app])).rows[0]!.id;
    expect((await inbox(owner)).notifications.some(n => n.code === 'payment_event_needs_attention')).toBe(true);
    await db.query("update public.payment_events set status='failed' where id=$1", [event]);
    expect((await inbox(owner)).notifications.filter(n => n.code === 'payment_event_needs_attention')).toHaveLength(1);
    await expect(user(owner, "select public.ops_admin_retry_event($1,'Verified corrected mapping')", [event])).rejects.toThrow('not_authorized');
    await user(admin, "select public.ops_admin_retry_event($1,'Verified corrected customer mapping')", [event]);
    expect((await db.query<{ status: string }>('select status from public.payment_events where id=$1', [event])).rows[0]!.status).toBe('pending');
    expect((await db.query("select id from private.ops_audit where action='admin_event_retry'")).rows).toHaveLength(1);
    await db.query("update public.payment_events set environment='live',status='blocked' where id=$1", [event]);
    await expect(user(admin, "select public.ops_admin_retry_event($1,'Attempt to bypass live blocker')", [event])).rejects.toThrow('event_not_retryable');
  });
  it('distinguishes missing/scoped/stale/failed workers and authenticates monitoring', async () => {
    await expect(worker("select public.ops_health('forged')")).rejects.toThrow('invalid_backend_token');
    await worker("select public.ops_worker_heartbeat($1,'finance',$2,true)", [backend, app]);
    const h = () => worker('select public.ops_health($1) h', [backend]);
    expect(JSON.stringify((await h()).rows)).toContain('unknown');
    await worker("select public.ops_worker_heartbeat($1,'finance',null,false)", [backend]);
    expect(JSON.stringify((await h()).rows)).toContain('error');
    await db.exec("update private.ops_worker_health set last_seen_at=now()-interval '3 minutes' where scope='global'");
    expect(JSON.stringify((await h()).rows)).toContain('stale');
    await worker("select public.ops_worker_heartbeat($1,'finance',null,true)", [backend]);
    expect(JSON.stringify((await h()).rows)).toContain('ok');
    await expect(user(owner, 'select public.ops_admin_workspace()')).rejects.toThrow('not_authorized');
  });
  it('limits support abuse and forbids direct writes and audit mutation', async () => {
    for (let i = 0; i < 10; i++) await user(creator, "select public.ops_create_ticket('Test support request','Details for a sandbox support request','other',$1)", [randomUUID()]);
    await expect(user(creator, "select public.ops_create_ticket('One more request','Should be rate limited safely','other',$1)", [randomUUID()])).rejects.toThrow('ticket_rate_limit');
    await expect(user(owner, "update private.support_tickets set status='closed'")).rejects.toThrow('permission denied');
    await expect(db.exec("update private.ops_audit set action='tampered'")).rejects.toThrow('audit_is_immutable');
    await expect(as(db, 'anon', null, tx => tx.query('select public.ops_inbox()'))).rejects.toThrow('permission denied');
  });
});
