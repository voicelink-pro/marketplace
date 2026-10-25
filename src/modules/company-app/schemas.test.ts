import { describe, expect, it } from "vitest";
import {
  checkAppSubmissionReadiness,
  formatMinorToInput,
  parseMajorMoneyToMinor,
  parsePercentToBps,
} from "./schemas";

describe("company app and plan validation helpers (Stage 3)", () => {
  it("parses major currency strings to bigint minor units without floating-point drift", () => {
    expect(parseMajorMoneyToMinor("14.99", "EUR")).toEqual({ ok: true, minor: 1499n });
    expect(parseMajorMoneyToMinor("19", "USD")).toEqual({ ok: true, minor: 1900n });
    expect(parseMajorMoneyToMinor("19,5", "EUR")).toEqual({ ok: true, minor: 1950n });
    expect(parseMajorMoneyToMinor("1500", "JPY")).toEqual({ ok: true, minor: 1500n });
    expect(parseMajorMoneyToMinor("0", "EUR").ok).toBe(false);
    expect(parseMajorMoneyToMinor("14.999", "EUR").ok).toBe(false);
    expect(formatMinorToInput(1499n, "EUR")).toBe("14.99");
  });

  it("parses commission percentage strings into integer basis points", () => {
    expect(parsePercentToBps("15")).toEqual({ ok: true, bps: 1500 });
    expect(parsePercentToBps("12.5%")).toEqual({ ok: true, bps: 1250 });
    expect(parsePercentToBps("25.25")).toEqual({ ok: true, bps: 2525 });
    expect(parsePercentToBps("0.5").ok).toBe(false);
    expect(parsePercentToBps("95").ok).toBe(false);
  });

  it("evaluates submission readiness checklist accurately", () => {
    const incomplete = checkAppSubmissionReadiness({
      name: "My App",
      tagline: "Too short",
      description: "",
      categories: [],
      platforms: [],
      languages: [],
      websiteUrl: null,
      iosStoreUrl: null,
      androidStoreUrl: null,
      coverImageUrl: null,
      logoUrl: null,
      termsText: "",
      activePlanCount: 0,
    });
    expect(incomplete.readyToSubmit).toBe(false);

    const complete = checkAppSubmissionReadiness({
      name: "Orbit Habit",
      tagline: "Daily habit streaks and accountability groups.",
      description:
        "Orbit Habit helps individuals and teams build consistent routines across iOS and web.",
      categories: ["productivity"],
      platforms: ["ios", "web"],
      languages: ["en"],
      websiteUrl: "https://orbithabit.example.com",
      iosStoreUrl: null,
      androidStoreUrl: null,
      coverImageUrl: "/demo/cover-pulse.svg",
      logoUrl: "/demo/logo-pulse.svg",
      termsText: "20% recurring commission on all paid renewals.",
      activePlanCount: 2,
    });
    expect(complete.readyToSubmit).toBe(true);
  });
});
