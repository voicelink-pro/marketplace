import {
  CreditCard,
  Hash,
  KeyRound,
  Link2,
  type LucideIcon,
  Receipt,
  Repeat,
  ShieldAlert,
  Undo2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { StatusChip } from "@/components/layout/status-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionPercent, formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { BucketChip } from "@/modules/commissions/components/bucket-chip";
import { CardHeading, CardTitle, HOME_CARD, HomeCard } from "@/modules/programs/components/home/card";
import { type CustomerEarningRow, longDate, type TimelineItem } from "./customer-data";

/** The fields of the latest earning the Per payment card reads. */
export type PaymentSplit = CustomerEarningRow & {
  commission_bps: number;
  commission_basis_minor: string;
  gross_minor: string;
  platform_fee_minor: string;
  creator_minor: string;
};

/** Hash tile, the customer's short ID and a row of chips (status, program, sign-up). */
export function CustomerHeader({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <section className={cn(HOME_CARD, "flex items-center gap-4 p-5 sm:gap-[18px] sm:p-6")}>
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground sm:size-14">
        <Hash aria-hidden className="size-6" />
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-xl font-extrabold tracking-[-0.035em] sm:text-[26px]">
          Customer <span className="font-mono">{code}</span>
        </h1>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </section>
  );
}

export function PaidChip({ paid }: { paid: boolean }) {
  return paid ? (
    <StatusChip tone="neutral" dot>
      Paid
    </StatusChip>
  ) : (
    <StatusChip tone="muted">No payment yet</StatusChip>
  );
}

export const ChipSkeleton = () => <Skeleton className="h-6 w-20 rounded-full" />;

/** The program as a chip; a link to its page while the creator is still in it. */
export function ProgramChip({
  program,
}: {
  program: { appName: string; logoUrl: string | null; slug: string } | null;
}) {
  if (!program) return <StatusChip tone="muted">Archived program</StatusChip>;
  return (
    <Link
      href={`/creator/programs/${program.slug}`}
      className="rounded-full outline-none hover:[&>span]:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <StatusChip className="pl-1.5">
        <AppLogo app={{ name: program.appName, logoUrl: program.logoUrl }} className="size-4 rounded-[5px] border-0 text-[9px]" />
        {program.appName}
      </StatusChip>
    </Link>
  );
}

export function SignupChip({ source, registeredAt }: { source: string; registeredAt: string }) {
  const Icon = source === "code" ? KeyRound : Link2;
  return (
    <StatusChip>
      <Icon aria-hidden />
      Signed up via {source === "code" ? "code" : "link"} · {longDate(registeredAt)}
    </StatusChip>
  );
}

const EVENT_ICONS: Record<string, LucideIcon> = {
  purchase: CreditCard,
  renewal: CreditCard,
  subscription: Repeat,
  refund: Undo2,
  dispute: ShieldAlert,
};

function itemParts(item: TimelineItem): { icon: LucideIcon; title: string; detail: React.ReactNode; chip?: React.ReactNode } {
  if (item.type === "payment") {
    const { earning } = item;
    const money = (minor: string) => formatMinorCurrency(minor, earning.currency);
    return {
      icon: CreditCard,
      title: `Payment · ${earning.plan_name}`,
      detail: (
        <>
          {longDate(earning.occurred_at)} · {money(earning.sale_minor)} · You earn{" "}
          <b className="text-foreground">{money(earning.net_creator)}</b>
        </>
      ),
      chip: <BucketChip bucket={earning.bucket} />,
    };
  }
  if (item.type === "event") {
    const amount = item.amount ? ` · ${formatMinorCurrency(item.amount.minor, item.amount.currency)}` : "";
    return { icon: EVENT_ICONS[item.kind] ?? Receipt, title: item.label, detail: `${longDate(item.at)}${amount}` };
  }
  return {
    icon: UserPlus,
    title: "Signed up",
    detail: `${longDate(item.at)} · Via your ${item.source === "code" ? "code" : "link"}`,
  };
}

/** Newest first, joined by a 2px line; the sign-up closes the list. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => {
        const { icon: Icon, title, detail, chip } = itemParts(item);
        return (
          <li key={item.key} className="relative flex gap-3.5 pb-[18px] last:pb-0">
            {index < items.length - 1 ? (
              <span aria-hidden className="absolute top-9 bottom-0 left-[17px] w-0.5 bg-border" />
            ) : null}
            <span
              className={cn(
                "relative grid size-9 shrink-0 place-items-center rounded-full border text-muted-foreground",
                item.type === "payment" ? "bg-muted" : "bg-card",
              )}
            >
              <Icon aria-hidden className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-bold">{title}</span>
                {chip}
              </div>
              <span className="tabular text-[13px] text-muted-foreground">{detail}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TimelineFrame({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <HomeCard titleId="timeline-heading" busy={busy} className="gap-4 lg:col-span-2">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle id="timeline-heading">Timeline</CardTitle>
        <span className="text-[13px] text-muted-foreground">Newest first</span>
      </div>
      {children}
    </HomeCard>
  );
}

export function TimelineSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-[18px]">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex gap-3.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

const minus = (amount: string) => `−${amount}`;

/** One payment split into commission, fee and what the creator keeps; the numbers add up. */
function Split({ earning }: { earning: PaymentSplit }) {
  const money = (minor: string | bigint) => formatMinorCurrency(minor, earning.currency);
  const correction = BigInt(earning.net_creator) - BigInt(earning.creator_minor);
  const rows: [string, string, boolean?][] = [
    [earning.plan_name, money(earning.sale_minor)],
    ...(earning.commission_basis_minor === earning.sale_minor
      ? []
      : [["Counted for commission", money(earning.commission_basis_minor)] as [string, string]]),
    [`Your commission · ${formatCommissionPercent(earning.commission_bps)}`, money(earning.gross_minor)],
    ["Platform fee", minus(money(earning.platform_fee_minor)), true],
    // Refunds and lost disputes change what you keep after the payment.
    ...(correction === 0n
      ? []
      : [["Refunds and disputes", correction < 0n ? minus(money(-correction)) : money(correction), true] as [
          string,
          string,
          boolean,
        ]]),
  ];
  return (
    <dl className="tabular -mt-1 flex flex-col text-sm">
      {rows.map(([label, value, muted]) => (
        <div key={label} className="flex justify-between gap-3 border-t py-2.5 first:border-t-0">
          <dt className="min-w-0 text-muted-foreground">{label}</dt>
          <dd className={cn("shrink-0 font-bold", muted && "text-muted-foreground")}>{value}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-3 border-t py-2.5">
        <dt className="text-muted-foreground">You earn</dt>
        <dd className="text-lg font-extrabold tracking-[-0.02em]">{money(earning.net_creator)}</dd>
      </div>
    </dl>
  );
}

const INTERVALS = new Set(["week", "month", "year"]);

/** The latest payment's split. Undefined: the query failed; null: no payment yet. */
export function PerPaymentCard({ earning }: { earning: PaymentSplit | null | undefined }) {
  return (
    <HomeCard titleId="per-payment-heading" className="gap-3">
      <CardHeading
        id="per-payment-heading"
        title="Per payment"
        note={earning ? `Latest, ${longDate(earning.occurred_at)}` : undefined}
      />
      {earning === undefined ? (
        <p className="text-sm text-muted-foreground">Unavailable</p>
      ) : earning === null ? (
        <p className="text-sm text-muted-foreground">How each payment splits shows here after their first one.</p>
      ) : (
        <>
          <Split earning={earning} />
          {INTERVALS.has(earning.billing_interval) ? (
            <p className="text-[13px] text-muted-foreground">Every {earning.billing_interval} while they keep paying.</p>
          ) : null}
        </>
      )}
    </HomeCard>
  );
}

export function PerPaymentSkeleton() {
  return (
    <HomeCard titleId="per-payment-heading" busy className="gap-3">
      <CardTitle id="per-payment-heading">Per payment</CardTitle>
      <div aria-hidden className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </HomeCard>
  );
}

const STATUSES = [
  ["Pending", "until the month closes."],
  ["Available", "once the app has funded it. Withdraw on Payouts."],
  ["Paid", "after it reaches your bank."],
];

export function StatusesCard() {
  return (
    <HomeCard titleId="statuses-heading" className="gap-3">
      <CardTitle id="statuses-heading">Statuses</CardTitle>
      <ul className="flex flex-col gap-2.5 text-[13px] leading-normal text-muted-foreground">
        {STATUSES.map(([status, rule]) => (
          <li key={status} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <b className="text-foreground">{status}</b> {rule}
            </span>
          </li>
        ))}
      </ul>
    </HomeCard>
  );
}
