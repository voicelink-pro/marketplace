import { describe, expect, it } from "vitest";
import {
  byLargest,
  earnedInMonth,
  type EarningRow,
  lastMonths,
  mainCurrency,
  mergeActivity,
  monthlyTotals,
  monthOverMonth,
  percentOf,
  relativeTime,
  sumByCurrency,
} from "./home-data";

function earning(month: string, net: string, currency = "EUR", occurredAt = `${month}-15T12:00:00Z`): EarningRow {
  return {
    id: `${month}-${net}-${currency}`,
    app_id: "app",
    referral_id: "ref",
    plan_name: "Pro",
    currency,
    occurred_at: occurredAt,
    effective_month: `${month}-01`,
    net_creator: net,
  };
}

const now = new Date("2026-10-28T10:00:00Z");

describe("creator Home data helpers", () => {
  it("lists the last months oldest first, across a year boundary", () => {
    expect(lastMonths(now, 6)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(lastMonths(new Date("2026-02-10T00:00:00Z"), 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });

  it("picks the currency with the most earnings and sums per month in minor units", () => {
    const rows = [earning("2026-09", "380"), earning("2026-10", "380"), earning("2026-10", "-120"), earning("2026-10", "999", "USD")];
    expect(mainCurrency(rows)).toBe("EUR");
    expect(mainCurrency([])).toBeNull();
    expect(monthlyTotals(rows, "EUR", ["2026-08", "2026-09", "2026-10"])).toEqual([0n, 380n, 260n]);
  });

  it("computes month over month only when one of the two months has earnings", () => {
    expect(monthOverMonth([earning("2026-10", "500"), earning("2026-09", "200")], now)).toEqual({
      currency: "EUR",
      current: 500n,
      previous: 200n,
      previousMonth: "2026-09",
    });
    expect(monthOverMonth([earning("2026-05", "500")], now)).toBeNull();
    expect(monthOverMonth([], now)).toBeNull();
  });

  it("formats ratios only when the whole is above zero", () => {
    expect(percentOf(186, 2480)).toBe("7.5%");
    expect(percentOf(0, 0)).toBeNull();
  });

  it("describes times relative to now", () => {
    expect(relativeTime("2026-10-28T08:00:00Z", now)).toBe("2 hours ago");
    expect(relativeTime("2026-10-27T09:00:00Z", now)).toBe("yesterday");
    expect(relativeTime("2026-10-01T09:00:00Z", now)).toBe("Oct 1");
  });

  it("merges sign-ups and commissions newest first, whatever the offset format", () => {
    const events = mergeActivity(
      [{ id: "s1", app_id: "app", source: "link", registered_at: "2026-10-28T09:00:00+00:00", appName: "Lexi" }],
      [earning("2026-10", "380", "EUR", "2026-10-28T09:30:00Z"), earning("2026-10", "100", "EUR", "2026-10-01T00:00:00Z")],
      2,
    );
    expect(events.map((event) => event.kind)).toEqual(["commission", "signup"]);
  });

  it("sums per currency, never across currencies", () => {
    expect(sumByCurrency([earning("2026-10", "380"), earning("2026-10", "-80"), earning("2026-10", "500", "USD")])).toEqual([
      { currency: "EUR", minor: "300" },
      { currency: "USD", minor: "500" },
    ]);
  });

  it("orders amounts by size without converting to floats", () => {
    expect(byLargest([{ minor: "5" }, { minor: "90071992547409930" }, { minor: "70" }]).map((a) => a.minor)).toEqual([
      "90071992547409930",
      "70",
      "5",
    ]);
  });

  it("takes one month's commission, per app when asked, and nothing at or below zero", () => {
    const rows = [
      earning("2026-10", "380"),
      { ...earning("2026-10", "120"), id: "other", app_id: "other" },
      earning("2026-09", "900"),
      earning("2026-10", "50", "USD"),
    ];
    expect(earnedInMonth(rows, "2026-10")).toEqual({ currency: "EUR", minor: "500" });
    expect(earnedInMonth(rows, "2026-10", "other")).toEqual({ currency: "EUR", minor: "120" });
    expect(earnedInMonth([earning("2026-10", "-80")], "2026-10")).toBeNull();
    expect(earnedInMonth(rows, "2026-11")).toBeNull();
  });
});
