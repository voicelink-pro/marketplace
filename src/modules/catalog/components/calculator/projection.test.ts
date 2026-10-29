import { describe, expect, it } from "vitest";
import { estimateMonthly } from "./projection";

describe("estimateMonthly", () => {
  it("gives the creators defaults: 150,000 views at 0.05%, $19 at 20%", () => {
    const result = estimateMonthly({ newCustomers: (150_000 * 0.05) / 100, price: 19, commissionRate: 0.2 });
    expect(result.customers).toBe(75);
    expect(result.commission).toBe(285);
  });

  it("gives the apps defaults: 10 creators with 1 customer each, $39 at 20%", () => {
    const result = estimateMonthly({ newCustomers: 10 * 1, price: 39, commissionRate: 0.2 });
    expect(result).toEqual({ customers: 10, revenue: 390, commission: 78, kept: 312 });
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
