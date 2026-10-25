import { describe, expect, it } from "vitest";
import { resolveHomePath } from "./home";

const none = { isAdmin: false, isCreator: false, hasOrganization: false };

describe("resolveHomePath", () => {
  it("sends a user without any context to onboarding", () => {
    expect(resolveHomePath(none)).toBe("/onboarding");
  });

  it("sends a creator to the creator panel", () => {
    expect(resolveHomePath({ ...none, isCreator: true })).toBe("/creator");
  });

  it("sends a company member to the company panel", () => {
    expect(resolveHomePath({ ...none, hasOrganization: true })).toBe("/company");
  });

  it("uses the last used context when the user has both", () => {
    const both = { ...none, isCreator: true, hasOrganization: true };
    expect(resolveHomePath(both, "company")).toBe("/company");
    expect(resolveHomePath(both, "creator")).toBe("/creator");
    expect(resolveHomePath(both)).toBe("/creator");
  });

  it("ignores a last used context the user no longer has", () => {
    expect(resolveHomePath({ ...none, isCreator: true }, "company")).toBe("/creator");
  });

  it("sends an admin without other contexts to the admin panel", () => {
    expect(resolveHomePath({ ...none, isAdmin: true })).toBe("/admin");
  });

  it("prefers a member context over admin for admins who also use the product", () => {
    expect(resolveHomePath({ ...none, isAdmin: true, hasOrganization: true })).toBe("/company");
  });
});
