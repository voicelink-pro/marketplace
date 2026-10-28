import { ArrowRight, CreditCard, Layers, Link2, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StatStrip, StatValue, StatValueSkeleton } from "@/components/layout/stat-strip";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { formatMinorCurrency } from "@/lib/money";
import { requireViewer } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getAttributionSummary } from "@/modules/attribution/queries";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getPaymentMetrics } from "@/modules/payments/queries";
import { HOME_CARD, Unavailable } from "@/modules/programs/components/home/card";
import { earnedInMonth, monthKey, monthLabel } from "@/modules/programs/components/home/home-data";
import { AddAppCard } from "@/modules/programs/components/home/program-cards";
import {
  MiniStatSkeleton,
  MiniStatValue,
  ProgramListCard,
  ProgramListCardSkeleton,
} from "@/modules/programs/components/program-list-card";
import { type CreatorProgramSummary, listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Programs" };

type Settled<T> = Promise<T | undefined>;
type Attribution = Awaited<ReturnType<typeof getAttributionSummary>>;
type Commissions = Awaited<ReturnType<typeof getCommissionWorkspace>>;
type Payments = Awaited<ReturnType<typeof getPaymentMetrics>>;

/** Everything the page reads, started once and awaited only inside each part's <Suspense>. */
type ProgramsData = {
  programs: Settled<CreatorProgramSummary[]>;
  commissions: Settled<Commissions>;
  payments: Settled<Payments>;
};

const count = new Intl.NumberFormat("en");
const unavailableStat = <StatValue value="—" caption="Unavailable" muted />;
const dash = <MiniStatValue value="—" muted />;

async function ProgramsStat({ data }: { data: ProgramsData }) {
  const programs = await data.programs;
  if (!programs) return unavailableStat;
  return (
    <StatValue
      value={count.format(programs.length)}
      caption={programs.length > 0 ? programs.map((program) => program.appName).join(", ") : "None yet"}
      muted={programs.length === 0}
    />
  );
}

async function PayingStat({ data }: { data: ProgramsData }) {
  const payments = await data.payments;
  if (!payments) return unavailableStat;
  return <StatValue value={count.format(payments.paying_customers)} caption="All time" />;
}

/** Net commission this month in the currency with the most; a dash until there is some. */
async function EarnedStat({ data }: { data: ProgramsData }) {
  const commissions = await data.commissions;
  if (!commissions) return unavailableStat;
  const month = monthKey(new Date());
  const earned = earnedInMonth(commissions.earnings, month);
  const caption = monthLabel(month, "long");
  return earned ? (
    <StatValue value={formatMinorCurrency(earned.minor, earned.currency)} caption={caption} />
  ) : (
    <StatValue value="—" caption={caption} muted />
  );
}

async function LinksStat({ data }: { data: ProgramsData }) {
  const programs = await data.programs;
  if (!programs) return unavailableStat;
  const links = programs.reduce((total, program) => total + program.links.length, 0);
  return <StatValue value={count.format(links)} caption="Plus one code per program" muted={links === 0} />;
}

function Overview({ data }: { data: ProgramsData }) {
  const cell = (Value: (props: { data: ProgramsData }) => Promise<React.ReactNode>) => (
    <Suspense fallback={<StatValueSkeleton />}>
      <Value data={data} />
    </Suspense>
  );
  return (
    <StatStrip
      ariaLabel="Programs overview"
      cells={[
        { icon: Layers, label: "Programs", value: cell(ProgramsStat) },
        { icon: CreditCard, label: "Paying customers", value: cell(PayingStat) },
        { icon: Wallet, label: "Earned this month", value: cell(EarnedStat) },
        { icon: Link2, label: "Links", value: cell(LinksStat) },
      ]}
    />
  );
}

async function CustomersValue({ payments }: { payments: Settled<Payments> }) {
  const metrics = await payments;
  if (!metrics) return dash;
  return <MiniStatValue value={count.format(metrics.paying_customers)} muted={metrics.paying_customers === 0} />;
}

async function ThisMonthValue({ commissions, appId }: { commissions: Settled<Commissions>; appId: string }) {
  const workspace = await commissions;
  const earned = workspace ? earnedInMonth(workspace.earnings, monthKey(new Date()), appId) : null;
  return earned ? <MiniStatValue value={formatMinorCurrency(earned.minor, earned.currency)} /> : dash;
}

async function ClicksValue({ attribution }: { attribution: Settled<Attribution> }) {
  const summary = await attribution;
  if (!summary) return dash;
  return <MiniStatValue value={count.format(summary.clicks)} muted={summary.clicks === 0} />;
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** One card per membership, each with its own results streaming in; the dashed card to add one closes the grid. */
async function ProgramGrid({ data }: { data: ProgramsData }) {
  const programs = await data.programs;
  if (!programs) {
    return (
      <div className={`${HOME_CARD} p-5 sm:p-6`}>
        <Unavailable />
      </div>
    );
  }
  if (programs.length === 0) {
    return (
      <EmptyModule
        icon={Layers}
        title="You haven’t joined a program yet"
        description="Programs you join appear here immediately with your referral link, referral code, and commission terms."
        className="rounded-[20px]"
      >
        <Button asChild variant="outline">
          <Link href="/">Browse apps</Link>
        </Button>
      </EmptyModule>
    );
  }
  const now = new Date();
  return (
    <section aria-label="Your programs" className={GRID}>
      {programs.map((program) => {
        const mini = (node: React.ReactNode) => <Suspense fallback={<MiniStatSkeleton />}>{node}</Suspense>;
        return (
          <ProgramListCard
            key={program.membershipId}
            program={program}
            now={now}
            stats={{
              customers: mini(<CustomersValue payments={settled(() => getPaymentMetrics(program.appId))} />),
              thisMonth: mini(<ThisMonthValue commissions={data.commissions} appId={program.appId} />),
              clicks: mini(<ClicksValue attribution={settled(() => getAttributionSummary(program.appId))} />),
            }}
          />
        );
      })}
      <AddAppCard />
    </section>
  );
}

function ProgramGridSkeleton() {
  return (
    <div aria-busy className={GRID}>
      <ProgramListCardSkeleton />
      <ProgramListCardSkeleton />
    </div>
  );
}

/**
 * The page itself awaits nothing: every query starts here and is awaited
 * only inside the <Suspense> that needs it, as on Home. A failed query
 * (`settled` → undefined) shows "—" or "Unavailable" in its place only.
 */
export default function CreatorProgramsPage() {
  const viewer = requireViewer("/creator/programs");
  const data: ProgramsData = {
    programs: viewer.then((current) => settled(() => listCreatorProgramMemberships(current.userId))),
    commissions: settled(() => getCommissionWorkspace()),
    payments: settled(() => getPaymentMetrics()),
  };

  return (
    <>
      <PageHeader
        title="Programs"
        description="Apps you promote, your codes and your terms."
        actions={
          <Button asChild>
            <Link href="/creator/discover">
              Find another app
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-8">
        <Overview data={data} />
        <Suspense fallback={<ProgramGridSkeleton />}>
          <ProgramGrid data={data} />
        </Suspense>
      </div>
    </>
  );
}
