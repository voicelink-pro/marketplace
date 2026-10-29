export type MonthlyEstimate = {
  /** Paying customers, whole, so the figures shown multiply exactly. */
  customers: number;
  /** Monthly subscription revenue from those customers, whole dollars. */
  revenue: number;
  /** The creators' share of `revenue`, whole dollars. */
  commission: number;
  /** What the app keeps: `revenue` minus `commission`, so the two always add up. */
  kept: number;
};

/** Landing page estimate for one month of activity: customers times the plan price, split by the commission rate. */
export function estimateMonthly({
  newCustomers,
  price,
  commissionRate,
}: {
  newCustomers: number;
  price: number;
  commissionRate: number;
}): MonthlyEstimate {
  const customers = Math.round(newCustomers);
  const revenue = customers * price;
  const commission = Math.round(revenue * commissionRate);
  return { customers, revenue, commission, kept: revenue - commission };
}
