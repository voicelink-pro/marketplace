import { describe, expect, it } from "vitest";
import { estimateMonthly } from "./projection";

describe("estimateMonthly", () => {
  it("gives the creators defaults: 500,000 views at 0.05%, $19 at 30%", () => {
    const result = estimateMonthly({ newCustomers: (500_000 * 0.05) / 100, price: 19, commissionRate: 0.3 });
    expect(result.customers).toBe(250);
    expect(result.commission).toBe(1_425);
  });

  it("gives the apps defaults: 20 creators with 1 customer each, $39 at 20%", () => {
    const result = estimateMonthly({ newCustomers: 20 * 1, price: 39, commissionRate: 0.2 });
    expect(result).toEqual({ customers: 20, revenue: 780, commission: 156, kept: 624 });
  });

  it("returns zeros without customers", () => {
    expect(estimateMonthly({ newCustomers: 0, price: 19, commissionRate: 0.2 })).toEqual({
      customers: 0,
      revenue: 0,
      commission: 0,
      kept: 0,
    });
  });

  it("splits revenue into commission and kept without losing a dollar", () => {
    const result = estimateMonthly({ newCustomers: 7.4, price: 9, commissionRate: 0.3 });
    expect(result.customers).toBe(7);
    expect(result.commission + result.kept).toBe(result.revenue);
  });
});
