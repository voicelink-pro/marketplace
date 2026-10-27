import { formatMinorCurrency } from "@/lib/money";
import { perCustomerMinor } from "./components/plan-rates";
import { APP_CATEGORIES, type AppCategory, type BillingInterval } from "./constants";
import type { CatalogAppCard, PublishedPlanRate } from "./queries";

/**
 * Pure helpers for the Discover layout on `/`. Everything here is derived from
 * what the catalog queries already return: commission rates, publish dates,
 * categories and plans. Nothing is estimated or invented.
 */

/** Below this many published apps the rows would repeat the grid: only Featured and All apps show. */
export const MIN_APPS_FOR_ROWS = 16;
/** A row appears only with at least this many items. */
export const MIN_ROW_ITEMS = 4;
export const MAX_ROW_ITEMS = 8;
export const FEATURED_MIN = 3;
export const FEATURED_MAX = 5;
const NEW_LISTING_DAYS = 14;

/** Highest max commission first; ties by higher minimum, then newest. */
export function sortByCommission(apps: CatalogAppCard[]): CatalogAppCard[] {
  return [...apps].sort(
    (a, b) =>
      b.maxCommissionBps - a.maxCommissionBps ||
      b.minCommissionBps - a.minCommissionBps ||
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

/** "New" only means something while most of the catalog isn't. */
export function shouldMarkNew(newCount: number, total: number): boolean {
  return newCount < total / 2;
}

export function isNewListing(publishedAt: string, now: number): boolean {
  const published = Date.parse(publishedAt);
  return Number.isFinite(published) && now - published < NEW_LISTING_DAYS * 24 * 60 * 60 * 1000;
}

/** Categories with at least one app, in catalog order, with their app counts. */
export function countCategories(apps: CatalogAppCard[]): { category: AppCategory; count: number }[] {
  return APP_CATEGORIES.map((category) => ({
    category,
    count: apps.filter((app) => app.categories.includes(category)).length,
  })).filter((entry) => entry.count > 0);
}

/** Card details that need the app's plans. */
export type CardPlanInfo = {
  /** Billing intervals the app sells, in display order. */
  billing: BillingInterval[];
  /** "up to $7.80/mo per customer", or null when it can't be computed honestly. */
  perCustomer: string | null;
};

const BILLING_ORDER: BillingInterval[] = ["month", "year", "week"];
const SHORT_SUFFIX: Record<BillingInterval, string> = { month: "/mo", year: "/yr", week: "/wk" };

/**
 * Commission on one customer at list price, for the most common interval
 * (monthly, else annual, else weekly). Not converted between intervals, and
 * skipped when those plans use different currencies.
 */
export function cardPlanInfo(plans: PublishedPlanRate[]): CardPlanInfo {
  const billing = BILLING_ORDER.filter((interval) => plans.some((plan) => plan.billingInterval === interval));
  const interval = billing[0];
  if (!interval) return { billing, perCustomer: null };

  const candidates = plans.filter((plan) => plan.billingInterval === interval);
  const currency = candidates[0]!.currency;
  if (candidates.some((plan) => plan.currency !== currency)) return { billing, perCustomer: null };

  const best = candidates.map(perCustomerMinor).reduce((max, value) => (value > max ? value : max));
  const amount = `${formatMinorCurrency(best, currency)}${SHORT_SUFFIX[interval]} per customer`;
  return { billing, perCustomer: candidates.length > 1 ? `up to ${amount}` : amount };
}
