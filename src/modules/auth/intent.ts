import type { HomeAudience } from "@/modules/catalog/audience";

/**
 * The two sides on the auth pages. `?for=` takes the same values as on the
 * home page; no param means creators.
 */
export const SIGNUP_INTENTS: Record<
  HomeAudience,
  { option: string; title: string; subtitle: string; next: string }
> = {
  creators: {
    option: "Promote apps",
    title: "Start earning with apps you love",
    subtitle: "Create your account and join your first offer in minutes.",
    next: "/onboarding/creator",
  },
  apps: {
    option: "List my app",
    title: "Get creators to sell your app",
    subtitle: "Create your account and list your app. Creators join on their own.",
    next: "/onboarding/company",
  },
};

/** Brand panel beside the auth forms; benefits follow the home page copy. */
export const BRAND_PANEL: Record<HomeAudience, { heading: string; benefits: [string, string, string] }> = {
  creators: {
    heading: "Why creators join",
    benefits: [
      "Join the apps you like in one click",
      "Promote on Instagram and TikTok with your own link and code, set up in seconds",
      "Earn every month your referrals stay subscribed",
    ],
  },
  apps: {
    heading: "Why apps join",
    benefits: [
      "Set the commission for each plan",
      "Creators find your offer and join on their own",
      "Pay only when their audience subscribes, nothing upfront",
    ],
  },
};
