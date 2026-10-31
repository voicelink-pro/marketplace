// Placeholders until the real creators' videos arrive.

type CreatorTestimonialPlatform = "TikTok" | "YouTube" | "Instagram" | "Podcast" | "Newsletter";

export type CreatorTestimonial = {
  handle: string;
  platform: CreatorTestimonialPlatform;
  /** As shown: "$1,240". */
  earned: string;
  /** As shown: "3 months". */
  period: string;
  /** Vertical (9:16) video; without it the card shows a placeholder and no playback. */
  videoSrc?: string;
  poster?: string;
  /** WebVTT captions for `videoSrc`. */
  captionsSrc?: string;
};

const PLACEHOLDER = {
  handle: "@[creator handle]",
  earned: "$[amount]",
  period: "[3] months",
};

export const CREATOR_TESTIMONIALS: CreatorTestimonial[] = [
  { ...PLACEHOLDER, platform: "TikTok" },
  { ...PLACEHOLDER, platform: "YouTube" },
  { ...PLACEHOLDER, platform: "Instagram" },
  { ...PLACEHOLDER, platform: "Podcast" },
  { ...PLACEHOLDER, platform: "TikTok" },
  { ...PLACEHOLDER, platform: "Newsletter" },
];
