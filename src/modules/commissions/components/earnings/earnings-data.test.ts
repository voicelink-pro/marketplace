import { describe, expect, it } from "vitest";
import {
  balanceBreakdown,
  type BucketTotals,
  earningsHref,
  filterByStatus,
  groupStatements,
  monthYearLabel,
  parseStatusFilter,
  statusGroup,
} from "./earnings-data";

const totals = (values: Partial<BucketTotals>): BucketTotals => ({
  currency: "EUR",
  accrued: "0",
  awaiting_funding: "0",
  available: "0",
  held: "0",
  in_payout: "0",
  paid: "0",
  ...values,
});

describe("balance breakdown", () => {
  it("lists non-zero buckets in order and sizes the bar against everything earned", () => {
    const result = balanceBreakdown(totals({ paid: "12540", available: "8740", awaiting_funding: "1140", accrued: "12920" }));
    expect(result.earned).toBe(35340n);
    expect(result.rows.map((row) => row.key)).toEqual(["paid", "available", "awaiting_funding", "accrued"]);
    expect(result.rows.find((row) => row.key === "accrued")?.caption).toBe("Unlocks when the month closes");
    expect(result.bar).toEqual([
      { key: "paid", percent: 35.48 },
      { key: "available", percent: 24.73 },
      { key: "awaiting_funding", percent: 3.22 },
      { key: "accrued", percent: 36.55 },
    ]);
  });

  it("keeps the list but drops the bar when a correction makes a bucket negative", () => {
    const result = balanceBreakdown(totals({ paid: "1000", held: "-200", accrued: "500" }));
    expect(result.earned).toBe(1300n);
    expect(result.rows.map((row) => [row.key, row.minor])).toEqual([
      ["paid", 1000n],
      ["held", -200n],
      ["accrued", 500n],
    ]);
    expect(result.bar).toBeNull();
  });

  it("has no rows and no bar before anything is earned", () => {
    expect(balanceBreakdown(totals({}))).toEqual({ rows: [], earned: 0n, bar: null });
  });
});

describe("commission status filter", () => {
  const rows = ["accrued", "unfunded", "held", "available", "in_payout", "paid"].map((bucket) => ({ bucket }));

  it("groups buckets into pending, available and paid", () => {
    expect(rows.map((row) => statusGroup(row.bucket))).toEqual([
      "pending",
      "pending",
      "pending",
      "available",
      "paid",
      "paid",
    ]);
    expect(filterByStatus(rows, "pending").map((row) => row.bucket)).toEqual(["accrued", "unfunded", "held"]);
    expect(filterByStatus(rows, "available").map((row) => row.bucket)).toEqual(["available"]);
    expect(filterByStatus(rows, "paid").map((row) => row.bucket)).toEqual(["in_payout", "paid"]);
    expect(filterByStatus(rows, "all")).toHaveLength(6);
  });

  it("reads ?status= and builds its links", () => {
    expect(parseStatusFilter("paid")).toBe("paid");
    expect(parseStatusFilter("PAID")).toBe("all");
    expect(parseStatusFilter(undefined)).toBe("all");
    expect(earningsHref("all")).toBe("/creator/earnings");
    expect(earningsHref("pending")).toBe("/creator/earnings?status=pending");
  });
});

describe("monthly statements", () => {
  const statement = (month: string, currency: string, creator: string) => ({
    month,
    currency,
    sale_minor: "1900",
    gross_minor: "380",
    fee_minor: "38",
    creator_minor: creator,
  });

  it("sums apps per month and currency, newest month first", () => {
    const grouped = groupStatements([
      statement("2026-08-01", "EUR", "342"),
      statement("2026-09-01", "EUR", "342"),
      statement("2026-09-01", "EUR", "100"),
      statement("2026-09-01", "USD", "500"),
    ]);
    expect(grouped).toEqual([
      { month: "2026-09", currency: "EUR", sale: 3800n, gross: 760n, fee: 76n, creator: 442n },
      { month: "2026-09", currency: "USD", sale: 1900n, gross: 380n, fee: 38n, creator: 500n },
      { month: "2026-08", currency: "EUR", sale: 1900n, gross: 380n, fee: 38n, creator: 342n },
    ]);
    expect(monthYearLabel("2026-09")).toBe("September 2026");
  });
});
