import { Check } from "lucide-react";
import { Fragment } from "react";
import { StatusChip } from "@/components/layout/status-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { longDate } from "@/modules/attribution/components/customers/customer-data";
import { CardTitle, HomeCard } from "@/modules/programs/components/home/card";
import { RetryBankForm } from "../finance-forms";
import {
  BANK_ATTEMPTS,
  canRetryBank,
  eventText,
  isBankFailure,
  paidOutByCurrency,
  type PayoutStep,
  payoutStatus,
  payoutSteps,
} from "./payout-data";

type Payout = {
  id: string;
  currency: string;
  amount_minor: string;
  fee_minor: string;
  status: string;
  bank_attempt: number;
  created_at: string;
  transfer_reference: string | null;
  bank_reference: string | null;
};

type PayoutEvent = { id: string; payout_id: string | null; code: string; created_at: string };

const STEP_ICON = {
  done: "bg-muted text-foreground",
  failed: "bg-destructive/10 text-destructive",
  waiting: "border border-dashed border-muted-foreground/60",
};

const STEP_STATE = { done: "done", failed: "failed", waiting: "waiting" };

function Steps({ steps }: { steps: PayoutStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {steps.map((step, index) => (
        <Fragment key={step.label}>
          {index > 0 ? <li aria-hidden className="h-px w-6 bg-border" /> : null}
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn("grid size-[18px] shrink-0 place-items-center rounded-full text-[11px] font-extrabold", STEP_ICON[step.state])}
            >
              {step.state === "done" ? <Check className="size-3" strokeWidth={3} /> : step.state === "failed" ? "!" : null}
            </span>
            {step.label}
            <span className="sr-only">: {STEP_STATE[step.state]}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

const time = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

function PayoutItem({ payout, events }: { payout: Payout; events: PayoutEvent[] }) {
  const money = (minor: bigint | string) => formatMinorCurrency(minor, payout.currency);
  const amount = BigInt(payout.amount_minor);
  const fee = BigInt(payout.fee_minor);
  const status = payoutStatus(payout.status);
  const references = [payout.transfer_reference, payout.bank_reference].filter(Boolean).join(" · ");
  const bankFailed = isBankFailure(payout.status);
  return (
    <li className="flex flex-col gap-3 border-t py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="tabular flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-lg font-extrabold tracking-[-0.02em]">{money(amount)}</span>
          <span className="text-[13px] text-muted-foreground">
            {money(amount > fee ? amount - fee : 0n)} to your bank · {longDate(payout.created_at)}
          </span>
        </div>
        <Steps steps={payoutSteps(payout)} />
        {bankFailed ? (
          <p className="text-[13px] text-muted-foreground">
            The money stays with the provider. Retrying reuses the same transfer.
            {payout.bank_attempt > 0 ? ` Attempt ${Math.min(payout.bank_attempt, BANK_ATTEMPTS)} of ${BANK_ATTEMPTS}.` : ""}
            {canRetryBank(payout) ? "" : " No retries left; contact Support."}
          </p>
        ) : null}
        {events.map((event) => (
          <p key={event.id} className="text-xs text-muted-foreground">
            {time.format(new Date(event.created_at))} UTC · {eventText(event.code)}
          </p>
        ))}
      </div>
      <div className="flex shrink-0 flex-row-reverse items-center justify-between gap-2 sm:flex-col sm:items-end">
        <StatusChip tone={status.tone} dot>
          {status.label}
        </StatusChip>
        {references ? (
          <span className="font-mono text-[11px] break-all text-muted-foreground">{references}</span>
        ) : null}
        {canRetryBank(payout) ? <RetryBankForm payoutId={payout.id} /> : null}
      </div>
    </li>
  );
}

function HistoryFrame({ note, children, busy }: { note?: React.ReactNode; children: React.ReactNode; busy?: boolean }) {
  return (
    <HomeCard titleId="payout-history-heading" busy={busy} className="gap-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-3">
        <CardTitle id="payout-history-heading">Payout history</CardTitle>
        {note ? <span className="tabular text-[13px] text-muted-foreground">{note}</span> : null}
      </div>
      {children}
    </HomeCard>
  );
}

/** Each payout with its two steps; a failed bank step can be retried from here. Latest 100 requests. */
export function CreatorPayoutHistory({ payouts, events }: { payouts: Payout[]; events: PayoutEvent[] }) {
  const paid = paidOutByCurrency(payouts);
  const note = paid.length
    ? `${paid.map((total) => formatMinorCurrency(total.minor, total.currency)).join(" · ")} paid out so far`
    : undefined;
  return (
    <HistoryFrame note={note}>
      {payouts.length ? (
        <ul className="flex flex-col">
          {payouts.map((payout) => (
            <PayoutItem key={payout.id} payout={payout} events={events.filter((event) => event.payout_id === payout.id)} />
          ))}
        </ul>
      ) : (
        <p className="border-t pt-4 text-sm text-muted-foreground">Your payouts show here after the first withdrawal.</p>
      )}
    </HistoryFrame>
  );
}

export function PayoutHistorySkeleton() {
  return (
    <HistoryFrame busy>
      <div aria-hidden className="flex flex-col gap-2 border-t py-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
    </HistoryFrame>
  );
}
