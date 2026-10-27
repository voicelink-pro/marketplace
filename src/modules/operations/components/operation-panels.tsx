import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAdminOperations, getOperationsInbox } from '../queries';
import { notificationLabels, type Inbox, type OperationsWorkspace } from '../schemas';
import { CommissionReviewForm, MarkReadForm, NewSupportForm, RetryEventForm, SupportReplyForm } from './operation-forms';
const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const time = (v: string | null) => v ? date.format(new Date(v)) + ' UTC' : 'No report received';
const label = (v: string) => v.replaceAll('_', ' ');
function HealthPanel({ health }: { health: OperationsWorkspace['health'] }) {
  return <section aria-label="Operational health" className="space-y-4">
    <p className="text-sm text-muted-foreground">Sandbox pilot operations. Live processing remains disabled. Liveness and unresolved work are separate signals.</p>
    <dl className="grid gap-3 sm:grid-cols-3">{health.workers.map(w => <div key={w.worker} className="rounded-xl border p-4">
      <dt className="font-medium">{label(w.worker)} worker <Badge variant={w.state === 'ok' ? 'secondary' : 'destructive'}>{w.state}</Badge>
      </dt>
      <dd className="mt-2 text-xs text-muted-foreground">{time(w.last_seen_at)}</dd>
    </div>)}</dl>
    <p className="text-sm">Needs attention: payments {health.payment_attention} · commissions {health.commission_attention} · finance {health.finance_attention}. Open support requests: {health.open_tickets}.</p>
    <p className="text-xs text-muted-foreground">Unknown means no global worker heartbeat; a scoped acceptance-test worker does not certify the global worker. Stale means no heartbeat within two minutes.</p>
  </section>;
}
function Tickets({ tickets, messages, admin = false }: { tickets: Inbox['tickets']; messages: Inbox['messages']; admin?: boolean }) {
  return <div className="space-y-5">{tickets.map(t => <Card key={t.id}>
    <CardHeader>
      <div className="flex flex-wrap justify-between gap-2">
        <CardTitle>{t.subject}</CardTitle>
        <Badge variant="secondary">{label(t.status)}</Badge>
      </div>
      <CardDescription>{label(t.category)} · {time(t.updated_at)} · Reference {t.id.slice(0, 8)}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <ol className="space-y-3">{messages.filter(m => m.ticket_id === t.id).toReversed().map(m => <li key={m.id} className="rounded-lg border p-3">
        <p className="mb-2 text-xs text-muted-foreground">{m.is_admin ? 'Team' : 'Requester'} · {time(m.created_at)}</p>
        <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
      </li>)}</ol>
      <SupportReplyForm ticketId={t.id} revision={t.revision} requestKey={randomUUID()} admin={admin} status={t.status} />
    </CardContent>
  </Card>)}</div>;
}
export async function SupportPanel() {
  const data = await getOperationsInbox();
  return <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Contact the team</CardTitle>
        <CardDescription>Requests and replies stay in your account. Up to ten new requests per day.</CardDescription>
      </CardHeader>
      <CardContent>
        <NewSupportForm requestKey={randomUUID()} />
      </CardContent>
    </Card>{data.tickets.length ? <Tickets tickets={data.tickets} messages={data.messages} /> : <p className="text-sm text-muted-foreground">You have no support requests yet.</p>}</div>;
}
export async function NotificationsPanel() {
  const data = await getOperationsInbox();
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Unread: {data.unread}. Latest 100 notifications. Email delivery is not enabled.</p>{data.notifications.length ? <ul className="space-y-3">{data.notifications.map(n => <li key={n.id} className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="text-sm font-medium">{notificationLabels[n.code] ?? label(n.code)}</p>{!n.read_at ? <Badge variant="secondary">Unread</Badge> : null}</div>
      <p className="text-xs text-muted-foreground">{time(n.created_at)}</p>
      <Link href={n.href} className="block text-sm underline">Open details</Link>{!n.read_at ? <MarkReadForm id={n.id} /> : null}</li>)}</ul> : <p>No notifications yet. App reviews, funding failures, payouts and support replies will appear here.</p>}</div>;
}
export async function AdminIntegrationsPanel() {
  const data = await getAdminOperations();
  return <div className="space-y-6">
    <HealthPanel health={data.health} />
    <Card>
      <CardHeader>
        <CardTitle>Integration health</CardTitle>
        <CardDescription>Latest 100 configurations. Configured is not the same as verified. No credentials or raw events are displayed.</CardDescription>
      </CardHeader>
      <CardContent>{data.integrations.length ? <Table>
        <TableHeader>
          <TableRow>
            <TableHead>App / provider</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Last received / processed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{data.integrations.map(i => <TableRow key={i.id}>
          <TableCell>{i.app_name}<span className="block text-xs text-muted-foreground">{i.provider}</span>
          </TableCell>
          <TableCell>{i.environment}</TableCell>
          <TableCell>{i.verified_at ? 'Sandbox pipeline verified' : 'Not verified'}</TableCell>
          <TableCell className="text-xs">{time(i.last_received_at)}<br />{time(i.last_processed_at)}</TableCell>
        </TableRow>)}</TableBody>
      </Table> : <p>No integrations configured yet.</p>}</CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Events awaiting processing or review</CardTitle>
        <CardDescription>Oldest 100 incomplete events. Live events remain blocked.</CardDescription>
      </CardHeader>
      <CardContent>{data.events.length ? <div className="space-y-4">{data.events.map(e => <article key={e.id} className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="break-all font-mono text-xs">{e.id}</p>
          <Badge variant="secondary">{e.status}</Badge>
        </div>
        <p className="text-sm">{e.environment} · {e.error_code ?? 'No error code'} · Attempts {e.attempts}</p>
        <p className="text-xs text-muted-foreground">Received {time(e.received_at)} · Next attempt {time(e.next_attempt_at)}</p>{e.environment === 'sandbox' && ['waiting', 'failed'].includes(e.status) ? <RetryEventForm id={e.id} /> : null}</article>)}</div> : <p>No incomplete payment events.</p>}</CardContent>
    </Card>
  </div>;
}
export async function AdminIssuesPanel() {
  const data = await getAdminOperations();
  return <div className="space-y-6">
    <HealthPanel health={data.health} />
    <p className="text-sm">
      <Link className="underline" href="/admin/finance">Funding, arrears and provider reconciliation</Link> · <Link className="underline" href="/admin/payouts">Payout investigations</Link> · <Link className="underline" href="/admin/integrations">Payment event failures</Link>
    </p>
    <Card>
      <CardHeader>
        <CardTitle>Commission investigations</CardTitle>
        <CardDescription>Financial policy decisions are recorded without changing historical balances.</CardDescription>
      </CardHeader>
      <CardContent>{data.commission_cases.length ? <div className="space-y-4">{data.commission_cases.map(c => <article key={c.id} className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="break-words font-medium">{label(c.code)}</h3>
          <Badge variant="secondary">{label(c.state)}</Badge>
        </div>
        <p className="break-all text-xs text-muted-foreground">Transaction {c.transaction_id} · {time(c.created_at)}</p>{c.note ? <p className="text-sm">{c.note}</p> : null}<CommissionReviewForm id={c.id} />
      </article>)}</div> : <p>No commission investigations recorded.</p>}</CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Commission queue</CardTitle>
      </CardHeader>
      <CardContent>{data.commission_jobs.length ? <ul className="space-y-3 text-sm">{data.commission_jobs.map(j => <li key={j.transaction_id} className="break-all rounded-lg border p-3">{j.status} · {j.error_code ?? 'Awaiting worker'}<span className="mt-1 block font-mono text-xs">{j.transaction_id}</span>
      </li>)}</ul> : <p>No incomplete commission jobs.</p>}</CardContent>
    </Card>
    <section className="space-y-4" aria-label="Support requests">
      <h2 className="text-xl font-semibold">Support requests</h2>{data.tickets.length ? <Tickets tickets={data.tickets} messages={data.messages} admin /> : <p>No support requests yet.</p>}</section>
    <Card>
      <CardHeader>
        <CardTitle>Operational audit</CardTitle>
        <CardDescription>Latest 100 append-only events. Financial audit remains in Finance.</CardDescription>
      </CardHeader>
      <CardContent>{data.audit.length ? <ul className="space-y-3 text-sm">{data.audit.map(a => <li key={a.id} className="rounded-lg border p-3">
        <p>{label(a.action)} · {time(a.created_at)}</p>
        <p className="break-all font-mono text-xs text-muted-foreground">Entity {a.entity_id}</p>{a.note ? <p className="mt-2">{a.note}</p> : null}</li>)}</ul> : <p>No operational changes recorded yet.</p>}</CardContent>
    </Card>
  </div>;
}
