import { describe, expect, it } from "vitest";
import { parseSocialProfileUrl } from "./social";

describe("parseSocialProfileUrl", () => {
  it.each([
    ["https://www.instagram.com/alice", "instagram", "https://www.instagram.com/alice"],
    ["https://www.tiktok.com/@alice", "tiktok", "https://www.tiktok.com/@alice"],
    ["https://youtube.com/@alice", "youtube", "https://youtube.com/@alice"],
    ["https://x.com/alice", "x", "https://x.com/alice"],
    ["https://twitter.com/alice", "x", "https://twitter.com/alice"],
    ["https://www.linkedin.com/in/alice", "linkedin", "https://www.linkedin.com/in/alice"],
    ["https://www.twitch.tv/alice", "twitch", "https://www.twitch.tv/alice"],
    ["https://www.threads.net/@alice", "threads", "https://www.threads.net/@alice"],
    ["https://alice.blog/about", "other", "https://alice.blog/about"],
  ])("detects %s as %s", (input, platform, url) => {
    expect(parseSocialProfileUrl(input)).toEqual({ ok: true, platform, url });
  });

  it("adds https when the scheme is missing", () => {
    expect(parseSocialProfileUrl("  instagram.com/alice ")).toEqual({
      ok: true,
      platform: "instagram",
      url: "https://instagram.com/alice",
    });
  });

  it("upgrades http to https", () => {
    expect(parseSocialProfileUrl("http://tiktok.com/@alice")).toMatchObject({
      ok: true,
      url: "https://tiktok.com/@alice",
    });
  });

  it("drops the fragment and lowercases the host", () => {
    expect(parseSocialProfileUrl("https://WWW.Instagram.com/Alice#bio")).toMatchObject({
      ok: true,
      url: "https://www.instagram.com/Alice",
    });
  });

  it.each([
    ["javascript:alert(1)"],
    ["ftp://example.com/alice"],
    ["not a url"],
    ["https://localhost/alice"],
    ["https://user:secret@instagram.com/alice"],
    [""],
  ])("rejects %s", (input) => {
    expect(parseSocialProfileUrl(input)).toEqual({ ok: false, reason: "invalid_url" });
  });

  it("requires a profile path on known platforms", () => {
    expect(parseSocialProfileUrl("https://instagram.com/")).toEqual({
      ok: false,
      reason: "profile_path_required",
    });
  });

  it("does not treat look-alike domains as known platforms", () => {
    expect(parseSocialProfileUrl("https://instagram.com.evil.example/alice")).toMatchObject({
      ok: true,
      platform: "other",
    });
  });

  it("rejects URLs longer than 2048 characters", () => {
    expect(parseSocialProfileUrl(`https://example.com/${"a".repeat(2100)}`)).toEqual({
      ok: false,
      reason: "invalid_url",
    });
  });
});
