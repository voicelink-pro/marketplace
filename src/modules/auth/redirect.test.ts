import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("keeps a same-site path with query and hash", () => {
    expect(safeRedirectPath("/apps/acme?tab=terms#plans")).toBe("/apps/acme?tab=terms#plans");
  });

  it.each([
    ["absolute URL", "https://evil.example/phish"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["javascript URL", "javascript:alert(1)"],
    ["relative path", "dashboard"],
    ["encoded newline", "/%0d%0aSet-Cookie:x"],
    ["empty string", ""],
  ])("falls back for %s", (_label, value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });

  it("falls back for non-string values", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(["/creator"])).toBe("/dashboard");
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/")).toBe("/");
  });

  it("rejects very long values", () => {
    expect(safeRedirectPath(`/${"a".repeat(600)}`)).toBe("/dashboard");
  });
});
