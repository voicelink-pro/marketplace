import Link from "next/link";
import { SegmentedNav } from "@/components/layout/segmented-nav";
import { formatCommissionPercent, formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { customerCode, shortDate } from "@/modules/attribution/components/customers/customer-data";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { CardHeading, HomeCard } from "@/modules/programs/components/home/card";
import { BucketChip } from "../bucket-chip";
import {
  earningsHref,
  STATUS_FILTER_LABELS,
  STATUS_FILTERS,
  type StatusFilter,
} from "./earnings-data";

/** The fields of a commission workspace earning the history reads. */
export type HistoryRow = {
  id: string;
  app_id: string;
  referral_id: string;
  plan_name: string;
  currency: string;
  occurred_at: string;
  commission_bps: number;
  sale_minor: string;
  commission_basis_minor: string;
  platform_fee_minor: string;
  net_creator: string;
  bucket: string;
};

export type AppInfo = { name: string; logoUrl: string | null };

const FOCUS = "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const TH = "pb-2.5 pr-3 text-left text-xs font-semibold whitespace-nowrap text-muted-foreground last:pr-0";
const TD = "border-t py-3 pr-3 align-middle whitespace-nowrap last:pr-0";

/** How the original commission was worked out; the net can differ after refunds and disputes. */
function breakdown(row: HistoryRow): string {
  const money = (minor: string) => formatMinorCurrency(minor, row.currency);
  return `${formatCommissionPercent(row.commission_bps)} of ${money(row.commission_basis_minor)} − ${money(row.platform_fee_minor)} platform fee`;
}

function CustomerLink({ row, short = false }: { row: HistoryRow; short?: boolean }) {
  const code = customerCode(row.referral_id);
  return (
    <Link
      href={`/creator/referrals/${row.referral_id}`}
      aria-label={`Customer ${code}`}
      className={cn(FOCUS, "font-mono font-semibold underline-offset-4 hover:underline")}
    >
      {short ? `${code.slice(0, 7)}…` : code}
    </Link>
  );
}

function Table({ rows, apps, now }: { rows: HistoryRow[]; apps: Record<string, AppInfo>; now: Date }) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="tabular w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Date
            </th>
            <th scope="col" className={TH}>
              Customer
            </th>
            <th scope="col" className={TH}>
              Program · plan
            </th>
            <th scope="col" className={cn(TH, "text-right")}>
              Payment
            </th>
            <th scope="col" className={cn(TH, "text-right")}>
              You earn
            </th>
            <th scope="col" className={cn(TH, "text-right")}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const app = apps[row.app_id] ?? { name: "Archived program", logoUrl: null };
            return (
              <tr key={row.id}>
                <td className={cn(TD, "text-muted-foreground")}>{shortDate(row.occurred_at, now)}</td>
                <td className={TD}>
                  <CustomerLink row={row} />
                </td>
                <td className={cn(TD, "max-w-48")}>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      <AppLogo app={app} className="size-5 rounded-[6px] border-0 text-[11px]" />
                      <span className="truncate">{app.name}</span>
                    </span>
                    <span className="truncate pl-7 text-xs text-muted-foreground">{row.plan_name}</span>
                  </span>
                </td>
                <td className={cn(TD, "text-right text-muted-foreground")}>
                  {formatMinorCurrency(row.sale_minor, row.currency)}
                </td>
                <td className={cn(TD, "text-right font-extrabold")} title={breakdown(row)}>
                  {formatMinorCurrency(row.net_creator, row.currency)}
                  <span className="sr-only">: {breakdown(row)}</span>
                </td>
                <td className={cn(TD, "text-right")}>
                  <span className="inline-flex justify-end">
                    <BucketChip bucket={row.bucket} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Phones: plan · short ID, date · payment, and the amount with its status on the right. */
function Rows({ rows, now }: { rows: HistoryRow[]; now: Date }) {
  return (
    <ul className="flex flex-col sm:hidden">
      {rows.map((row) => (
        <li key={row.id} className="tabular flex items-center justify-between gap-3 border-t py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-bold">
              {row.plan_name} · <CustomerLink row={row} short />
            </span>
            <span className="truncate text-[13px] text-muted-foreground">
              {shortDate(row.occurred_at, now)} · {formatMinorCurrency(row.sale_minor, row.currency)} payment
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <b title={breakdown(row)}>{formatMinorCurrency(row.net_creator, row.currency)}</b>
            <BucketChip bucket={row.bucket} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const EMPTY: Record<StatusFilter, string> = {
  all: "No commission yet.",
  pending: "Nothing pending.",
  available: "Nothing available right now.",
  paid: "Nothing paid out yet.",
};

/** `rows` are already filtered; the filter links keep the page simple (no client state). */
export function CommissionHistory({
  rows,
  filter,
  apps,
}: {
  rows: HistoryRow[];
  filter: StatusFilter;
  apps: Record<string, AppInfo>;
}) {
  const now = new Date();
  return (
    <HomeCard titleId="history-heading" className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CardHeading
          id="history-heading"
          title="Commission history"
          note="One row per payment. Annual plans earn once a year."
        />
        <SegmentedNav
          label="Filter by status"
          items={STATUS_FILTERS.map((status) => ({
            key: status,
            href: earningsHref(status),
            label: STATUS_FILTER_LABELS[status],
            active: status === filter,
          }))}
        />
      </div>
      {rows.length ? (
        <>
          <Table rows={rows} apps={apps} now={now} />
          <Rows rows={rows} now={now} />
        </>
      ) : (
        <p className="border-t py-6 text-sm text-muted-foreground">{EMPTY[filter]}</p>
      )}
      <p className="border-t pt-3 text-[13px] text-muted-foreground">Latest 100 payments</p>
    </HomeCard>
  );
}
