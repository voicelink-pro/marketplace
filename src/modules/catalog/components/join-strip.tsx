"use client";

import { motion } from "motion/react";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { usePrefersReducedMotion } from "./use-media-query";

const WORDS = ["apps", "creators"];

/** The headline's lead-in, before the flipping word. */
const JOIN_LEAD = "Join thousands of";

/** Matches LayoutTextFlip's own lead-in text. */
const TEXT_CLASS = "text-2xl font-bold tracking-tight drop-shadow-lg md:text-4xl";

/** Yellow fails contrast on white, so the word sits on a dark chip in both themes. */
const CHIP_CLASS =
  "bg-neutral-900 text-primary shadow-black/20 ring-1 ring-white/10";

function JoinHeadline() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <h2 id="join-strip-heading">
      <span className="sr-only">{JOIN_LEAD} apps and creators on boostlink</span>
      <span aria-hidden className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {reducedMotion ? (
          <>
            <span className={TEXT_CLASS}>{JOIN_LEAD}</span>
            <span className="rounded-md bg-neutral-900 px-4 py-2 text-2xl font-bold tracking-tight text-primary shadow-sm ring-1 ring-white/10 md:text-4xl">
              apps and creators
            </span>
            <span className={TEXT_CLASS}>on boostlink</span>
          </>
        ) : (
          <>
            <LayoutTextFlip text={JOIN_LEAD} words={WORDS} duration={3000} className={CHIP_CLASS} />
            {/* Slides along as the chip changes width. */}
            <motion.span layout className={TEXT_CLASS}>
              on boostlink
            </motion.span>
          </>
        )}
      </span>
    </h2>
  );
}

/**
 * Strip above the catalog: the flipping "Join thousands of apps / creators on
 * boostlink" line and the app logo cloud (`children`). With reduced motion the
 * line is static.
 */
export function JoinStrip({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="join-strip-heading" className="flex flex-col gap-6 sm:gap-8">
      <JoinHeadline />
      {children}
    </section>
  );
}
