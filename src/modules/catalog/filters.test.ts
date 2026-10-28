import { describe, expect, it } from "vitest";
import {
  buildAppDetailHref,
  buildCatalogHref,
  DEFAULT_CATALOG_FILTERS,
  hasActiveCatalogFilters,
  parseCatalogFilters,
  resolveBackToCatalogHref,
} from "./filters";

describe("catalog URL filter parsing and navigation helpers", () => {
  it("parses valid filter parameters and maps commission to basis points", () => {
    const parsed = parseCatalogFilters({
      q: "  pulse  ",
      category: "fitness",
      commission: "20",
      platform: "ios",
      language: "pl",
      page: "3",
    });

    expect(parsed).toEqual({
      q: "pulse",
      category: "fitness",
      commission: "20",
      minCommissionBps: 2000,
      platform: "ios",
      language: "pl",
      page: 3,
    });
    expect(hasActiveCatalogFilters(parsed)).toBe(true);
  });

  it("ignores unknown or invalid filter values without throwing", () => {
    const parsed = parseCatalogFilters({
      category: "crypto-scam",
      commission: "99",
      platform: "playstation",
      language: "xx",
      page: "-2",
    });

    expect(parsed).toEqual(DEFAULT_CATALOG_FILTERS);
    expect(hasActiveCatalogFilters(parsed)).toBe(false);
  });

  it("resets page to 1 when changing a filter and preserves page when explicitly set", () => {
    const current = parseCatalogFilters({ category: "fitness", page: "2" });
    expect(buildCatalogHref(current, { platform: "ios" })).toBe("/?category=fitness&platform=ios");
    expect(buildCatalogHref(current, { page: 3 })).toBe("/?category=fitness&page=3");
    expect(buildCatalogHref(current, { category: null })).toBe("/");
  });

  it("keeps catalog links on the page given as base path", () => {
    const current = parseCatalogFilters({ q: "coach" });
    expect(buildCatalogHref(current, { page: 2 }, "/creator/discover")).toBe("/creator/discover?q=coach&page=2");
    expect(buildCatalogHref(current, { q: "" }, "/creator/discover")).toBe("/creator/discover");
  });

  it("preserves active filters in the app detail link and safely reconstructs the return link", () => {
    const filters = parseCatalogFilters({
      q: "coach",
      category: "fitness",
      commission: "15",
      platform: "ios",
      language: "en",
      page: "2",
    });

    const detailHref = buildAppDetailHref("pulse-coach", filters);
    expect(detailHref).toBe(
      "/apps/pulse-coach?from=q%3Dcoach%26category%3Dfitness%26commission%3D15%26platform%3Dios%26language%3Den%26page%3D2",
    );

    const fromParam = new URL(detailHref, "http://localhost:3000").searchParams.get("from") ?? "";
    expect(resolveBackToCatalogHref(fromParam)).toBe(
      "/?q=coach&category=fitness&commission=15&platform=ios&language=en&page=2",
    );
  });

  it("never produces an external URL from a tampered ?from= parameter", () => {
    expect(resolveBackToCatalogHref("https://evil.example.com")).toBe("/");
    expect(resolveBackToCatalogHref("//evil.example.com")).toBe("/");
    expect(resolveBackToCatalogHref("javascript:alert(1)")).toBe("/");
  });
});
