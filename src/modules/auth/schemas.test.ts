import { describe, expect, it } from "vitest";
import { signUpSchema } from "./schemas";

const valid = {
  displayName: "Alice",
  email: "alice@example.com",
  password: "correct horse 42",
};

describe("signUpSchema", () => {
  it("accepts a valid sign-up and trims the name and email", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      displayName: "  Alice  ",
      email: " Alice@Example.com ",
    });
    expect(result.success && result.data).toEqual({
      displayName: "Alice",
      email: "alice@example.com",
      password: "correct horse 42",
    });
  });

  it.each([
    ["shorter than 10 characters", "abc12345"],
    ["without digits", "onlyletters-here"],
    ["without letters", "1234567890123"],
    ["longer than 72 characters", `a1${"x".repeat(80)}`],
  ])("rejects a password %s", (_label, password) => {
    const result = signUpSchema.safeParse({ ...valid, password });
    expect(result.success).toBe(false);
  });

  it("rejects an empty display name", () => {
    expect(signUpSchema.safeParse({ ...valid, displayName: "   " }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "alice" }).success).toBe(false);
  });
});
