import { describe, expect, it } from "vitest";
import { managedMediaContentType, validateMedia } from "./media";

describe("first-party media content boundaries", () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  it("accepts an image only when its signature and claimed type agree", () => {
    expect(validateMedia(png, "image/png")).toEqual({ extension: "png", contentType: "image/png" });
    expect(() => validateMedia(png, "image/jpeg")).toThrow(/matching contents/);
  });
  it("rejects active HTML and SVG even when their names or MIME claim an image", () => {
    for (const text of ["<svg onload='alert(1)'/>", "<html><script>alert(1)</script>"]) {
      expect(() => validateMedia(new TextEncoder().encode(text), "image/png")).toThrow();
    }
  });
  it("enforces image size in the validated content path", () => {
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1); oversized.set(png);
    expect(() => validateMedia(oversized, "image/png")).toThrow(/10 MB/);
  });
  it("never serves arbitrary names or active formats from the media route", () => {
    expect(managedMediaContentType("../evil.svg")).toBeNull();
    expect(managedMediaContentType("00000000-0000-4000-8000-000000000001.html")).toBeNull();
    expect(managedMediaContentType("00000000-0000-4000-8000-000000000001.webp")).toBe("image/webp");
  });
});
