import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMinorCurrency } from '@/lib/money';
import { getFinanceWorkspace } from '../queries';
import type { FinanceWorkspace } from '../schemas';
import { AutoFundingForm, FundingForm, OnboardingButton, RetryBankForm, ReviewCaseForm, WithdrawForm } from './finance-forms';

const dates = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
const label = (text: string) => text.replaceAll('_', ' ');
export function SandboxNotice() {
  return <div role="note" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <strong>Sandbox finance</strong>
    <p className="mt-1">Deposits, payment methods and payouts use the BoostLink test provider. No real funds move. App purchase webhooks never fund this account. Live funding and payouts are disabled.</p>
  </div>;
}
function FundingBalances({ accounts }: { accounts: FinanceWorkspace['accounts'] }) {
  if (!accounts.length) return <p className="text-sm text-muted-foreground">No funding account yet. Complete sandbox payment-method setup to begin.</p>;
  return accounts.map(a => <div key={a.app_id + a.currency} className="space-y-4">{accounts.length > 1 ? <p className="break-all font-mono text-xs">App {a.app_id}</p> : null}{a.paused ? <div role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">New joins and referrals are paused after an automatic top-up failure. Existing customer renewals continue to accrue. Deposit enough to cover outstanding commissions to resume.</div> : null}<dl className="grid gap-4 sm:grid-cols-3">{[['Available funding', a.available_minor], ['Reserved for commissions', a.reserved_minor], ['Awaiting company funding', a.arrears_minor]].map(([title, value]) => <div key={title} className="rounded-xl border bg-card p-5">
    <dt className="text-sm text-muted-foreground">{title}</dt>
    <dd className="mt-2 text-2xl font-semibold tabular-nums">{formatMinorCurrency(value!, a.currency)}</dd>
  </div>)}</dl>
  </div>);
}
function FundingHistory({ data }: { data: FinanceWorkspace }) {
  return <Card>
    <CardHeader>
      <CardTitle>Deposit history</CardTitle>
      <CardDescription>Latest 100 requests. Pending deposits are excluded from available funding.</CardDescription>
    </CardHeader>
    <CardContent>{data.funding.length ? <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date (UTC)</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{data.funding.map(f => <TableRow key={f.id}>
        <TableCell>{dates.format(new Date(f.created_at))}<span className="mt-1 block font-mono text-xs text-muted-foreground">{f.id.slice(0, 8)}</span>
        </TableCell>
        <TableCell>{label(f.kind)}</TableCell>
        <TableCell className="tabular-nums">{formatMinorCurrency(f.amount_minor, f.currency)}</TableCell>
        <TableCell>
          <Badge variant={f.status === 'failed' ? 'destructive' : 'secondary'}>{label(f.status)}</Badge>
        </TableCell>
      </TableRow>)}</TableBody>
    </Table> : <p className="text-sm text-muted-foreground">No deposits requested yet.</p>}</CardContent>
  </Card>;
}
export async function CompanyFinancePanel({ appId, canManage }: { appId: string; canManage: boolean }) {
  const data = await getFinanceWorkspace(appId);
  const account = data.accounts[0];
  return <section className="space-y-6" aria-label="Company funding">
    <SandboxNotice />
    <FundingBalances accounts={data.accounts} />{data.notices.length ? <Card>
      <CardHeader>
        <CardTitle>Funding notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">{data.notices.map(n => <li key={n.id}>{dates.format(new Date(n.created_at))} UTC — {label(n.code)}</li>)}</ul>
      </CardContent>
    </Card> : null}{canManage ? <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Fund your program</CardTitle>
          <CardDescription>Only confirmed provider funds can cover commissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">{account?.method_ready ? <FundingForm appId={appId} requestKey={randomUUID()} /> : <OnboardingButton kind="funding" appId={appId} />}{data.onboarding.map(s => <Link key={s.id} href={'/sandbox/finance/' + s.id} className="block text-sm underline">Continue sandbox payment setup</Link>)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Automatic top-ups</CardTitle>
          <CardDescription>You choose the threshold and deposit amount in EUR.</CardDescription>
        </CardHeader>
        <CardContent>{account?.method_ready ? <AutoFundingForm appId={appId} enabled={account.auto_enabled} threshold={account.threshold_minor} amount={account.topup_minor} /> : <p className="text-sm text-muted-foreground">Set up a sandbox payment method and authorization first.</p>}</CardContent>
      </Card>
    </div> : <p className="text-sm text-muted-foreground">An organization owner manages deposits and automatic top-ups.</p>}<FundingHistory data={data} />
  </section>;
}
export function PayoutHistory({ data, canRetry = true }: { data: FinanceWorkspace; canRetry?: boolean }) {
  return <Card>
    <CardHeader>
      <CardTitle>Payout history</CardTitle>
      <CardDescription>A platform transfer and a bank payout are separate operations. Latest 100 requests.</CardDescription>
    </CardHeader>
    <CardContent>{data.payouts.length ? <div className="space-y-4">{data.payouts.map(p => <article key={p.id} className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold tabular-nums">{formatMinorCurrency(p.amount_minor, p.currency)}</p>
        <Badge variant={['bank_failed', 'returned', 'transfer_failed'].includes(p.status) ? 'destructive' : 'secondary'}>{label(p.status)}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{dates.format(new Date(p.created_at))} UTC · Bank attempt {p.bank_attempt}/3 · Fee {formatMinorCurrency(p.fee_minor, p.currency)}</p>
      <dl className="grid gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Platform transfer</dt>
          <dd className="break-all font-mono">{p.transfer_reference ?? 'Awaiting provider confirmation'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bank payout</dt>
          <dd className="break-all font-mono">{p.bank_reference ?? 'Not created yet'}</dd>
        </div>
      </dl>{data.events.filter(e => e.payout_id === p.id).map(e => <p key={e.id} className="text-xs text-muted-foreground">{dates.format(new Date(e.created_at))} UTC · {label(e.code)}</p>)}{['bank_failed', 'returned'].includes(p.status) ? <p className="text-sm">Funds remain at the provider. A bank retry uses the existing platform transfer.</p> : null}{canRetry && ['bank_failed', 'returned'].includes(p.status) && p.bank_attempt < 3 ? <RetryBankForm payoutId={p.id} /> : null}</article>)}</div> : <p className="text-sm text-muted-foreground">No payout requests yet.</p>}</CardContent>
  </Card>;
}
export async function CreatorFinancePanel() {
  const data = await getFinanceWorkspace();
  const account = data.payout_account;
  const available = data.available.find(v => v.currency === 'EUR')?.available_minor ?? '0';
  const fee = account?.fee_minor ?? '0';
  const eligible = !!account?.enabled && BigInt(available) - BigInt(fee) >= BigInt(account.minimum_minor);
  return <div className="space-y-6">
    <SandboxNotice />
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Available to withdraw</CardTitle>
          <CardDescription>Funded earnings after monthly closing and reconciliation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-3xl font-semibold tabular-nums">{formatMinorCurrency(available, 'EUR')}</p>{data.available.filter(v => v.currency !== 'EUR').map(v => <p key={v.currency}>{formatMinorCurrency(v.available_minor, v.currency)} — this currency is not supported by the test provider.</p>)}<WithdrawForm amount={available} fee={fee} requestKey={randomUUID()} enabled={eligible} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payout account</CardTitle>
          <CardDescription>Identity and bank details belong in the provider onboarding flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{account?.enabled ? <>
          <Badge variant="secondary">Sandbox recipient active</Badge>
          <p className="text-sm text-muted-foreground">Provider currency: {account.currency}. Minimum: {formatMinorCurrency(account.minimum_minor, account.currency)}. Fee: {formatMinorCurrency(account.fee_minor, account.currency)}. No additional BoostLink minimum.</p>
        </> : <OnboardingButton kind="payout" />}{data.onboarding.map(s => <Link key={s.id} href={'/sandbox/finance/' + s.id} className="block text-sm underline">Continue sandbox recipient setup</Link>)}</CardContent>
      </Card>
    </div>
    <PayoutHistory data={data} />
  </div>;
}
export async function AdminFinancePanel({ payoutsOnly = false }: { payoutsOnly?: boolean }) {
  const data = await getFinanceWorkspace(undefined, true);
  return <div className="space-y-6">
    <SandboxNotice />{payoutsOnly ? <PayoutHistory data={data} canRetry={false} /> : <>
      <FundingBalances accounts={data.accounts} />
      <FundingHistory data={data} />
    </>}<Card>
      <CardHeader>
        <CardTitle>Provider reconciliation</CardTitle>
        <CardDescription>Discrepancies and unknown outcomes require provider evidence. Reviews cannot set a balance.</CardDescription>
      </CardHeader>
      <CardContent>{data.cases.length ? <div className="space-y-4">{data.cases.map(c => <article key={c.job_id} className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="font-medium">{label(c.code)}</h3>
          <Badge variant="secondary">{c.resolved_at ? 'Resolved' : 'Needs review'}</Badge>
        </div>
        <p className="break-all text-xs text-muted-foreground">{c.kind} · Job {c.job_id} · {c.status} · {c.attempts} attempts</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Marketplace</dt>
            <dd>{formatMinorCurrency(c.expected_amount_minor, c.expected_currency)} · {label(c.ledger_status)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Provider evidence</dt>
            <dd>{c.provider_amount_minor && c.provider_currency ? formatMinorCurrency(c.provider_amount_minor, c.provider_currency) : 'No confirmed amount'} · {label(c.provider_state ?? 'unknown')}</dd>
          </div>
        </dl>{c.provider_ref ? <p className="break-all font-mono text-xs">{c.provider_ref}</p> : null}{!c.resolved_at ? <ReviewCaseForm jobId={c.job_id} /> : null}</article>)}</div> : <p className="text-sm text-muted-foreground">No reconciliation issues recorded.</p>}</CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Processing queue</CardTitle>
        <CardDescription>Latest 100 provider operations.</CardDescription>
      </CardHeader>
      <CardContent>{data.jobs.length ? <ul className="space-y-3 text-sm">{data.jobs.map(j => <li key={j.id} className="break-all rounded-lg border p-3">
        <span className="font-mono text-xs">{j.id}</span>
        <p>{j.kind} · {j.status} · Attempts {j.attempts}/3</p>
      </li>)}</ul> : <p className="text-sm text-muted-foreground">No provider operations yet.</p>}</CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Finance audit</CardTitle>
      </CardHeader>
      <CardContent>{data.audit.length ? <ul className="space-y-3 text-sm">{data.audit.map(a => <li key={a.id}>{dates.format(new Date(a.created_at))} UTC · {label(a.action)}{a.note ? <p className="text-muted-foreground">{a.note}</p> : null}</li>)}</ul> : <p className="text-sm text-muted-foreground">No finance configuration changes yet.</p>}</CardContent>
    </Card>
  </div>;
}
