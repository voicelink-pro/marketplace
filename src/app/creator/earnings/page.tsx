import type { Metadata } from "next";
import { Suspense } from "react";
import { EarningsTabs } from "@/components/layout/earnings-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorCurrency } from "@/lib/money";
import { requireViewer } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import {
  EarningsBalance,
  EarningsBalanceEmpty,
  EarningsBalanceSkeleton,
  EarningsBalanceUnavailable,
} from "@/modules/commissions/components/earnings/balance-card";
import { type AppInfo, CommissionHistory } from "@/modules/commissions/components/earnings/commission-history";
import {
  type BucketTotals,
  filterByStatus,
  groupStatements,
  parseStatusFilter,
} from "@/modules/commissions/components/earnings/earnings-data";
import {
  ByProgram,
  ByProgramSkeleton,
  ByProgramUnavailable,
  MonthlyEarnings,
  MonthlyEarningsSkeleton,
  type ProgramEarning,
} from "@/modules/commissions/components/earnings/monthly-card";
import { Corrections, NeedsAttention, Statements } from "@/modules/commissions/components/earnings/statements";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { TestModeNote } from "@/modules/finance/components/payouts/test-mode-note";
import { getPaymentMetrics } from "@/modules/payments/queries";
import {
  earnedInMonth,
  lastMonths,
  mainCurrency,
  monthKey,
  monthLabel,
  monthlyTotals,
} from "@/modules/programs/components/home/home-data";
import { type CreatorProgramSummary, listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Earnings" };

const DESCRIPTION = "What you earned, where it is now, and when you can withdraw it.";

type Settled<T> = Promise<T | undefined>;
type Commissions = Awaited<ReturnType<typeof getCommissionWorkspace>>;

/** Everything the page reads, started once and awaited only inside <Suspense>. */
type EarningsData = {
  commissions: Settled<Commissions>;
  programs: Settled<CreatorProgramSummary[]>;
  searchParams: PageProps<"/creator/earnings">["searchParams"];
};

const zeroTotals = (currency: string): BucketTotals => ({
  currency,
  accrued: "0",
  awaiting_funding: "0",
  available: "0",
  held: "0",
  in_payout: "0",
  paid: "0",
});

/** The currency with the most earnings, else the first with totals; EUR before any. */
function currencyOf(commissions: Commissions): string {
  return mainCurrency(commissions.earnings) ?? commissions.totals[0]?.currency ?? "EUR";
}

/** Six months in the main currency, as on Home; the current month is still open. */
function Monthly({ commissions, currency }: { commissions: Commissions; currency: string }) {
  const months = lastMonths(new Date(), 6);
  const labels = months.map((key) => monthLabel(key));
  const totals = monthlyTotals(commissions.earnings, currency, months);
  const hasData = totals.some((total) => total !== 0n);
  const otherCurrencies = [...new Set(commissions.earnings.map((row) => row.currency))].filter((code) => code !== currency);
  const notes = [
    ...(hasData ? [`${monthLabel(months.at(-1)!, "long")} is still open.`] : []),
    ...(otherCurrencies.length ? [`Shown in ${currency}. Earnings in ${otherCurrencies.join(", ")} are not included.`] : []),
  ];
  return (
    <MonthlyEarnings
      months={labels}
      // Plotted only: minor units of one currency, far below 2^53.
      points={hasData ? totals.map((total, index) => ({ month: labels[index]!, value: Number(total) })) : null}
      callout={hasData ? `${labels.at(-1)} · ${formatMinorCurrency(totals.at(-1)!, currency)}` : null}
      notes={notes}
    />
  );
}

/** This month per program, bars against the top program in the main currency; paying customers per app. */
async function ProgramsThisMonth({ data, currency }: { data: EarningsData; currency: string }) {
  const month = monthKey(new Date());
  const title = monthLabel(month, "long");
  const [programs, commissions] = await Promise.all([data.programs, data.commissions]);
  if (!programs || !commissions) return <ByProgramUnavailable month={title} />;
  const rows = await Promise.all(
    programs.map(async (program) => {
      const metrics = await settled(() => getPaymentMetrics(program.appId));
      return { program, earned: earnedInMonth(commissions.earnings, month, program.appId), paying: metrics?.paying_customers ?? null };
    }),
  );
  const top = rows.reduce(
    (max, row) => (row.earned?.currency === currency && BigInt(row.earned.minor) > max ? BigInt(row.earned.minor) : max),
    0n,
  );
  const items: ProgramEarning[] = rows
    .map(({ program, earned, paying }) => ({
      appId: program.appId,
      appName: program.appName,
      logoUrl: program.logoUrl,
      amount: earned ? formatMinorCurrency(earned.minor, earned.currency) : null,
      share: earned?.currency === currency && top > 0n ? Number((BigInt(earned.minor) * 100n) / top) : null,
      paying,
    }))
    // Programs with earnings this month first; otherwise the programs' own order.
    .toSorted((a, b) => Number(b.amount !== null) - Number(a.amount !== null));
  return <ByProgram month={title} programs={items} />;
}

async function EarningsBody({ data }: { data: EarningsData }) {
  const [commissions, programs, search] = await Promise.all([data.commissions, data.programs, data.searchParams]);
  if (!commissions) return <EarningsBalanceUnavailable />;
  if (commissions.earnings.length === 0 && commissions.totals.length === 0) return <EarningsBalanceEmpty />;

  const currency = currencyOf(commissions);
  const main = commissions.totals.find((total) => total.currency === currency) ?? zeroTotals(currency);
  const others = commissions.totals.filter((total) => total.currency !== currency);
  const filter = parseStatusFilter(search.status);
  const apps: Record<string, AppInfo> = Object.fromEntries(
    (programs ?? []).map((program) => [program.appId, { name: program.appName, logoUrl: program.logoUrl }]),
  );
  // When the programs can't be loaded, rows say "Program" rather than claiming the program is archived.
  const fallback = programs ? undefined : { name: "Program", logoUrl: null };
  for (const row of commissions.earnings) if (fallback && !apps[row.app_id]) apps[row.app_id] = fallback;

  return (
    <>
      <EarningsBalance totals={main} others={others} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Monthly commissions={commissions} currency={currency} />
        <Suspense fallback={<ByProgramSkeleton month={monthLabel(monthKey(new Date()), "long")} />}>
          <ProgramsThisMonth data={data} currency={currency} />
        </Suspense>
      </div>
      <CommissionHistory rows={filterByStatus(commissions.earnings, filter)} filter={filter} apps={apps} />
      <Statements statements={groupStatements(commissions.statements)} />
      {commissions.corrections.length ? <Corrections corrections={commissions.corrections} /> : null}
      {commissions.jobs.length || commissions.cases.length ? (
        <NeedsAttention jobs={commissions.jobs} cases={commissions.cases} />
      ) : null}
    </>
  );
}

function EarningsSkeleton() {
  return (
    <>
      <EarningsBalanceSkeleton />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <MonthlyEarningsSkeleton />
        <ByProgramSkeleton />
      </div>
      <Skeleton className="h-80 rounded-[20px]" />
    </>
  );
}

/**
 * The page awaits nothing: the queries start here and are awaited inside
 * <Suspense>, so the header and tabs show at once. A failed query shows
 * "—" or "Unavailable", never 0.
 */
export default function CreatorEarningsPage({ searchParams }: PageProps<"/creator/earnings">) {
  const viewer = requireViewer("/creator/earnings");
  const data: EarningsData = {
    commissions: settled(() => getCommissionWorkspace()),
    programs: viewer.then((current) => settled(() => listCreatorProgramMemberships(current.userId))),
    searchParams,
  };
  return (
    <>
      <PageHeader title="Earnings" description={DESCRIPTION} actions={<EarningsTabs />} />
      <div className="flex flex-col gap-6">
        <TestModeNote>Test mode. Amounts come from the sandbox and no real money moves.</TestModeNote>
        <Suspense fallback={<EarningsSkeleton />}>
          <EarningsBody data={data} />
        </Suspense>
      </div>
    </>
  );
}
