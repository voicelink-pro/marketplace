import { describe, expect, it } from "vitest";
import type { CreatorReferralLinkView } from "../../queries";
import { displayUrl, linkRows, parseSort, sharePath, sortLinkRows, windowPhrase } from "./link-data";

function link(id: string, isDefault = false): CreatorReferralLinkView {
  return {
    id,
    membershipId: "m",
    appId: "app",
    label: id,
    channel: "tiktok",
    destinationKind: "website",
    destinationLabel: "Product website",
    targetUrl: "https://app.example.com",
    token: id,
    shareUrl: `https://boostlink.example/r/${id}`,
    isDefault,
    createdAt: "2026-10-01T00:00:00Z",
  };
}

const programs = [
  { appName: "Lexi", slug: "lexi", logoUrl: null, links: [link("primary", true), link("tiktok"), link("video")] },
  { appName: "Tempo", slug: "tempo", logoUrl: null, links: [link("tempo-primary", true)] },
];

describe("link rows", () => {
  it("joins results by link id, 0 for links without a row, null when results failed", () => {
    const rows = linkRows(programs, [{ link_id: "tiktok", clicks: 12, registrations: 3 }]);
    expect(rows.map((row) => [row.id, row.appName, row.clicks, row.signups])).toEqual([
      ["primary", "Lexi", 0, 0],
      ["tiktok", "Lexi", 12, 3],
      ["video", "Lexi", 0, 0],
      ["tempo-primary", "Tempo", 0, 0],
    ]);
    expect(linkRows(programs, undefined).every((row) => row.clicks === null && row.signups === null)).toBe(true);
  });

  it("sorts by the chosen number, named links before primary ones on a tie", () => {
    const rows = linkRows(programs, [
      { link_id: "tiktok", clicks: 12, registrations: 1 },
      { link_id: "video", clicks: 4, registrations: 2 },
    ]);
    expect(sortLinkRows(rows, "clicks").map((row) => row.id)).toEqual(["tiktok", "video", "primary", "tempo-primary"]);
    expect(sortLinkRows(rows, "signups").map((row) => row.id)).toEqual(["video", "tiktok", "primary", "tempo-primary"]);
    expect(sortLinkRows(linkRows(programs, undefined), "clicks").map((row) => row.id)).toEqual([
      "tiktok",
      "video",
      "primary",
      "tempo-primary",
    ]);
  });

  it("reads the sort param, defaulting to clicks", () => {
    expect(parseSort("signups")).toBe("signups");
    expect(parseSort(undefined)).toBe("clicks");
    expect(parseSort(["signups"])).toBe("clicks");
  });

  it("shows URLs without the scheme, or just the path", () => {
    expect(displayUrl("https://boostlink.example/r/abc")).toBe("boostlink.example/r/abc");
    expect(sharePath("https://boostlink.example/r/abc")).toBe("/r/abc");
  });

  it("words the attribution window from the programs' terms", () => {
    expect(windowPhrase([30])).toBe("30 days");
    expect(windowPhrase([30, 30])).toBe("30 days");
    expect(windowPhrase([1])).toBe("1 day");
    expect(windowPhrase([60, 30])).toBe("30–60 days, depending on the program");
  });
});
