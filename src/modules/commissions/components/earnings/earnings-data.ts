/**
 * Pure helpers for the creator Earnings page: where the balance sits (one
 * row and bar segment per ledger bucket), the commission history filter and
 * monthly statements grouped per month and currency. Money stays in integer
 * minor units (bigint); currencies are never summed together.
 */

/** One currency's commission totals from the workspace. */
export type BucketTotals = {
  currency: string;
  accrued: string;
  awaiting_funding: string;
  available: string;
  held: string;
  in_payout: string;
  paid: string;
};

export type BreakdownKey = "paid" | "in_payout" | "available" | "awaiting_funding" | "held" | "accrued";

export type BreakdownRow = { key: BreakdownKey; label: string; caption?: string; minor: bigint };

export type BarSegment = { key: BreakdownKey; percent: number };

/** The list order: money that has left first, money still on its way last. */
const ROWS: Omit<BreakdownRow, "minor">[] = [
  { key: "paid", label: "Paid out" },
  { key: "in_payout", label: "In payout" },
  { key: "available", label: "Available" },
  { key: "awaiting_funding", label: "Awaiting funding", caption: "The app hasn't funded it yet" },
  { key: "held", label: "On hold" },
  { key: "accrued", label: "Pending", caption: "Unlocks when the month closes" },
];

/**
 * Rows without the zero buckets, everything earned (the buckets' sum), and
 * the bar's segments. A negative bucket (a correction larger than what is
 * left there) can't be drawn as a share, so the bar is null and only the
 * list shows.
 */
export function balanceBreakdown(totals: BucketTotals): {
  rows: BreakdownRow[];
  earned: bigint;
  bar: BarSegment[] | null;
} {
  const all = ROWS.map((row) => ({ ...row, minor: BigInt(totals[row.key]) }));
  const earned = all.reduce((sum, row) => sum + row.minor, 0n);
  const rows = all.filter((row) => row.minor !== 0n);
  const drawable = earned > 0n && rows.every((row) => row.minor > 0n);
  return {
    rows,
    earned,
    // Display widths only, to two decimals of a percent.
    bar: drawable ? rows.map((row) => ({ key: row.key, percent: Number((row.minor * 10_000n) / earned) / 100 })) : null,
  };
}

export const STATUS_FILTERS = ["all", "pending", "available", "paid"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  pending: "Pending",
  available: "Available",
  paid: "Paid",
};

export function parseStatusFilter(value: unknown): StatusFilter {
  return STATUS_FILTERS.find((filter) => filter === value) ?? "all";
}

/** Not withdrawable yet (open month, unfunded or held), withdrawable, or on its way out / out. */
export function statusGroup(bucket: string): Exclude<StatusFilter, "all"> {
  if (bucket === "available") return "available";
  if (bucket === "in_payout" || bucket === "paid") return "paid";
  return "pending";
}

export function filterByStatus<T extends { bucket: string }>(rows: T[], filter: StatusFilter): T[] {
  return filter === "all" ? rows : rows.filter((row) => statusGroup(row.bucket) === filter);
}

/** The Earnings URL for a status filter; "all" is the default and left out. */
export function earningsHref(filter: StatusFilter): string {
  return filter === "all" ? "/creator/earnings" : `/creator/earnings?status=${filter}`;
}

export type StatementRow = {
  month: string;
  currency: string;
  sale_minor: string;
  gross_minor: string;
  fee_minor: string;
  creator_minor: string;
};

export type MonthStatement = {
  /** "2026-09". */
  month: string;
  currency: string;
  sale: bigint;
  gross: bigint;
  fee: bigint;
  creator: bigint;
};

/** One line per month and currency (statements come per app), newest month first. */
export function groupStatements(rows: StatementRow[]): MonthStatement[] {
  const groups = new Map<string, MonthStatement>();
  for (const row of rows) {
    const month = row.month.slice(0, 7);
    const key = `${month} ${row.currency}`;
    const group = groups.get(key) ?? { month, currency: row.currency, sale: 0n, gross: 0n, fee: 0n, creator: 0n };
    group.sale += BigInt(row.sale_minor);
    group.gross += BigInt(row.gross_minor);
    group.fee += BigInt(row.fee_minor);
    group.creator += BigInt(row.creator_minor);
    groups.set(key, group);
  }
  return [...groups.values()].toSorted(
    (a, b) => b.month.localeCompare(a.month) || a.currency.localeCompare(b.currency),
  );
}

const monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });

/** "September 2026" for "2026-09" (or a full date in that month). */
export function monthYearLabel(month: string): string {
  return monthYear.format(new Date(`${month.slice(0, 7)}-01T00:00:00Z`));
}
