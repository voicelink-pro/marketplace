import { describe, expect, it } from "vitest";
import {
  formatCommissionNumber,
  formatCommissionPercent,
  formatCommissionRange,
  formatMinorCurrency,
  toMinorBigInt,
} from "./money";

describe("money and commission rate formatting (integer minor units & basis points)", () => {
  describe("toMinorBigInt", () => {
    it("accepts bigint and safe integers and rejects floats", () => {
      expect(toMinorBigInt(1499n)).toBe(1499n);
      expect(toMinorBigInt(1499)).toBe(1499n);
      expect(toMinorBigInt("11900")).toBe(11900n);
      expect(() => toMinorBigInt(14.99)).toThrow(/integer/i);
      expect(() => toMinorBigInt("14.99")).toThrow(/integer/i);
    });
  });

  describe("formatMinorCurrency", () => {
    it("formats 2-decimal currencies from minor units without floats", () => {
      expect(formatMinorCurrency(1499n, "EUR")).toBe("€14.99");
      expect(formatMinorCurrency(11900, "EUR")).toBe("€119.00");
      expect(formatMinorCurrency(1900, "USD")).toBe("$19.00");
      expect(formatMinorCurrency(0, "EUR")).toBe("€0.00");
    });

    it("formats 0-decimal currencies accurately", () => {
      expect(formatMinorCurrency(1500n, "JPY")).toBe("¥1,500");
    });

    it("handles large bigint values beyond Number.MAX_SAFE_INTEGER", () => {
      expect(formatMinorCurrency(9007199254740993n, "EUR")).toBe("€90,071,992,547,409.93");
    });

    it("rejects invalid currency codes", () => {
      expect(() => formatMinorCurrency(100, "euro")).toThrow(/currency/i);
    });
  });

  describe("formatCommissionPercent and formatCommissionRange (W-07)", () => {
    it("formats integer and fractional basis points using integer math", () => {
      expect(formatCommissionNumber(1500)).toBe("15");
      expect(formatCommissionNumber(1250)).toBe("12.5");
      expect(formatCommissionNumber(1225)).toBe("12.25");
      expect(formatCommissionNumber(1005)).toBe("10.05");
      expect(formatCommissionPercent(2000)).toBe("20%");
      expect(formatCommissionPercent(1250)).toBe("12.5%");
    });

    it("shows a single rate when all plans share the same commission", () => {
      expect(formatCommissionRange(2000, 2000)).toBe("20% recurring");
      expect(formatCommissionRange(2500, 2500, "commission")).toBe("25% commission");
    });

    it("shows an explicit min–max range when plans have different rates (never 'up to')", () => {
      expect(formatCommissionRange(1500, 2500)).toBe("15–25% recurring");
      expect(formatCommissionRange(1250, 2000)).toBe("12.5–20% recurring");
    });

    it("rejects non-integer or inverted basis points", () => {
      expect(() => formatCommissionPercent(15.5)).toThrow(/basis points/i);
      expect(() => formatCommissionRange(2500, 1500)).toThrow(/range/i);
    });
  });
});
