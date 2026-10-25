import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/modules/accounts/social";
import { REFERRAL_DESTINATION_KINDS } from "./constants";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const joinProgramSchema = z.object({
  appId: z.uuid({ error: "Invalid app identifier." }),
  appSlug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(SLUG_RE, { error: "Invalid app slug." }),
  acceptedTermsVersionId: z.uuid({ error: "Invalid program terms version." }),
  acceptedTerms: z.literal(true, {
    error: "Accept the visible program terms before joining.",
  }),
});

export const linkLabelSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter a name for this link (e.g. Instagram bio)." })
  .max(80, { error: "Link name must be 80 characters or fewer." });

export const createReferralLinkSchema = z.object({
  membershipId: z.uuid({ error: "Select a program." }),
  label: linkLabelSchema,
  channel: z.enum(SOCIAL_PLATFORMS, { error: "Select a channel." }),
  destinationKind: z.enum(REFERRAL_DESTINATION_KINDS, {
    error: "Select one of the app's allowed destinations.",
  }),
});
