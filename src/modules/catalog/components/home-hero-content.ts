import type { HomeAudience } from "../audience";

/** Phone screens the hero can show: the creators' receipt and chart, the apps' subscribers and plans. */
export type HeroScreen = "receipt" | "chart" | "subscribers" | "plans";

/**
 * Hero copy per audience. In its own module so server components (Who it's
 * for's CTA, the footer's end panel) can reuse the primary button without
 * importing the client hero.
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
    /** The trust line under the hero's buttons. */
    trust: readonly string[];
    /** The line above the headline: "[b] For creators | Have an app? See boostlink for apps". */
    label: { audience: string; lead: string; link: { href: string; label: string } };
  }
> = {
  creators: {
    headline: { before: "Recommend apps.\nGet paid ", phrase: "every month", after: "." },
    subtitle: [
      "Pick an app you like, share your link, and earn",
      "a cut of every subscription your followers pay.",
      "Every month they stay, you get paid again.",
    ],
    primary: { href: "/signup", label: "Start as a creator" },
    secondaryLabel: "Discover apps",
    trust: ["Free to use", "No follower minimum", "10–50% of every payment"],
    label: {
      audience: "For creators",
      lead: "Have an app?",
      link: { href: "/for-apps", label: "See boostlink for apps" },
    },
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
    label: {
      audience: "For apps",
      lead: "Are you a creator?",
      link: { href: "/", label: "See boostlink for creators" },
    },
  },
};

/** A notification from the boostlink app: the event, and optionally an amount on its own line. */
export type HeroChip = { text: string; amount?: string };

/**
 * Each hero's stage: two phones (click the back one to swap) and two notifications from
 * the boostlink app. Creator amounts match the receipt: 20% of $9.99 and 30% of $12.99.
 */
export const HERO_STAGE: Record<
  HomeAudience,
  { phones: { front: HeroScreen; back: HeroScreen }; chips: [HeroChip, HeroChip] }
> = {
  creators: {
    phones: { front: "receipt", back: "chart" },
    chips: [
      { text: "New subscriber via your TikTok link.", amount: "+$2.00 commission" },
      { text: "Renewal via your Instagram link.", amount: "+$3.90 commission" },
    ],
  },
  apps: {
    phones: { front: "subscribers", back: "plans" },
    chips: [{ text: "A creator joined your program" }, { text: "New paying subscriber" }],
  },
};
