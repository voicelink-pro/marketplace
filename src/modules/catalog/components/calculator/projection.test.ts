import { describe, expect, it } from "vitest";
import { PROJECTION_MONTHS, projectEarnings } from "./projection";

describe("projectEarnings", () => {
  it("gives the creators defaults: 15 new customers a month, 8% churn, $19 at 20%", () => {
    const result = projectEarnings({ newPerMonth: 15, churn: 0.08, price: 19, commissionRate: 0.2 });
    expect(result.customers).toHaveLength(PROJECTION_MONTHS);
    expect(result.customers[0]).toBe(15);
    expect(Math.round(result.customers.at(-1)!)).toBe(119);
    expect(result.commission).toBe(451);
  });

  it("matches the apps mockup: 10 creators, 1 customer each, 6% churn, $39 at 20%", () => {
    const result = projectEarnings({ newPerMonth: 10, churn: 0.06, price: 39, commissionRate: 0.2 });
    expect(result.revenue).toBe(3407);
    expect(result.commission).toBe(681);
    expect(result.kept).toBe(2726);
  });

  it("adds every month's customers when nobody cancels", () => {
    const result = projectEarnings({ newPerMonth: 2, churn: 0, price: 10, commissionRate: 0.1 });
    expect(result.customers.at(-1)).toBe(24);
    expect(result.revenue).toBe(240);
    expect(result.commission).toBe(24);
  });

  it("returns zeros without new customers", () => {
    const result = projectEarnings({ newPerMonth: 0, churn: 0.08, price: 19, commissionRate: 0.2 });
    expect(result.customers.every((count) => count === 0)).toBe(true);
    expect(result).toMatchObject({ revenue: 0, commission: 0, kept: 0 });
  });
});
