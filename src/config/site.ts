export type SocialNetwork = "tiktok" | "x" | "instagram" | "youtube" | "linkedin";

/** boostlink's own profiles; the footer shows an icon only for networks listed here. None yet. */
const social: Partial<Record<SocialNetwork, string>> = {};

// Product name approved by the owner; shared by navigation and page metadata.
export const siteConfig = {
  name: "boostlink",
  description:
    "Find apps to promote and earn recurring commission on every subscription your audience pays for.",
  social,
} as const;
