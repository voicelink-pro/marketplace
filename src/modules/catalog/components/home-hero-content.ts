import type { HomeAudience } from "../audience";

/** Phone screens the hero can show. */
export type HeroScreen = "earnings" | "link" | "subscribers" | "plans";

/**
 * Hero copy per audience. In its own module so server components (the FAQ's
 * final CTA) can reuse the primary button and trust line without importing
 * the client hero.
 * "\n" + pre-line keeps each headline on exactly two lines; `phrase` is the
 * animated key phrase.
 */
export const HERO_CONTENT: Record<
  HomeAudience,
  {
    headline: { before: string; phrase: string; after: string };
    /** Desktop lines (>=1024px); joined and wrapped with text-wrap: pretty below that. */
    subtitle: [string, string, string];
    /** `signedOutHref` replaces `href` for visitors without a session. */
    primary: { href: string; signedOutHref?: string; label: string };
    secondaryLabel: string;
    /** The trust line under the hero's buttons and the FAQ's final CTA. */
    trust: [string, string, string];
    phones: { front: HeroScreen; back: HeroScreen };
    /** Notification bodies; every chip is from the boostlink app. */
    chips: [string, string];
  }
> = {
  creators: {
    headline: { before: "Turn your audience\ninto ", phrase: "recurring income", after: "." },
    subtitle: [
      "Pick the apps you like, join in one click, and earn",
      "a share of every subscription your followers pay,",
      "for as long as they stay.",
    ],
    primary: { href: "/signup", label: "Start as a creator" },
    secondaryLabel: "Discover apps",
    trust: ["Free to join", "No subscription", "Get paid monthly"],
    phones: { front: "earnings", back: "link" },
    chips: [
      "New subscriber via your TikTok link. +$7.80 commission.",
      "New subscriber via your Instagram link. +$7.80 commission.",
    ],
  },
  apps: {
    headline: { before: "Creators sell your app.\nYou pay only for ", phrase: "results", after: "." },
    subtitle: [
      "Set a commission per plan. Creators join on their own,",
      "post organic content, and you pay only when",
      "their audience subscribes.",
    ],
    primary: {
      href: "/onboarding/company",
      signedOutHref: "/signup?for=apps&next=/onboarding/company",
      label: "List your app",
    },
    secondaryLabel: "Discover apps",
    trust: ["Free to list", "No subscription", "Pay only when a customer pays"],
    phones: { front: "subscribers", back: "plans" },
    chips: ["A creator joined your offer", "New paying subscriber"],
  },
};
