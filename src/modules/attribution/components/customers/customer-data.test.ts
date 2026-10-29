import { describe, expect, it } from "vitest";
import {
  customerCode,
  customersHref,
  type CustomerEarningRow,
  customerTimeline,
  earningsForCustomers,
  eventLabel,
  parsePage,
  type PaymentEvent,
  shortDate,
  signupCounts,
} from "./customer-data";

function earning(referral: string, net: string, occurredAt: string, currency = "EUR"): CustomerEarningRow {
  return {
    id: `${referral}-${occurredAt}-${currency}`,
    referral_id: referral,
    plan_name: "Pro Monthly",
    billing_interval: "month",
    currency,
    occurred_at: occurredAt,
    sale_minor: "1900",
    net_creator: net,
    bucket: "accrued",
  };
}

const customer = (id: string, registeredAt = "2026-08-01T00:00:00Z") => ({ id, registered_at: registeredAt });

describe("customer earnings grouping", () => {
  it("counts payments and sums net commission per customer, per currency", () => {
    const rows = [
      earning("a", "342", "2026-10-21T10:00:00Z"),
      earning("a", "342", "2026-09-21T10:00:00Z"),
      earning("a", "-342", "2026-09-22T10:00:00Z"),
      earning("a", "500", "2026-09-23T10:00:00Z", "USD"),
      earning("b", "3240", "2026-10-12T10:00:00Z"),
    ];
    const grouped = earningsForCustomers(rows, [customer("a"), customer("b"), customer("c")]);
    expect(grouped.get("a")).toEqual({
      payments: 4,
      earned: [
        { currency: "USD", minor: "500" },
        { currency: "EUR", minor: "342" },
      ],
      partial: false,
    });
    expect(grouped.get("b")).toEqual({ payments: 1, earned: [{ currency: "EUR", minor: "3240" }], partial: false });
    expect(grouped.get("c")).toEqual({ payments: 0, earned: [], partial: false });
  });

  it("marks customers older than a full list as partial or unknown", () => {
    const rows = [
      earning("new", "100", "2026-10-20T00:00:00Z"),
      earning("old", "100", "2026-10-10T00:00:00Z"),
      earning("old", "100", "2026-10-01T00:00:00Z"),
    ];
    const customers = [
      customer("new", "2026-10-05T00:00:00Z"),
      customer("old", "2026-01-01T00:00:00Z"),
      customer("quiet-new", "2026-10-02T00:00:00Z"),
      customer("quiet-old", "2026-02-01T00:00:00Z"),
    ];
    // A list of 3 with a limit of 3 is full: the oldest payment, Oct 1, is the cutoff.
    const grouped = earningsForCustomers(rows, customers, 3);
    expect(grouped.get("new")).toMatchObject({ payments: 1, partial: false });
    expect(grouped.get("old")).toMatchObject({ payments: 2, partial: true });
    expect(grouped.get("quiet-new")).toEqual({ payments: 0, earned: [], partial: false });
    expect(grouped.get("quiet-old")).toEqual({ payments: null, earned: null, partial: true });
    // Below the limit nothing is cut off.
    expect(earningsForCustomers(rows, customers, 4).get("quiet-old")).toEqual({
      payments: 0,
      earned: [],
      partial: false,
    });
  });
});

describe("customer page helpers", () => {
  it("shows a 12-digit uppercase ID", () => {
    expect(customerCode("7f3a9c21-b04e-4d2a-9c11-0e55a2f9d312")).toBe("#7F3A9C21B04E");
  });

  it("adds the year only outside the current one", () => {
    const now = new Date("2026-10-29T12:00:00Z");
    expect(shortDate("2026-10-21T09:00:00Z", now)).toBe("Oct 21");
    expect(shortDate("2025-12-31T23:00:00Z", now)).toBe("Dec 31, 2025");
  });

  it("splits sign-ups into links and codes without counting codes twice", () => {
    expect(signupCounts({ registrations: 186, code_registrations: 12 })).toEqual({
      total: 186,
      fromLinks: 174,
      byCode: 12,
    });
  });

  it("builds list URLs and reads the page", () => {
    expect(customersHref(null)).toBe("/creator/referrals");
    expect(customersHref("lexi-notes", 2)).toBe("/creator/referrals?program=lexi-notes&page=2");
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("999")).toBe(200);
  });

  it("labels payment events", () => {
    expect(eventLabel("subscription", "cancel_scheduled")).toBe("Cancellation scheduled");
    expect(eventLabel("refund", "succeeded")).toBe("Refunded");
    expect(eventLabel("dispute", "lost")).toBe("Dispute lost");
    expect(eventLabel("subscription", null)).toBe("Subscription updated");
    expect(eventLabel("something-new", null)).toBe("Payment update");
  });
});

describe("customer timeline", () => {
  const event = (id: string, kind: string, at: string, state: string | null = null): PaymentEvent => ({
    event_id: id,
    kind,
    state,
    occurred_at: at,
    amount_minor: "1900",
    currency: "EUR",
  });

  it("shows each payment once, newest first, with the sign-up last", () => {
    const earnings = [earning("a", "342", "2026-09-21T10:00:00Z"), earning("a", "342", "2026-10-21T10:00:00Z")];
    const events = [
      event("e1", "purchase", "2026-09-21T10:00:00.000Z"),
      event("e2", "subscription", "2026-09-21T10:00:00Z", "active"),
      event("e3", "renewal", "2026-10-21T10:00:00Z"),
      event("e4", "refund", "2026-10-25T08:00:00Z", "pending"),
      // A trial purchase earns nothing, so it stays as an event.
      event("e5", "purchase", "2026-08-21T10:00:00Z"),
    ];
    const items = customerTimeline(earnings, events, {
      id: "a",
      registered_at: "2026-08-20T10:00:00Z",
      source: "link",
    });
    expect(items.map((item) => (item.type === "event" ? item.label : item.type))).toEqual([
      "Refund requested",
      "payment",
      "payment",
      "Subscription active",
      "Payment",
      "signup",
    ]);
    expect(items[1]).toMatchObject({ type: "payment", at: "2026-10-21T10:00:00Z" });
  });
});
