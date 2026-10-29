// Sample copy for the draft.

import type { Platform } from "./components/platform-logos";

export type Testimonial = {
  /** Short bold line above the quote. */
  title: string;
  quote: string;
  name: string;
  /** Handle for creators, title and company for apps. */
  role: string;
  /** The creator's channel, shown as its logo. */
  platform?: Platform;
  avatarUrl?: string;
};

export const CREATOR_TESTIMONIALS: Testimonial[] = [
  {
    title: "One video, paid every month",
    quote: "I used to get one-off fees per post. Now one video from March still pays me every month.",
    name: "Maja K.",
    role: "@majamakes",
    platform: "tiktok",
  },
  {
    title: "Apps I actually use",
    quote: "I only join apps I actually use, so promoting them doesn't feel like selling.",
    name: "Daniel R.",
    role: "@danbuilds",
    platform: "youtube",
  },
  {
    title: "Stories beat my bio",
    quote: "Separate links per channel showed me Stories convert way better than my bio.",
    name: "Lena S.",
    role: "@lena.studies",
    platform: "instagram",
  },
  {
    title: "No DMs, no pitching",
    quote: "I pick deals in the catalog and join in a click. No waiting for brands to answer.",
    name: "Tom B.",
    role: "@tomtalkstech",
    platform: "x",
  },
  {
    title: "Payouts just arrive",
    quote: "Renewals land in my panel and the payout goes straight to my bank.",
    name: "Aisha M.",
    role: "@aisha.reads",
    platform: "tiktok",
  },
  {
    title: "Small audience, real money",
    quote: "I have 12k followers. People who trust me subscribe, and I keep earning.",
    name: "Kai O.",
    role: "@kai.codes",
    platform: "youtube",
  },
  {
    title: "Easy to explain",
    quote: "My followers get a code, I get a cut. That's the whole pitch.",
    name: "Zara P.",
    role: "@zara.studies",
    platform: "instagram",
  },
  {
    title: "Better than sponsorships",
    quote: "Sponsors paid once. These apps pay me as long as my viewers stay.",
    name: "Leo W.",
    role: "@leo.builds",
    platform: "x",
  },
];

export const APP_TESTIMONIALS: Testimonial[] = [
  {
    title: "We stopped paying for clicks",
    quote: "We only pay when someone actually subscribes. Our ad budget went to zero.",
    name: "Tom W.",
    role: "Founder, Mellow",
  },
  {
    title: "Creators found us",
    quote: "Creators found our offer in the catalog. We didn't send a single cold DM.",
    name: "Anna L.",
    role: "Growth, Draftly",
  },
  {
    title: "Subscribers who stay",
    quote: "Creator posts brought subscribers who stayed longer than our paid ad users.",
    name: "Marco P.",
    role: "Co-founder, Monetra",
  },
  {
    title: "Set up in an afternoon",
    quote: "We set commissions per plan, published, and the first creators joined that week.",
    name: "Sofia R.",
    role: "Founder, Lumio",
  },
  {
    title: "Content that feels real",
    quote: "It reads like a friend's recommendation, not an ad. Our trial-to-paid rate shows it.",
    name: "Jonas K.",
    role: "Marketing, Orbitly",
  },
  {
    title: "Clear numbers",
    quote: "We see every click, sign-up and renewal per creator, so we know what works.",
    name: "Mei T.",
    role: "CEO, Pipely",
  },
  {
    title: "No negotiation",
    quote: "Creators join on our terms. No rate cards, no back-and-forth.",
    name: "Ravi S.",
    role: "Founder, Boxora",
  },
  {
    title: "Pays for itself",
    quote: "Commission comes out of revenue we wouldn't have had. It's an easy yes.",
    name: "Clara N.",
    role: "Growth, Payvio",
  },
];
