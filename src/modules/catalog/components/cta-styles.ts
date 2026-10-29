import { cn } from "@/lib/utils";

/** 52px tall, 28px sides, 16px semibold; shared by the home page's CTAs. */
export const CTA_SIZE = "h-13 gap-2 px-7 text-base font-semibold max-sm:w-full";

/**
 * Primary CTA motion: 1px lift, soft yellow glow, arrow nudges right, one
 * faint sheen across, 0.98 on press. All of it only without reduced motion.
 * The background stays the brand yellow in every state.
 */
export const PRIMARY_CTA = cn(
  CTA_SIZE,
  "group/cta relative overflow-hidden transition-[translate,scale,box-shadow] duration-300 ease-out hover:bg-primary active:bg-primary active:not-aria-[haspopup]:translate-y-0",
  "motion-safe:hover:-translate-y-px motion-safe:hover:shadow-[0_6px_14px_-6px_rgb(255_214_0/0.4)] motion-safe:active:scale-[0.98]",
  // Sheen: parked off the left edge, crosses once on hover, snaps back unseen on leave.
  "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:hidden before:w-1/5 before:-translate-x-full before:-skew-x-12 before:bg-linear-to-r before:from-transparent before:via-white/25 before:to-transparent motion-safe:before:block motion-safe:hover:before:translate-x-[600%] motion-safe:hover:before:transition-transform motion-safe:hover:before:duration-700 motion-safe:hover:before:ease-out",
);

/** The primary CTA's arrow: nudges right on hover, only without reduced motion. */
export const PRIMARY_CTA_ARROW = "size-4.5 transition-transform duration-300 ease-out motion-safe:group-hover/cta:translate-x-1";
