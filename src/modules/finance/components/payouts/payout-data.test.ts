import { describe, expect, it } from "vitest";
import { canRetryBank, eventText, paidOutByCurrency, payoutStatus, payoutSteps, withdrawState } from "./payout-data";

const payout = (status: string, transfer: string | null = null, bank: string | null = null) => ({
  status,
  transfer_reference: transfer,
  bank_reference: bank,
});
const states = (row: ReturnType<typeof payout>) => payoutSteps(row).map((step) => step.state);

describe("payout steps", () => {
  it("maps each status to the transfer and bank steps", () => {
    expect(states(payout("requested"))).toEqual(["waiting", "waiting"]);
    expect(states(payout("requested", "PT-1"))).toEqual(["done", "waiting"]);
    expect(states(payout("transferred", "PT-1"))).toEqual(["done", "waiting"]);
    expect(states(payout("paid", "PT-1", "BK-1"))).toEqual(["done", "done"]);
    expect(states(payout("transfer_failed"))).toEqual(["failed", "waiting"]);
    expect(states(payout("bank_failed", "PT-1"))).toEqual(["done", "failed"]);
    expect(states(payout("returned", "PT-1", "BK-1"))).toEqual(["done", "failed"]);
    expect(payoutSteps(payout("paid")).map((step) => step.label)).toEqual(["Platform transfer", "Bank payout"]);
  });

  it("offers a bank retry only after a bank failure, up to 3 attempts", () => {
    expect(canRetryBank({ status: "bank_failed", bank_attempt: 1 })).toBe(true);
    expect(canRetryBank({ status: "returned", bank_attempt: 2 })).toBe(true);
    expect(canRetryBank({ status: "bank_failed", bank_attempt: 3 })).toBe(false);
    expect(canRetryBank({ status: "transfer_failed", bank_attempt: 0 })).toBe(false);
  });

  it("tints failures red and paid neutral", () => {
    expect(payoutStatus("bank_failed")).toEqual({ label: "Bank failed", tone: "held" });
    expect(payoutStatus("returned").tone).toBe("held");
    expect(payoutStatus("transfer_failed").tone).toBe("held");
    expect(payoutStatus("paid")).toEqual({ label: "Paid", tone: "neutral" });
    expect(payoutStatus("requested").tone).toBe("muted");
  });

  it("puts event codes into words", () => {
    expect(eventText("payout_requested")).toBe("Payout requested");
    expect(eventText("transfer_succeeded")).toBe("Transfer succeeded");
  });
});

describe("withdraw eligibility", () => {
  const account = { enabled: true, currency: "EUR", minimum_minor: "2000", fee_minor: "100" };

  it("needs an enabled account, something available, and the minimum after the fee", () => {
    expect(withdrawState("8740", account)).toEqual({ eligible: true, bank: 8640n });
    expect(withdrawState("8740", null)).toMatchObject({ eligible: false, reason: "no_account" });
    expect(withdrawState("8740", { ...account, enabled: false })).toMatchObject({ reason: "no_account" });
    expect(withdrawState("0", account)).toEqual({ eligible: false, bank: 0n, reason: "nothing_available" });
    expect(withdrawState("2099", account)).toEqual({ eligible: false, bank: 1999n, reason: "below_minimum" });
    expect(withdrawState("2100", account)).toEqual({ eligible: true, bank: 2000n });
  });

  it("sums only paid payouts, per currency", () => {
    expect(
      paidOutByCurrency([
        { status: "paid", currency: "EUR", amount_minor: "6840" },
        { status: "paid", currency: "EUR", amount_minor: "5700" },
        { status: "bank_failed", currency: "EUR", amount_minor: "4000" },
      ]),
    ).toEqual([{ currency: "EUR", minor: 12540n }]);
  });
});
