import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CardLink, HOME_CARD } from "@/modules/programs/components/home/card";
import { HowPayoutsWork } from "@/modules/programs/components/home/balance-card";
import { type BreakdownKey, type BucketTotals, balanceBreakdown } from "./earnings-data";

/** Only Available is yellow: it is the money the creator can act on. */
const SWATCH: Record<BreakdownKey, string> = {
  paid: "bg-foreground",
  in_payout: "bg-muted-foreground",
  available: "bg-primary",
  awaiting_funding: "bg-muted-foreground/60",
  held: "bg-destructive/60",
  accrued: "bg-muted",
};

const TITLE_ID = "balance-heading";

function Frame({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <section
      aria-labelledby={TITLE_ID}
      aria-busy={busy || undefined}
      className={cn(HOME_CARD, "grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-8")}
    >
      {children}
    </section>
  );
}

function Available({ amount, others, canWithdraw }: { amount: string; others: string[]; canWithdraw: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 id={TITLE_ID} className="text-[13px] font-semibold tracking-normal text-muted-foreground">
        Available to withdraw
      </h2>
      <span className="tabular text-[2.5rem] leading-none font-extrabold tracking-[-0.045em] sm:text-5xl">{amount}</span>
      {others.map((line) => (
        <span key={line} className="tabular text-sm font-bold">
          {line}
        </span>
      ))}
      <span className="text-[13px] text-muted-foreground">From closed, funded months.</span>
      {/* Nothing to withdraw: no button; the breakdown or the How payouts work box explains why. */}
      {canWithdraw ? (
        <div className="mt-1.5">
          <Button asChild className="h-11 w-full px-5 font-bold sm:w-auto">
            <Link href="/creator/payouts">
              Withdraw
              <LinkPendingIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const money = (minor: bigint | string, currency: string) => formatMinorCurrency(minor, currency);

/** The main currency's buckets as a bar and a list; other currencies get one line each. */
function WhereItIs({ totals, others }: { totals: BucketTotals; others: BucketTotals[] }) {
  const { rows, earned, bar } = balanceBreakdown(totals);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="text-sm font-bold tracking-normal">Where your money is</h3>
        <span className="tabular text-[13px] text-muted-foreground">{money(earned, totals.currency)} earned all time</span>
      </div>
      {bar ? (
        <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          {bar.map((segment) => (
            <span key={segment.key} className={cn("h-full", SWATCH[segment.key])} style={{ width: `${segment.percent}%` }} />
          ))}
        </div>
      ) : null}
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 border-t py-2.5 text-sm">
            <dt className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", SWATCH[row.key])} />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{row.label}</span>
                {row.caption ? <span className="text-xs text-muted-foreground">{row.caption}</span> : null}
              </span>
            </dt>
            <dd className="tabular shrink-0 font-bold">{money(row.minor, totals.currency)}</dd>
          </div>
        ))}
      </dl>
      {others.map((other) => (
        <span key={other.currency} className="tabular text-xs text-muted-foreground">
          {other.currency}: {money(balanceBreakdown(other).earned, other.currency)} earned all time
        </span>
      ))}
    </div>
  );
}

/** `totals` is the main currency; `others` are listed on small extra lines, never added in. */
export function EarningsBalance({ totals, others }: { totals: BucketTotals; others: BucketTotals[] }) {
  const otherAvailable = others
    .filter((other) => BigInt(other.available) > 0n)
    .map((other) => `+ ${money(other.available, other.currency)} available`);
  return (
    <Frame>
      <Available
        amount={money(totals.available, totals.currency)}
        others={otherAvailable}
        canWithdraw={BigInt(totals.available) > 0n}
      />
      <WhereItIs totals={totals} others={others} />
    </Frame>
  );
}

/** Before the first commission: €0.00, how payouts work, and where to start. */
export function EarningsBalanceEmpty() {
  return (
    <Frame>
      <Available amount={money(0n, "EUR")} others={[]} canWithdraw={false} />
      <div className="flex min-w-0 flex-col gap-3">
        <HowPayoutsWork />
        <p className="text-[13px] text-muted-foreground">
          Commission starts with your first paying customer. Share your links to get there.
        </p>
        <CardLink href="/creator/links" className="self-start">
          Go to Links
        </CardLink>
      </div>
    </Frame>
  );
}

export function EarningsBalanceUnavailable() {
  return (
    <Frame>
      <div className="flex flex-col gap-3">
        <h2 id={TITLE_ID} className="text-[13px] font-semibold tracking-normal text-muted-foreground">
          Available to withdraw
        </h2>
        <span className="text-[2.5rem] leading-none font-extrabold text-muted-foreground sm:text-5xl">—</span>
        <span className="text-[13px] text-muted-foreground">Earnings are unavailable right now.</span>
      </div>
    </Frame>
  );
}

export function EarningsBalanceSkeleton() {
  return (
    <Frame busy>
      <div className="flex flex-col gap-3">
        <h2 id={TITLE_ID} className="text-[13px] font-semibold tracking-normal text-muted-foreground">
          Available to withdraw
        </h2>
        <Skeleton className="h-10 w-40 sm:h-12" />
        <Skeleton className="h-3.5 w-44" />
        <Skeleton className="mt-1.5 h-11 w-full rounded-full sm:w-32" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full rounded-full" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex justify-between border-t py-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Frame>
  );
}
