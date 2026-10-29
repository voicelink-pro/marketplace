/** Months the calculator projects; the result shows one bar per month. */
export const PROJECTION_MONTHS = 12;

export type Projection = {
  /** Paying customers at the end of each month, unrounded. */
  customers: number[];
  /** Monthly subscription revenue in the last month, whole dollars. */
  revenue: number;
  /** The creators' share of `revenue`, whole dollars. */
  commission: number;
  /** What the app keeps: `revenue` minus `commission`, so the two always add up. */
  kept: number;
};

/**
 * Landing page estimate. Each month adds `newPerMonth` customers after
 * `churn` (0-1) of the previous month's customers cancel; revenue is the
 * last month's customers times the plan price.
 */
export function projectEarnings({
  newPerMonth,
  churn,
  price,
  commissionRate,
}: {
  newPerMonth: number;
  churn: number;
  price: number;
  commissionRate: number;
}): Projection {
  const customers: number[] = [];
  let current = 0;
  for (let month = 0; month < PROJECTION_MONTHS; month++) {
    current = current * (1 - churn) + newPerMonth;
    customers.push(current);
  }

  const gross = current * price;
  const revenue = Math.round(gross);
  const commission = Math.round(gross * commissionRate);
  return { customers, revenue, commission, kept: revenue - commission };
}
