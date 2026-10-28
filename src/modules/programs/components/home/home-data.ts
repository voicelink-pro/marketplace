/**
 * Pure helpers for the creator Home page: month buckets, the main currency,
 * month-over-month change, ratios and the activity feed. Money stays in
 * integer minor units (bigint); amounts in different currencies are never
 * summed together.
 */

/** The fields of a commission workspace earning that Home reads. */
export type EarningRow = {
  id: string;
  app_id: string;
  referral_id: string;
  plan_name: string;
  currency: string;
  occurred_at: string;
  effective_month: string;
  net_creator: string;
};

export type SignupRow = { id: string; app_id: string; source: string; registered_at: string; appName: string };

const monthName = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
const longMonthName = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" });

/** "2026-10" for any date in October 2026 (UTC, like the commission months). */
export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function keyToDate(key: string): Date {
  return new Date(`${key}-01T00:00:00Z`);
}

export function monthLabel(key: string, style: "short" | "long" = "short"): string {
  return (style === "short" ? monthName : longMonthName).format(keyToDate(key));
}

/** The last `count` month keys, oldest first, ending with the month of `now`. */
export function lastMonths(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - index), 1));
    return monthKey(date);
  });
}

/** The currency with the most earning rows; null without earnings. */
export function mainCurrency(earnings: Pick<EarningRow, "currency">[]): string | null {
  const counts = new Map<string, number>();
  for (const row of earnings) counts.set(row.currency, (counts.get(row.currency) ?? 0) + 1);
  let best: string | null = null;
  for (const [currency, count] of counts) if (best === null || count > counts.get(best)!) best = currency;
  return best;
}

/** Net creator commission per month key, in one currency. */
export function monthlyTotals(
  earnings: Pick<EarningRow, "currency" | "effective_month" | "net_creator">[],
  currency: string,
  months: string[],
): bigint[] {
  const totals = new Map(months.map((key) => [key, 0n]));
  for (const row of earnings) {
    const key = row.effective_month.slice(0, 7);
    if (row.currency === currency && totals.has(key)) totals.set(key, totals.get(key)! + BigInt(row.net_creator));
  }
  return months.map((key) => totals.get(key)!);
}

export type MonthOverMonth = { currency: string; current: bigint; previous: bigint; previousMonth: string };

/** This month against last month in the main currency; null when neither month has earnings. */
export function monthOverMonth(earnings: EarningRow[], now: Date): MonthOverMonth | null {
  const currency = mainCurrency(earnings);
  if (!currency) return null;
  const [previousMonth, currentMonth] = lastMonths(now, 2);
  const inMonths = earnings.filter((row) => {
    const key = row.effective_month.slice(0, 7);
    return row.currency === currency && (key === previousMonth || key === currentMonth);
  });
  if (inMonths.length === 0) return null;
  const [previous, current] = monthlyTotals(inMonths, currency, [previousMonth, currentMonth]);
  return { currency, current, previous, previousMonth };
}

const percentFormat = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });

/** "7.5%"; null when the whole is zero (the ratio isn't defined yet). */
export function percentOf(part: number, whole: number): string | null {
  return whole > 0 ? percentFormat.format(part / whole) : null;
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

/** "5 minutes ago", "yesterday", or a short date after a week. */
export function relativeTime(iso: string, now: Date): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), "day");
  return shortDate.format(new Date(iso));
}

export type ActivityEvent =
  | { kind: "signup"; id: string; at: string; appId: string; appName: string; source: string }
  | { kind: "commission"; id: string; at: string; appId: string; planName: string; referralId: string; amount: string; currency: string };

/** Sign-ups and commissions, newest first. */
export function mergeActivity(signups: SignupRow[], earnings: EarningRow[], limit: number): ActivityEvent[] {
  const events: ActivityEvent[] = [
    ...signups.map((row) => ({
      kind: "signup" as const,
      id: row.id,
      at: row.registered_at,
      appId: row.app_id,
      appName: row.appName,
      source: row.source,
    })),
    ...earnings.map((row) => ({
      kind: "commission" as const,
      id: row.id,
      at: row.occurred_at,
      appId: row.app_id,
      planName: row.plan_name,
      referralId: row.referral_id,
      amount: row.net_creator,
      currency: row.currency,
    })),
  ];
  return events.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}

/** Net creator commission per currency, in minor units. */
export function sumByCurrency(rows: Pick<EarningRow, "currency" | "net_creator">[]): { currency: string; minor: string }[] {
  const totals = new Map<string, bigint>();
  for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0n) + BigInt(row.net_creator));
  return [...totals].map(([currency, minor]) => ({ currency, minor: String(minor) }));
}

/** The largest amount first; ties keep their order. */
export function byLargest<T extends { minor: string }>(amounts: T[]): T[] {
  return amounts.toSorted((a, b) => {
    const difference = BigInt(b.minor) - BigInt(a.minor);
    return difference > 0n ? 1 : difference < 0n ? -1 : 0;
  });
}

/**
 * Net commission in one month (optionally from one app), in the currency
 * with the largest total; null unless it is above zero.
 */
export function earnedInMonth(
  earnings: Pick<EarningRow, "app_id" | "currency" | "effective_month" | "net_creator">[],
  month: string,
  appId?: string,
): { currency: string; minor: string } | null {
  const rows = earnings.filter(
    (row) => row.effective_month.startsWith(month) && (appId === undefined || row.app_id === appId),
  );
  const [largest] = byLargest(sumByCurrency(rows));
  return largest && BigInt(largest.minor) > 0n ? largest : null;
}

/** Which Get started steps are complete, each ticked from the creator's own data. */
export type SetupDone = { social: boolean; join: boolean; link: boolean; click: boolean };

export function openStepCount(done: SetupDone): number {
  return Object.values(done).filter((value) => !value).length;
}

/** Set on <html> while the viewer has hidden Get started; the section hides itself with CSS. */
export const HIDDEN_ATTRIBUTE = "data-hide-get-started";

/**
 * Browser-level hint that the last viewer here had no Get started to show
 * (setup done or hidden). The page's placeholder reads it before painting, so
 * done creators never see a skeleton collapse and new ones never see the
 * section pop in. A wrong hint (another account) costs one shift.
 */
export const SKIP_ATTRIBUTE = "data-skip-get-started";
export const SKIP_KEY = "boostlink:get-started-skip";

/** Inline script: sets `attribute` on <html> when `storageKey` is in localStorage. Blocked storage leaves it unset. */
function attributeScript(storageKey: string, attribute: string): string {
  return `try{if(localStorage.getItem(${JSON.stringify(storageKey)}))document.documentElement.setAttribute(${JSON.stringify(attribute)},"")}catch(e){}`;
}

/** Runs as the streamed section is parsed, before it is shown, so a hidden section never flashes. */
export function hideScript(storageKey: string): string {
  return attributeScript(storageKey, HIDDEN_ATTRIBUTE);
}

export function skipScript(): string {
  return attributeScript(SKIP_KEY, SKIP_ATTRIBUTE);
}
