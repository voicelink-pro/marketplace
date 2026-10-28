import { MousePointerClick, Percent, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicEnv } from "@/lib/env";
import { formatMinorCurrency } from "@/lib/money";
import { requireViewer, type Viewer } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getAttributionSummary, listCustomerReferrals } from "@/modules/attribution/queries";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getFinanceWorkspace } from "@/modules/finance/queries";
import { getPaymentMetrics } from "@/modules/payments/queries";
import {
  BalanceCard,
  BalanceSkeleton,
  BalanceUnavailable,
} from "@/modules/programs/components/home/balance-card";
import { CardTitle, HomeCard, Unavailable } from "@/modules/programs/components/home/card";
import {
  EarningsCard,
  EarningsSkeleton,
  EarningsUnavailable,
} from "@/modules/programs/components/home/earnings-card";
import { GetStarted, GetStartedSkeleton } from "@/modules/programs/components/home/get-started";
import { RememberSetupDone } from "@/modules/programs/components/home/get-started-hide";
import {
  firstName,
  GreetingFrame,
  GreetingSkeleton,
  GreetingText,
  stepsLeftLine,
} from "@/modules/programs/components/home/greeting";
import {
  byLargest,
  lastMonths,
  mainCurrency,
  mergeActivity,
  monthKey,
  monthLabel,
  monthlyTotals,
  monthOverMonth,
  openStepCount,
  percentOf,
  relativeTime,
  type SetupDone,
  sumByCurrency,
} from "@/modules/programs/components/home/home-data";
import {
  type ProgramCardData,
  ProgramCards,
  ProgramCardsSkeleton,
  ProgramCardsUnavailable,
} from "@/modules/programs/components/home/program-cards";
import {
  type ActivityItem,
  RecentActivity,
  RecentActivitySkeleton,
  RecentActivityUnavailable,
} from "@/modules/programs/components/home/recent-activity";
import {
  ResultsStrip,
  ResultValue,
  ResultValueSkeleton,
} from "@/modules/programs/components/home/results-strip";
import {
  SimilarApps,
  SimilarAppsSkeleton,
  SimilarAppsUnavailable,
} from "@/modules/programs/components/home/similar-apps";
import { TopLinks, TopLinksSkeleton, TopLinksUnavailable } from "@/modules/programs/components/home/top-links";
import {
  type CreatorProgramSummary,
  listCreatorProgramMemberships,
  listSimilarAppsForCreator,
} from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Home" };

type Settled<T> = Promise<T | undefined>;
type Attribution = Awaited<ReturnType<typeof getAttributionSummary>>;
type Commissions = Awaited<ReturnType<typeof getCommissionWorkspace>>;
type Finance = Awaited<ReturnType<typeof getFinanceWorkspace>>;
type Payments = Awaited<ReturnType<typeof getPaymentMetrics>>;
type Referrals = Awaited<ReturnType<typeof listCustomerReferrals>>;

/** Everything the page reads, started once and awaited only inside each card's <Suspense>. */
type HomeData = {
  viewer: Promise<Viewer>;
  programs: Settled<CreatorProgramSummary[]>;
  attribution: Settled<Attribution>;
  commissions: Settled<Commissions>;
  finance: Settled<Finance>;
  payments: Settled<Payments>;
  referrals: Settled<Referrals>;
};

const format = (minor: bigint | string, currency: string) => formatMinorCurrency(minor, currency);

/** One formatted line per currency of a commission total; EUR 0 before the first one. */
function perCurrency(commissions: Commissions, field: "accrued_this_month" | "paid"): string[] {
  if (commissions.totals.length === 0) return [format(0n, "EUR")];
  return commissions.totals.map((total) => format(total[field], total.currency));
}

/** Undefined when a query the steps need failed. */
async function loadSetup({ viewer, programs, attribution }: HomeData): Promise<SetupDone | undefined> {
  const [{ creator }, list, summary] = await Promise.all([viewer, programs, attribution]);
  if (!list) return undefined;
  return {
    social: (creator?.socialLinkCount ?? 0) > 0,
    join: list.length > 0,
    // Joining creates the default link; a named one is any other.
    link: list.some((program) => program.links.some((link) => !link.isDefault)),
    // Unknown clicks keep the step open rather than hiding the card.
    click: (summary?.clicks ?? 0) > 0,
  };
}

async function Greeting({ data }: { data: HomeData }) {
  const [viewer, setup, commissions] = await Promise.all([data.viewer, loadSetup(data), data.commissions]);
  const name = firstName(viewer.displayName);
  const open = setup ? openStepCount(setup) : 0;
  if (open > 0) return <GreetingText title={`Let's get started, ${name}`} subtitle={stepsLeftLine(open)} />;

  let subtitle = "Here's how your links are doing.";
  const change = commissions ? monthOverMonth(commissions.earnings, new Date()) : null;
  if (change) {
    const difference = change.current - change.previous;
    const month = monthLabel(change.previousMonth, "long");
    const amount = formatMinorCurrency(difference < 0n ? -difference : difference, change.currency);
    subtitle =
      difference === 0n
        ? `You earned the same as in ${month}.`
        : `You earned ${amount} ${difference > 0n ? "more" : "less"} than in ${month}.`;
  }
  return <GreetingText title={`Welcome back, ${name}`} subtitle={subtitle} />;
}

/** Shown only while a step is open; once all are done, the browser remembers to skip the placeholder. */
async function GetStartedCards({ data }: { data: HomeData }) {
  const [viewer, setup, programs] = await Promise.all([data.viewer, loadSetup(data), data.programs]);
  if (!setup || !programs) {
    return (
      <HomeCard titleId="get-started-heading">
        <CardTitle id="get-started-heading">Get started</CardTitle>
        <Unavailable />
      </HomeCard>
    );
  }
  if (openStepCount(setup) === 0) return <RememberSetupDone />;
  return (
    <GetStarted
      done={setup}
      programs={programs}
      host={new URL(getPublicEnv().NEXT_PUBLIC_SITE_URL).host}
      storageKey={`boostlink:hide-get-started:${viewer.userId}`}
    />
  );
}

/** This month's commission, and six months of net commission in the main currency. */
async function Earnings({ data }: { data: HomeData }) {
  const commissions = await data.commissions;
  if (!commissions) return <EarningsUnavailable />;
  const now = new Date();
  const months = lastMonths(now, 6);
  const labels = months.map((key) => monthLabel(key));

  let chart: React.ComponentProps<typeof EarningsCard>["chart"] = null;
  const currency = mainCurrency(commissions.earnings);
  if (currency) {
    const totals = monthlyTotals(commissions.earnings, currency, months);
    if (totals.some((total) => total !== 0n)) {
      chart = {
        // Plotted only: minor units of one currency, far below 2^53.
        points: totals.map((total, index) => ({ month: labels[index], value: Number(total) })),
        callout: `${labels.at(-1)} · ${format(totals.at(-1)!, currency)}`,
      };
    }
  }

  const change = monthOverMonth(commissions.earnings, now);
  let changeLabel: string | null = null;
  if (change) {
    const difference = change.current - change.previous;
    const sign = difference < 0n ? "−" : "+";
    changeLabel = `${sign}${format(difference < 0n ? -difference : difference, change.currency)} vs ${monthLabel(change.previousMonth)}`;
  }

  return (
    <EarningsCard
      amounts={perCurrency(commissions, "accrued_this_month")}
      change={changeLabel}
      months={labels}
      chart={chart}
    />
  );
}

/** Available from finance (as on Payouts); pending and paid from the commission totals. */
async function Balance({ data }: { data: HomeData }) {
  const [finance, commissions] = await Promise.all([data.finance, data.commissions]);
  if (!finance || !commissions) return <BalanceUnavailable />;
  const available = byLargest(finance.available.map((row) => ({ minor: row.available_minor, currency: row.currency })));
  const [primary = { minor: "0", currency: "EUR" }, ...others] = available;
  const amounts = [
    ...finance.available.map((row) => row.available_minor),
    ...commissions.totals.flatMap((total) => [total.accrued_this_month, total.paid]),
  ];
  return (
    <BalanceCard
      available={format(primary.minor, primary.currency)}
      otherAvailable={others.map((row) => format(row.minor, row.currency))}
      pending={perCurrency(commissions, "accrued_this_month")}
      unlockMonth={monthLabel(monthKey(new Date()), "long")}
      paid={perCurrency(commissions, "paid")}
      withdraw={BigInt(primary.minor) > 0n ? format(primary.minor, primary.currency) : null}
      empty={amounts.every((amount) => BigInt(amount) === 0n)}
    />
  );
}

const unavailableResult = <ResultValue value="—" caption="Unavailable" muted />;
const count = new Intl.NumberFormat("en");
const signupsOf = (summary: Attribution) => summary.registrations + summary.code_registrations;

async function ClicksResult({ data }: { data: HomeData }) {
  const summary = await data.attribution;
  if (!summary) return unavailableResult;
  return <ResultValue value={count.format(summary.clicks)} caption="On all your links" />;
}

async function SignupsResult({ data }: { data: HomeData }) {
  const summary = await data.attribution;
  if (!summary) return unavailableResult;
  const share = percentOf(signupsOf(summary), summary.clicks);
  return (
    <ResultValue
      value={count.format(signupsOf(summary))}
      caption={share ? `${share} of clicks` : "Via links and codes"}
    />
  );
}

async function PayingResult({ data }: { data: HomeData }) {
  const [summary, payments] = await Promise.all([data.attribution, data.payments]);
  if (!payments) return unavailableResult;
  const share = summary ? percentOf(payments.paying_customers, signupsOf(summary)) : null;
  return (
    <ResultValue
      value={count.format(payments.paying_customers)}
      caption={share ? `${share} of sign-ups` : "Customers who paid"}
    />
  );
}

/** Dash until there is a paying customer. */
async function ClickToPaidResult({ data }: { data: HomeData }) {
  const [summary, payments] = await Promise.all([data.attribution, data.payments]);
  if (!summary || !payments) return unavailableResult;
  const share = payments.paying_customers > 0 ? percentOf(payments.paying_customers, summary.clicks) : null;
  return share ? (
    <ResultValue value={share} caption="Clicks that became paying customers" />
  ) : (
    <ResultValue value="—" caption="After the first payment" muted />
  );
}

function Results({ data }: { data: HomeData }) {
  const cell = (Value: (props: { data: HomeData }) => Promise<React.ReactNode>) => (
    <Suspense fallback={<ResultValueSkeleton />}>
      <Value data={data} />
    </Suspense>
  );
  return (
    <ResultsStrip
      cells={[
        { icon: MousePointerClick, label: "Clicks", value: cell(ClicksResult) },
        { icon: UserPlus, label: "Sign-ups", value: cell(SignupsResult) },
        { icon: Users, label: "Paying customers", value: cell(PayingResult) },
        { icon: Percent, label: "Click to paid", value: cell(ClickToPaidResult) },
      ]}
    />
  );
}

/** The first two programs, each with its paying customers and this month's commission. */
async function Programs({ data }: { data: HomeData }) {
  const [programs, commissions] = await Promise.all([data.programs, data.commissions]);
  if (!programs) return <ProgramCardsUnavailable />;
  const thisMonth = monthKey(new Date());
  const cards: ProgramCardData[] = await Promise.all(
    programs.slice(0, 2).map(async (program) => {
      const payments = await settled(() => getPaymentMetrics(program.appId));
      const [earned] = byLargest(
        sumByCurrency(
          (commissions?.earnings ?? []).filter(
            (row) => row.app_id === program.appId && row.effective_month.startsWith(thisMonth),
          ),
        ),
      );
      return {
        program,
        paying: payments?.paying_customers ?? null,
        thisMonth: earned && BigInt(earned.minor) > 0n ? format(earned.minor, earned.currency) : null,
      };
    }),
  );
  return <ProgramCards programs={cards} total={programs.length} />;
}

/** Attribution links by clicks; each link's channel comes from the program memberships. */
async function TopLinksCard({ data }: { data: HomeData }) {
  const [summary, programs] = await Promise.all([data.attribution, data.programs]);
  if (!summary) return <TopLinksUnavailable />;
  const links = (programs ?? []).flatMap((program) => program.links);
  const channels = new Map(links.map((link) => [link.id, link.channel]));
  return (
    <TopLinks
      links={summary.links.map((link) => ({
        id: link.link_id,
        label: link.label,
        clicks: link.clicks,
        channel: channels.get(link.link_id) ?? null,
      }))}
      hasNamedLink={links.some((link) => !link.isDefault)}
    />
  );
}

function currencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency }).formatToParts(0).find((part) => part.type === "currency")
      ?.value ?? currency
  );
}

/** The latest six sign-ups (first page of referrals) and commissions, newest first. */
async function Activity({ data }: { data: HomeData }) {
  const [referrals, commissions, programs] = await Promise.all([data.referrals, data.commissions, data.programs]);
  if (!referrals || !commissions) return <RecentActivityUnavailable />;
  const now = new Date();
  const appNames = new Map((programs ?? []).map((program) => [program.appId, program.appName]));
  const items: ActivityItem[] = mergeActivity(referrals.rows, commissions.earnings, 6).map((event) => {
    const when = relativeTime(event.at, now);
    if (event.kind === "signup") {
      return {
        id: event.id,
        kind: "signup",
        title: `New sign-up via your ${event.source === "code" ? "code" : "link"}`,
        subtitle: `${event.appName} · ${when}`,
      };
    }
    const amount = BigInt(event.amount);
    return {
      id: event.id,
      kind: "commission",
      title: `Commission · ${appNames.get(event.appId) ?? "Archived program"} ${event.planName}`,
      subtitle: `Customer #${event.referralId.slice(0, 6).toUpperCase()} · ${when}`,
      amount: `${amount < 0n ? "−" : "+"}${format(amount < 0n ? -amount : amount, event.currency)}`,
      symbol: currencySymbol(event.currency),
    };
  });
  const first = programs?.[0];
  return <RecentActivity items={items} app={first ? { name: first.appName, logoUrl: first.logoUrl } : null} />;
}

/** Suggestions come from the categories of joined programs; without one there's nothing to load. */
async function SimilarAppsCard({ data }: { data: HomeData }) {
  const [{ userId }, programs] = await Promise.all([data.viewer, data.programs]);
  if (!programs) return <SimilarAppsUnavailable />;
  if (programs.length === 0) return <SimilarApps apps={[]} hasPrograms={false} />;
  const apps = await settled(() => listSimilarAppsForCreator(userId, 3));
  return apps ? <SimilarApps apps={apps} hasPrograms /> : <SimilarAppsUnavailable />;
}

/**
 * The page itself awaits nothing: every query starts here and is awaited
 * only inside the <Suspense> of the card that needs it, so navigating Home
 * shows the frame at once and each card streams in on its own. A failed
 * query (`settled` → undefined) shows "Unavailable" in its card only.
 */
export default function CreatorHomePage() {
  const viewer = requireViewer("/creator");
  const data: HomeData = {
    viewer,
    programs: viewer.then((current) => settled(() => listCreatorProgramMemberships(current.userId))),
    attribution: settled(() => getAttributionSummary()),
    commissions: settled(() => getCommissionWorkspace()),
    finance: settled(() => getFinanceWorkspace()),
    payments: settled(() => getPaymentMetrics()),
    referrals: settled(() => listCustomerReferrals(undefined, 1)),
  };

  return (
    <div className="flex flex-col gap-8">
      <GreetingFrame>
        <Suspense fallback={<GreetingSkeleton />}>
          <Greeting data={data} />
        </Suspense>
      </GreetingFrame>
      <Suspense fallback={<GetStartedSkeleton />}>
        <GetStartedCards data={data} />
      </Suspense>
      {/* Desktop rows: wide card in two thirds, narrow one beside it. Phones: one column in page order. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Suspense fallback={<EarningsSkeleton />}>
          <Earnings data={data} />
        </Suspense>
        <Suspense fallback={<BalanceSkeleton />}>
          <Balance data={data} />
        </Suspense>
      </div>
      <Results data={data} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Suspense fallback={<ProgramCardsSkeleton />}>
          <Programs data={data} />
        </Suspense>
        <Suspense fallback={<TopLinksSkeleton />}>
          <TopLinksCard data={data} />
        </Suspense>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Suspense fallback={<RecentActivitySkeleton />}>
          <Activity data={data} />
        </Suspense>
        <Suspense fallback={<SimilarAppsSkeleton />}>
          <SimilarAppsCard data={data} />
        </Suspense>
      </div>
    </div>
  );
}
