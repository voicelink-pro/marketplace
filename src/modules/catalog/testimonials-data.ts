// Sample copy for the draft.

export type Testimonial = {
  quote: string;
  name: string;
  /** Handle and channel for creators, title and company for apps. */
  role: string;
  avatarUrl?: string;
};

export const CREATOR_TESTIMONIALS: Testimonial[] = [
  {
    quote: "I used to get one-off fees per post. Now one video from March still pays me every month.",
    name: "Maja K.",
    role: "@majamakes · TikTok",
  },
  {
    quote: "I only join apps I actually use, so promoting them doesn't feel like selling.",
    name: "Daniel R.",
    role: "@danbuilds · YouTube",
  },
  {
    quote: "Separate links per channel showed me Stories convert way better than my bio.",
    name: "Lena S.",
    role: "@lena.studies · Instagram",
  },
];

export const APP_TESTIMONIALS: Testimonial[] = [
  {
    quote: "We stopped paying for clicks. We only pay when someone actually subscribes.",
    name: "Tom W.",
    role: "Founder, Tempo Focus",
  },
  {
    quote: "Creators found us in the catalog. We didn't send a single cold DM.",
    name: "Anna L.",
    role: "Growth, Lingo Chat",
  },
  {
    quote: "Creator posts brought subscribers who stayed longer than our paid ad users.",
    name: "Marco P.",
    role: "Co-founder, Habit Grid",
  },
];
