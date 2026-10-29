"use client";

import { AnimatePresence, motion, useIsPresent, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PLATFORM_NAMES, PLATFORM_PATHS, type PlatformMark } from "./platform-logos";
import { usePrefersReducedMotion } from "./use-media-query";

const SETS: PlatformMark[][] = [
  ["tiktok", "instagram", "youtube", "x", "snapchat"],
  ["threads", "twitch", "pinterest", "facebook", "linkedin"],
];
const SWAP_MS = 4000;

const listVariants: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.08 } },
};

/** Each logo leaves upwards and the next one rises from below, blurred while it moves. */
const logoVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -14, filter: "blur(6px)", transition: { duration: 0.45, ease: "easeIn" } },
};

/** One set of logos. Absolutely placed, so the outgoing and incoming sets overlap without shifting the layout. */
function LogoSet({ platforms }: { platforms: PlatformMark[] }) {
  // The set on its way out is hidden from screen readers.
  const isPresent = useIsPresent();
  return (
    <motion.ul
      aria-hidden={!isPresent}
      variants={listVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center gap-[30px] sm:justify-between sm:gap-0"
    >
      {platforms.map((platform) => (
        <motion.li key={platform} variants={logoVariants} className="flex items-center gap-2">
          <svg
            role="img"
            aria-label={PLATFORM_NAMES[platform]}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-[26px] shrink-0 sm:size-[22px]"
          >
            <path d={PLATFORM_PATHS[platform]} />
          </svg>
          <span aria-hidden className="hidden text-[19px] font-bold tracking-[-0.02em] sm:inline">
            {PLATFORM_NAMES[platform]}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

/**
 * Grey "Promoted on" strip under the hero: two sets of five platform logos
 * that swap every 4 s, logo by logo. Monochrome, wordmarks from sm (icons
 * only on phones). Pauses while hovered or focused; with reduced motion it
 * shows the first set only. Spacing against the page comes from `className`.
 */
export function PlatformStrip({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [setIndex, setSetIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = window.setInterval(() => setSetIndex((index) => (index + 1) % SETS.length), SWAP_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused]);

  return (
    <section
      aria-label="Platforms apps are promoted on"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        // Same inner padding as the hero, so the label lines up with its copy.
        "flex flex-col items-center gap-4 px-6 py-10 text-muted-foreground/85 sm:flex-row sm:gap-12 sm:px-12 sm:py-11 lg:px-16 dark:text-[#6b7280]",
        className,
      )}
    >
      <p className="text-[15px] font-semibold whitespace-nowrap text-muted-foreground">Promoted on</p>
      <div className="relative h-10 w-full sm:flex-1">
        <AnimatePresence initial={false}>
          <LogoSet key={setIndex} platforms={SETS[reducedMotion ? 0 : setIndex]!} />
        </AnimatePresence>
      </div>
    </section>
  );
}
