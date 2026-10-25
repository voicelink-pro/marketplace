import { describe, expect, it } from "vitest";
import { buildReferralLinkUrl } from "./constants";
import { createReferralLinkSchema, joinProgramSchema } from "./schemas";

describe("programs validation schemas and link URL builder (Stage 4)", () => {
  it("requires explicit terms acceptance and valid UUIDs in joinProgramSchema", () => {
    const valid = joinProgramSchema.safeParse({
      appId: "550e8400-e29b-41d4-a716-446655440000",
      appSlug: "pulse-coach",
      acceptedTermsVersionId: "550e8400-e29b-41d4-a716-446655440001",
      acceptedTerms: true,
    });
    expect(valid.success).toBe(true);

    const unaccepted = joinProgramSchema.safeParse({
      appId: "550e8400-e29b-41d4-a716-446655440000",
      appSlug: "pulse-coach",
      acceptedTermsVersionId: "550e8400-e29b-41d4-a716-446655440001",
      acceptedTerms: false,
    });
    expect(unaccepted.success).toBe(false);
  });

  it("validates named referral link creation and rejects arbitrary destination kinds", () => {
    const valid = createReferralLinkSchema.safeParse({
      membershipId: "550e8400-e29b-41d4-a716-446655440000",
      label: "  Instagram bio  ",
      channel: "instagram",
      destinationKind: "ios_store",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.label).toBe("Instagram bio");
    }

    const emptyLabel = createReferralLinkSchema.safeParse({
      membershipId: "550e8400-e29b-41d4-a716-446655440000",
      label: "   ",
      channel: "instagram",
      destinationKind: "website",
    });
    expect(emptyLabel.success).toBe(false);

    const invalidDest = createReferralLinkSchema.safeParse({
      membershipId: "550e8400-e29b-41d4-a716-446655440000",
      label: "Custom URL",
      channel: "tiktok",
      destinationKind: "https://evil.example.com",
    });
    expect(invalidDest.success).toBe(false);
  });

  it("formats shareable referral link URLs cleanly", () => {
    expect(buildReferralLinkUrl("pulse-coach-a1b2c3d4", "https://market.example.com/")).toBe(
      "https://market.example.com/r/pulse-coach-a1b2c3d4",
    );
  });
});
