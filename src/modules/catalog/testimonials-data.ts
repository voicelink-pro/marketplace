// Sample copy for the draft.

export type Testimonial = {
  /** Short bold line above the quote. */
  title: string;
  quote: string;
  name: string;
  /** Title and company. */
  role: string;
  avatarUrl?: string;
};

export const APP_TESTIMONIALS: Testimonial[] = [
  {
    title: "We stopped paying for clicks",
    quote: "We only pay when someone actually subscribes. Our ad budget went to zero.",
    name: "Tom W.",
    role: "Founder, Mellow",
  },
  {
    title: "Creators found us",
    quote: "Creators found our program in the catalog. We didn't send a single cold DM.",
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
