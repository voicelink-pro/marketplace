import { CreditCard, MousePointerClick, Repeat, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StatStrip, StatValue, StatValueSkeleton } from "@/components/layout/stat-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { requireViewer } from "@/modules/accounts/viewer";
import {
  customerCode,
  customersHref,
  earningsForCustomers,
  parsePage,
  shortDate,
  signupCounts,
} from "@/modules/attribution/components/customers/customer-data";
import {
  type CustomerRow,
  CustomerRows,
  CustomerRowsSkeleton,
  NoCustomers,
  Pagination,
} from "@/modules/attribution/components/customers/customer-list";
import { FunnelCard, FunnelCardSkeleton, WhatCounts } from "@/modules/attribution/components/customers/side-cards";
import { settled } from "@/modules/attribution/components/result-metrics";
import { listCustomerReferrals } from "@/modules/attribution/queries";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getPaymentMetrics } from "@/modules/payments/queries";
import { HomeCard } from "@/modules/programs/components/home/card";
import { percentOf } from "@/modules/programs/components/home/home-data";
import { plural } from "@/modules/programs/components/links/link-data";
import { type AttributionSummary, loadAttribution } from "@/modules/programs/components/links/load-attribution";
import { ProgramFilter } from "@/modules/programs/components/links/program-filter";
import { type CreatorProgramSummary, listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Customers" };

const DESCRIPTION = "People who signed up through your links and codes.";

type Settled<T> = Promise<T | undefined>;
type Payments = Awaited<ReturnType<typeof getPaymentMetrics>>;
type Commissions = Awaited<ReturnType<typeof getCommissionWorkspace>>;
type Customers = Awaited<ReturnType<typeof listCustomerReferrals>>;

/** The selected program (or all) and its results, started once and awaited inside each part's <Suspense>. */
type CustomersData = {
  programs: CreatorProgramSummary[];
  selected: CreatorProgramSummary | undefined;
  attribution: Settled<AttributionSummary>;
  payments: Settled<Payments>;
  commissions: Settled<Commissions>;
  customers: Settled<Customers>;
};

const count = new Intl.NumberFormat("en");
const untracked = <StatValue value="—" caption="Tracking unavailable" muted />;
const unavailable = <StatValue value="—" caption="Unavailable" muted />;

async function SignupsStat({ data }: { data: CustomersData }) {
  const summary = await data.attribution;
  if (!summary) return untracked;
  const signups = signupCounts(summary);
  return (
    <StatValue
      value={count.format(signups.total)}
      caption={`${count.format(signups.fromLinks)} from links · ${count.format(signups.byCode)} by code`}
    />
  );
}

async function PayingStat({ data }: { data: CustomersData }) {
  const [payments, summary] = await Promise.all([data.payments, data.attribution]);
  if (!payments) return unavailable;
  const share = summary ? percentOf(payments.paying_customers, signupCounts(summary).total) : null;
  return (
    <StatValue
      value={count.format(payments.paying_customers)}
      caption={share ? `${share} of sign-ups` : "Customers who paid"}
    />
  );
}

async function PayingNowStat({ data }: { data: CustomersData }) {
  const payments = await data.payments;
  if (!payments) return unavailable;
  return <StatValue value={count.format(payments.active_paying_subscribers)} caption="Active subscriptions" />;
}

/** Dash until there is a paying customer (and a click to compare with). */
async function ClickToCustomerStat({ data }: { data: CustomersData }) {
  const [payments, summary] = await Promise.all([data.payments, data.attribution]);
  if (!payments || !summary) return unavailable;
  const share = payments.paying_customers > 0 ? percentOf(payments.paying_customers, summary.clicks) : null;
  if (!share) {
    const caption = payments.paying_customers > 0 ? "No clicks yet" : "After the first payment";
    return <StatValue value="—" caption={caption} muted />;
  }
  return (
    <StatValue
      value={share}
      caption={`${count.format(payments.paying_customers)} of ${plural(summary.clicks, "click")}`}
    />
  );
}

/** The strip's cells, shared with the page skeleton so the frame doesn't move when data arrives. */
const STAT_CELLS = [
  { icon: UserPlus, label: "Sign-ups", Value: SignupsStat },
  { icon: CreditCard, label: "Paying customers", Value: PayingStat },
  { icon: Repeat, label: "Paying now", Value: PayingNowStat },
  { icon: MousePointerClick, label: "Click to customer", Value: ClickToCustomerStat },
];

const scopeNote = (selected: CreatorProgramSummary | undefined) =>
  `All time, ${selected ? selected.appName : "all programs"}`;

function Overview({ data }: { data: CustomersData }) {
  return (
    <StatStrip
      ariaLabel={`Customer results, ${scopeNote(data.selected).toLowerCase()}`}
      cells={STAT_CELLS.map(({ icon, label, Value }) => ({
        icon,
        label,
        value: (
          <Suspense fallback={<StatValueSkeleton />}>
            <Value data={data} />
          </Suspense>
        ),
      }))}
    />
  );
}

/** One card from sm; on phones the rows are cards of their own, so the frame drops away. */
function ListCard({ toolbar, children }: { toolbar: React.ReactNode; children: React.ReactNode }) {
  return (
    <HomeCard
      titleId="customers-heading"
      className="gap-0 rounded-none border-0 bg-transparent p-0 sm:rounded-[20px] sm:border sm:bg-card sm:px-6 sm:pt-5 sm:pb-4 lg:col-span-2"
    >
      <h2 id="customers-heading" className="sr-only">
        Your customers
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5">{toolbar}</div>
      {children}
    </HomeCard>
  );
}

function Toolbar({ programs, selected }: Pick<CustomersData, "programs" | "selected">) {
  return (
    <>
      {programs.length > 1 ? (
        <ProgramFilter
          programs={programs.map(({ slug, appName }) => ({ slug, appName }))}
          selected={selected?.slug ?? null}
          hrefFor={(program) => customersHref(program)}
        />
      ) : (
        <span />
      )}
      <span className="text-[13px] text-muted-foreground">Newest first</span>
    </>
  );
}

async function CustomerList({ data, page }: { data: CustomersData; page: number }) {
  const [customers, commissions] = await Promise.all([data.customers, data.commissions]);
  if (!customers) {
    return <p className="py-6 text-sm text-muted-foreground">Customers are unavailable right now.</p>;
  }
  const program = data.selected?.slug ?? null;
  const pagination = (
    <Pagination
      page={customers.page}
      previous={customers.page > 1 ? customersHref(program, customers.page - 1) : null}
      next={customers.hasNext ? customersHref(program, customers.page + 1) : null}
    />
  );
  if (customers.rows.length === 0) {
    return page > 1 ? (
      <>
        <p className="py-6 text-sm text-muted-foreground">No more customers.</p>
        {pagination}
      </>
    ) : (
      <NoCustomers appName={data.selected?.appName} />
    );
  }

  // Payments and earnings come from the commission workspace, which returns
  // only the creator's latest 100 earnings (one per payment), not a count per
  // customer. Customers who signed up before the oldest of those may have
  // older payments missing: their count shows "+" and "none" shows "—".
  const earnings = commissions ? earningsForCustomers(commissions.earnings, customers.rows) : undefined;
  const programs = new Map(data.programs.map((item) => [item.appId, item]));
  const now = new Date();
  const rows: CustomerRow[] = customers.rows.map((row) => ({
    id: row.id,
    code: customerCode(row.id),
    appName: row.appName,
    logoUrl: programs.get(row.app_id)?.logoUrl ?? null,
    source: row.source,
    signedUp: shortDate(row.registered_at, now),
    earnings: earnings?.get(row.id),
  }));

  return (
    <>
      <CustomerRows rows={rows} withProgram={!data.selected} />
      {earnings ? null : (
        <p className="pt-3 text-[13px] text-muted-foreground">Payments and earnings are unavailable right now.</p>
      )}
      {pagination}
    </>
  );
}

async function Funnel({ data }: { data: CustomersData }) {
  const [summary, payments] = await Promise.all([data.attribution, data.payments]);
  return (
    <FunnelCard
      note={scopeNote(data.selected)}
      funnel={{
        clicks: summary?.clicks ?? null,
        signups: summary ? signupCounts(summary).total : null,
        paying: payments?.paying_customers ?? null,
      }}
    />
  );
}

/**
 * Programs decide the frame (filter, scope); the strip, the list and the
 * funnel stream into their own <Suspense>. A failed query shows "—" or a
 * short note in its place, never 0.
 */
async function CustomersContent({ searchParams }: Pick<PageProps<"/creator/referrals">, "searchParams">) {
  const [viewer, rawSearch] = await Promise.all([requireViewer("/creator/referrals"), searchParams]);
  const programs = await listCreatorProgramMemberships(viewer.userId);

  const slug = typeof rawSearch.program === "string" ? rawSearch.program.trim().toLowerCase() : "";
  // An unknown slug falls back to all programs.
  const selected = programs.find((program) => program.slug === slug);
  const page = parsePage(rawSearch.page);
  const appId = selected?.appId;
  const data: CustomersData = {
    programs,
    selected,
    attribution: loadAttribution(appId),
    payments: settled(() => getPaymentMetrics(appId)),
    commissions: settled(() => getCommissionWorkspace({ appId })),
    customers: settled(() => listCustomerReferrals(appId, page)),
  };

  return (
    <div className="flex flex-col gap-7">
      <Overview data={data} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <ListCard toolbar={<Toolbar programs={programs} selected={selected} />}>
          <Suspense fallback={<CustomerRowsSkeleton />}>
            <CustomerList data={data} page={page} />
          </Suspense>
        </ListCard>
        <div className="flex min-w-0 flex-col gap-4">
          <Suspense fallback={<FunnelCardSkeleton note={scopeNote(selected)} />}>
            <Funnel data={data} />
          </Suspense>
          <WhatCounts />
        </div>
      </div>
    </div>
  );
}

/** The strip and both columns, in the page's boxes. */
function CustomersSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-7">
      <StatStrip
        ariaLabel="Customer results"
        cells={STAT_CELLS.map(({ icon, label }) => ({ icon, label, value: <StatValueSkeleton /> }))}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <ListCard toolbar={<Skeleton className="h-9 w-56 rounded-full" />}>
          <CustomerRowsSkeleton />
        </ListCard>
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-64 rounded-[20px]" />
          <WhatCounts />
        </div>
      </div>
    </div>
  );
}

/** Synchronous like Home: the viewer, programs and search params are read below, inside <Suspense>. */
export default function CreatorCustomersPage({ searchParams }: PageProps<"/creator/referrals">) {
  return (
    <>
      <PageHeader title="Customers" description={DESCRIPTION} />
      <Suspense fallback={<CustomersSkeleton />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
