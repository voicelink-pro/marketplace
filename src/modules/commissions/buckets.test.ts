import { describe, expect, it } from "vitest";
import { bucketStatus } from "./buckets";

describe("commission bucket labels", () => {
  it("names every ledger bucket for creators", () => {
    expect(bucketStatus("accrued")).toEqual({ label: "Pending", tone: "muted" });
    expect(bucketStatus("unfunded")).toEqual({ label: "Awaiting funding", tone: "muted" });
    expect(bucketStatus("available")).toEqual({ label: "Available", tone: "available" });
    expect(bucketStatus("held")).toEqual({ label: "On hold", tone: "held" });
    expect(bucketStatus("in_payout")).toEqual({ label: "In payout", tone: "neutral" });
    expect(bucketStatus("paid")).toEqual({ label: "Paid", tone: "neutral" });
  });

  it("never shows a raw bucket name", () => {
    expect(bucketStatus("something_new")).toEqual({ label: "Processing", tone: "muted" });
  });
});
