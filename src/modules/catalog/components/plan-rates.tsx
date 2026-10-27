import { formatCommissionPercent, formatMinorCurrency, toMinorBigInt } from "@/lib/money";
import { cn } from "@/lib/utils";
import { BILLING_INTERVAL_SUFFIX, type BillingInterval } from "../constants";

export type PlanRate = {
  id: string;
  planName: string;
  billingInterval: BillingInterval;
  priceMinor: bigint;
  currency: string;
  commissionBps: number;
};

/**
 * Commission on one customer's payment at the plan's list price, in minor
 * units. Integer math only; rounds down so the figure never overstates.
 * Display-only: the real amount depends on the commission basis (P-02) and
 * the platform fee taken from it (W-31, P-01).
 */
export function perCustomerMinor(plan: Pick<PlanRate, "priceMinor" | "commissionBps">): bigint {
  return (toMinorBigInt(plan.priceMinor) * BigInt(plan.commissionBps)) / 10_000n;
}

export function PerCustomerAmount({ plan, className }: { plan: PlanRate; className?: string }) {
  return (
    <span className={cn("tabular text-xs text-muted-foreground", className)}>
      {formatMinorCurrency(perCustomerMinor(plan), plan.currency)} {BILLING_INTERVAL_SUFFIX[plan.billingInterval]} per customer
    </span>
  );
}

export function PerCustomerNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Per-customer amounts apply the rate to the plan’s list price, before the platform fee.
    </p>
  );
}

/** Phone layout for plan rate tables: one tile per plan, nothing to scroll sideways. */
export function PlanRateCards({ plans, className }: { plans: PlanRate[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {plans.map((plan) => (
        <li key={plan.id} className="flex flex-col gap-1.5 rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold">{plan.planName}</span>
            <span className="tabular shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {formatCommissionPercent(plan.commissionBps)} recurring
            </span>
          </div>
          <span className="tabular text-sm">
            {formatMinorCurrency(plan.priceMinor, plan.currency)}{" "}
            <span className="text-xs text-muted-foreground">
              {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
            </span>
          </span>
          <PerCustomerAmount plan={plan} className="text-sm text-foreground" />
        </li>
      ))}
    </ul>
  );
}
