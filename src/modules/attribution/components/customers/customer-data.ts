/**
 * Pure helpers for the creator Customers pages: the short customer ID,
 * dates, sign-up counts, what each customer has earned you and the customer
 * timeline. Money stays in integer minor units; amounts in different
 * currencies are never summed together.
 */
import { byLargest, sumByCurrency } from "@/modules/programs/components/home/home-data";

/** "#7F3A9C21B04E": the first 12 hex digits of the referral id. Never a name or email. */
export function customerCode(id: string): string {
  return `#${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

const dayMonth = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "Oct 21", or "Oct 21, 2025" outside the year of `now` (UTC, like the commission months). */
export function shortDate(iso: string, now: Date): string {
  const date = new Date(iso);
  return (date.getUTCFullYear() === now.getUTCFullYear() ? dayMonth : fullDate).format(date);
}

/** "Oct 21, 2026". */
export function longDate(iso: string): string {
  return fullDate.format(new Date(iso));
}

/**
 * The attribution summary's `registrations` counts every attributed sign-up
 * (source link or code); `code_registrations` is the code part of it.
 */
export function signupCounts(summary: { registrations: number; code_registrations: number }) {
  return {
    total: summary.registrations,
    fromLinks: summary.registrations - summary.code_registrations,
    byCode: summary.code_registrations,
  };
}

/** The list's page from `?page=`, within the range the query accepts. */
export function parsePage(value: unknown): number {
  const page = typeof value === "string" ? Math.floor(Number(value)) : 1;
  return Number.isFinite(page) ? Math.max(1, Math.min(200, page)) : 1;
}

/** The Customers URL for a program filter and a page; defaults are left out. */
export function customersHref(program: string | null, page = 1): string {
  const params = new URLSearchParams();
  if (program) params.set("program", program);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/creator/referrals?${query}` : "/creator/referrals";
}

/** The fields of a commission workspace earning these pages read. */
export type CustomerEarningRow = {
  id: string;
  referral_id: string;
  plan_name: string;
  billing_interval: string;
  currency: string;
  occurred_at: string;
  sale_minor: string;
  net_creator: string;
  bucket: string;
};

export type Amount = { currency: string; minor: string };

/**
 * `payments` and `earned` are null when unknown: the earnings list was cut
 * off before this customer's sign-up and none of theirs made it in.
 * `partial` marks a count that may miss older payments.
 */
export type CustomerEarnings = { payments: number | null; earned: Amount[] | null; partial: boolean };

/** The commission workspace returns at most this many earnings, newest first. */
export const EARNINGS_LIMIT = 100;

/**
 * Payments and net commission per customer (referral id). `earnings` is the
 * workspace's list, which holds only the latest EARNINGS_LIMIT payments. When
 * it is full, everything after its oldest payment is in it, so a customer who
 * signed up later is complete; for one who signed up earlier, older payments
 * may be missing: a count is a lower bound and "none" is unknown.
 */
export function earningsForCustomers(
  earnings: Pick<CustomerEarningRow, "referral_id" | "currency" | "net_creator" | "occurred_at">[],
  customers: { id: string; registered_at: string }[],
  limit = EARNINGS_LIMIT,
): Map<string, CustomerEarnings> {
  const groups = new Map<string, typeof earnings>();
  for (const row of earnings) {
    const rows = groups.get(row.referral_id);
    if (rows) rows.push(row);
    else groups.set(row.referral_id, [row]);
  }
  const cutoff =
    earnings.length >= limit ? Math.min(...earnings.map((row) => Date.parse(row.occurred_at))) : -Infinity;
  return new Map(
    customers.map((customer): [string, CustomerEarnings] => {
      const rows = groups.get(customer.id) ?? [];
      const complete = Date.parse(customer.registered_at) > cutoff;
      if (rows.length === 0 && !complete) return [customer.id, { payments: null, earned: null, partial: true }];
      return [customer.id, { payments: rows.length, earned: byLargest(sumByCurrency(rows)), partial: !complete }];
    }),
  );
}

/** Earnings sorted newest first (the workspace already does; this doesn't rely on it). */
export function newestFirst<T extends { occurred_at: string }>(rows: T[]): T[] {
  return rows.toSorted((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));
}

/** A row of the customer payment timeline (payment events, not commissions). */
export type PaymentEvent = {
  event_id: string;
  kind: string;
  state: string | null;
  occurred_at: string;
  amount_minor: string | null;
  currency: string | null;
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: "Subscription active",
  trialing: "Trial started",
  past_due: "Payment overdue",
  cancel_scheduled: "Cancellation scheduled",
  canceled: "Subscription canceled",
  expired: "Subscription ended",
  paused: "Subscription paused",
};

const REFUND_LABELS: Record<string, string> = {
  pending: "Refund requested",
  succeeded: "Refunded",
  failed: "Refund failed",
  reversed: "Refund reversed",
};

const DISPUTE_LABELS: Record<string, string> = {
  open: "Dispute opened",
  won: "Dispute won",
  lost: "Dispute lost",
};

/** A readable line for a payment event's kind and state. */
export function eventLabel(kind: string, state: string | null): string {
  if (kind === "purchase") return "Payment";
  if (kind === "renewal") return "Renewal";
  if (kind === "subscription") return SUBSCRIPTION_LABELS[state ?? ""] ?? "Subscription updated";
  if (kind === "refund") return REFUND_LABELS[state ?? ""] ?? "Refund";
  if (kind === "dispute") return DISPUTE_LABELS[state ?? ""] ?? "Dispute";
  return "Payment update";
}

export type TimelineItem =
  | { type: "payment"; key: string; at: string; earning: CustomerEarningRow }
  | { type: "event"; key: string; at: string; kind: string; label: string; amount: Amount | null }
  | { type: "signup"; key: string; at: string; source: string };

/**
 * Commissions and payment events, newest first, then the sign-up. A purchase
 * or renewal event at the same moment as a commission is that commission's
 * payment, so it is shown once, as the commission.
 */
export function customerTimeline(
  earnings: CustomerEarningRow[],
  events: PaymentEvent[],
  signup: { id: string; registered_at: string; source: string },
): TimelineItem[] {
  const paidAt = new Set(earnings.map((row) => Date.parse(row.occurred_at)));
  const items: TimelineItem[] = [
    ...earnings.map((earning) => ({ type: "payment" as const, key: earning.id, at: earning.occurred_at, earning })),
    ...events
      .filter(
        (event) => !((event.kind === "purchase" || event.kind === "renewal") && paidAt.has(Date.parse(event.occurred_at))),
      )
      .map((event) => ({
        type: "event" as const,
        key: event.event_id,
        at: event.occurred_at,
        kind: event.kind,
        label: eventLabel(event.kind, event.state),
        amount:
          event.amount_minor !== null && event.currency ? { minor: event.amount_minor, currency: event.currency } : null,
      })),
  ];
  return [
    ...items.toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    { type: "signup", key: `signup-${signup.id}`, at: signup.registered_at, source: signup.source },
  ];
}
