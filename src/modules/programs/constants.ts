import type { Database } from "@/lib/supabase/database.types";

export type ReferralDestinationKind = Database["public"]["Enums"]["referral_destination_kind"];

export const REFERRAL_DESTINATION_KINDS: readonly ReferralDestinationKind[] = [
  "website",
  "ios_store",
  "android_store",
];

export const REFERRAL_DESTINATION_LABELS: Record<ReferralDestinationKind, string> = {
  website: "Product website",
  ios_store: "App Store (iOS)",
  android_store: "Google Play (Android)",
};

export const MAX_REFERRAL_LINKS_PER_PROGRAM = 25;

export function buildReferralLinkPath(token: string): string {
  return `/r/${encodeURIComponent(token.trim())}`;
}

export function buildReferralLinkUrl(token: string, siteUrl?: string): string {
  const path = buildReferralLinkPath(token);
  const base = (siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  return base ? `${base}${path}` : path;
}
