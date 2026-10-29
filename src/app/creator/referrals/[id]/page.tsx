import { CalendarDays, CreditCard, Layers, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { StatStrip, StatValue, StatValueSkeleton } from "@/components/layout/stat-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import { formatMinorCurrency } from "@/lib/money";
import { requireViewer } from "@/modules/accounts/viewer";
import {
  ChipSkeleton,
  CustomerHeader,
  PaidChip,
  PerPaymentCard,
  PerPaymentSkeleton,
  ProgramChip,
  SignupChip,
  StatusesCard,
  Timeline,
  TimelineFrame,
  TimelineSkeleton,
} from "@/modules/attribution/components/customers/customer-detail";
import {
  customerCode,
  customerTimeline,
  EARNINGS_LIMIT,
  longDate,
  newestFirst,
  shortDate,
} from "@/modules/attribution/components/customers/customer-data";
import { settled } from "@/modules/attribution/components/result-metrics";
import { BILLING_INTERVAL_SUFFIX } from "@/modules/catalog/constants";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getCustomerPaymentTimeline } from "@/modules/payments/queries";
import { HOME_CARD } from "@/modules/programs/components/home/card";
import { byLargest, sumByCurrency } from "@/modules/programs/components/home/home-data";
import { type CreatorProgramSummary, listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Customer" };

type Settled<T> = Promise<T | undefined>;
type Earning = Awaited<ReturnType<typeof getCommissionWorkspace>>["earnings"][number];
type PaymentEvents = Awaited<ReturnType<typeof getCustomerPaymentTimeline>>;
type Customer = { id: string; app_id: string; source: string; registered_at: string };

/** The customer, and their results started once and awaited inside each part's <Suspense>. */
type CustomerData = {
  customer: Customer;
  /** Newest first. */
  earnings: Settled<Earning[]>;
  events: Settled<PaymentEvents>;
  programs: Settled<CreatorProgramSummary[]>;
};

const count = new Intl.NumberFormat("en");
const unavailable = <StatValue value="—" caption="Unavailable" muted />;
const noPayment = (value: string) => <StatValue value={value} caption="No payment yet" muted />;
const money = (row: Earning, minor: string) => formatMinorCurrency(minor, row.currency);

async function PaymentsStat({ data }: { data: CustomerData }) {
  const earnings = await data.earnings;
  if (!earnings) return unavailable;
  if (earnings.length === 0) return noPayment("0");
  // The workspace returns the latest EARNINGS_LIMIT payments; more than that reads as "100+".
  if (earnings.length >= EARNINGS_LIMIT) {
    return <StatValue value={`${count.format(earnings.length)}+`} caption={`Latest ${EARNINGS_LIMIT} shown`} />;
  }
  return (
    <StatValue value={count.format(earnings.length)} caption={`Since ${longDate(earnings.at(-1)!.occurred_at)}`} />
  );
}

/** Net commission per currency, never summed across currencies. */
async function EarnedStat({ data }: { data: CustomerData }) {
  const earnings = await data.earnings;
  if (!earnings) return unavailable;
  const [latest] = earnings;
  if (!latest) return noPayment("—");
  const totals = byLargest(sumByCurrency(earnings)).map((total) => formatMinorCurrency(total.minor, total.currency));
  return <StatValue value={totals.join(" · ")} caption={`${money(latest, latest.net_creator)} per payment`} />;
}

async function PlanStat({ data }: { data: CustomerData }) {
  const earnings = await data.earnings;
  if (!earnings) return unavailable;
  const [latest] = earnings;
  if (!latest) return noPayment("—");
  const suffix = BILLING_INTERVAL_SUFFIX[latest.billing_interval as keyof typeof BILLING_INTERVAL_SUFFIX];
  return (
    <StatValue
      value={latest.plan_name}
      caption={suffix ? `${money(latest, latest.sale_minor)} ${suffix}` : money(latest, latest.sale_minor)}
    />
  );
}

async function LastPaymentStat({ data }: { data: CustomerData }) {
  const earnings = await data.earnings;
  if (!earnings) return unavailable;
  const [latest] = earnings;
  if (!latest) return noPayment("—");
  return (
    <StatValue
      value={shortDate(latest.occurred_at, new Date())}
      caption={`${money(latest, latest.sale_minor)} · ${latest.plan_name}`}
    />
  );
}

/** The strip's cells, shared with the page skeleton. */
const STAT_CELLS = [
  { icon: CreditCard, label: "Payments", Value: PaymentsStat },
  { icon: Wallet, label: "You earned", Value: EarnedStat },
  { icon: Layers, label: "Plan", Value: PlanStat },
  { icon: CalendarDays, label: "Last payment", Value: LastPaymentStat },
];

function Overview({ data }: { data: CustomerData }) {
  return (
    <StatStrip
      ariaLabel="This customer's payments"
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

async function Status({ data }: { data: CustomerData }) {
  const earnings = await data.earnings;
  return earnings ? <PaidChip paid={earnings.length > 0} /> : null;
}

/** Left out when the programs can't be loaded; "Archived program" once the creator has left it. */
async function Program({ data }: { data: CustomerData }) {
  const programs = await data.programs;
  if (!programs) return null;
  return <ProgramChip program={programs.find((program) => program.appId === data.customer.app_id) ?? null} />;
}

async function TimelineBody({ data }: { data: CustomerData }) {
  const [earnings, events] = await Promise.all([data.earnings, data.events]);
  if (!earnings) return <p className="text-sm text-muted-foreground">Unavailable</p>;
  return (
    <>
      <Timeline items={customerTimeline(earnings, events ?? [], data.customer)} />
      {events ? null : (
        <p className="text-[13px] text-muted-foreground">Subscription and refund events are unavailable right now.</p>
      )}
    </>
  );
}

async function PerPayment({ data }: { data: CustomerData }) {
  const earnings = await data.earnings;
  return <PerPaymentCard earning={earnings ? (earnings[0] ?? null) : undefined} />;
}

/**
 * The ownership check comes first (it decides notFound); the payments and
 * the program start right after and stream into their own <Suspense>.
 */
async function CustomerDetail({ params }: Pick<PageProps<"/creator/referrals/[id]">, "params">) {
  const viewer = await requireViewer("/creator/referrals");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const row = await client
    .from("customer_referrals")
    .select("id,app_id,source,registered_at")
    .eq("id", id)
    .eq("creator_id", viewer.userId)
    .single();
  if (row.error || !row.data) notFound();

  const customer = row.data;
  const data: CustomerData = {
    customer,
    earnings: settled(() => getCommissionWorkspace({ customer: id })).then((workspace) =>
      workspace ? newestFirst(workspace.earnings) : undefined,
    ),
    events: settled(() => getCustomerPaymentTimeline(id, customer.app_id)),
    programs: settled(() => listCreatorProgramMemberships(viewer.userId)),
  };

  return (
    <div className="flex flex-col gap-7">
      <CustomerHeader code={customerCode(id)}>
        <Suspense fallback={<ChipSkeleton />}>
          <Status data={data} />
        </Suspense>
        <Suspense fallback={<ChipSkeleton />}>
          <Program data={data} />
        </Suspense>
        <SignupChip source={customer.source} registeredAt={customer.registered_at} />
      </CustomerHeader>
      <Overview data={data} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <TimelineFrame>
          <Suspense fallback={<TimelineSkeleton />}>
            <TimelineBody data={data} />
          </Suspense>
        </TimelineFrame>
        <div className="flex min-w-0 flex-col gap-4">
          <Suspense fallback={<PerPaymentSkeleton />}>
            <PerPayment data={data} />
          </Suspense>
          <StatusesCard />
        </div>
      </div>
    </div>
  );
}

/** Header, strip and both columns, in the page's boxes. */
function CustomerSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-7">
      <div className={`${HOME_CARD} flex items-center gap-4 p-5 sm:gap-[18px] sm:p-6`}>
        <Skeleton className="size-12 shrink-0 rounded-2xl sm:size-14" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-6 w-48 rounded-full" />
        </div>
      </div>
      <StatStrip
        ariaLabel="This customer's payments"
        cells={STAT_CELLS.map(({ icon, label }) => ({ icon, label, value: <StatValueSkeleton /> }))}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <TimelineFrame busy>
          <TimelineSkeleton />
        </TimelineFrame>
        <div className="flex min-w-0 flex-col gap-4">
          <PerPaymentSkeleton />
          <StatusesCard />
        </div>
      </div>
    </div>
  );
}

/** Synchronous like Home: the viewer, the id and the ownership check are read below, inside <Suspense>. */
export default function CustomerPage({ params }: PageProps<"/creator/referrals/[id]">) {
  return (
    <Suspense fallback={<CustomerSkeleton />}>
      <CustomerDetail params={params} />
    </Suspense>
  );
}
