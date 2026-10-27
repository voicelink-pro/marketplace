"use client";

import { motion } from "motion/react";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { PlatformLogos } from "./platform-logos";
import { usePrefersReducedMotion } from "./use-media-query";

const WORDS = ["apps", "creators"];

/** Matches LayoutTextFlip's own lead-in text. */
const TEXT_CLASS = "text-2xl font-bold tracking-tight drop-shadow-lg md:text-4xl";

/** Yellow fails contrast on white, so the word sits on a dark chip in both themes. */
const CHIP_CLASS =
  "bg-neutral-950 text-primary shadow-black/20 ring-1 ring-white/10 dark:bg-neutral-900 dark:text-primary";

function JoinHeadline() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <h2 id="join-strip-heading">
      <span className="sr-only">Join the first apps and creators on boostlink</span>
      <span aria-hidden className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {reducedMotion ? (
          <>
            <span className={TEXT_CLASS}>Join the first</span>
            <span className="rounded-md bg-neutral-950 px-4 py-2 text-2xl font-bold tracking-tight text-primary shadow-sm ring-1 ring-white/10 md:text-4xl dark:bg-neutral-900">
              apps and creators
            </span>
            <span className={TEXT_CLASS}>on boostlink</span>
          </>
        ) : (
          <>
            <LayoutTextFlip text="Join the first" words={WORDS} duration={3000} className={CHIP_CLASS} />
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
 * Strip above the catalog: the flipping "Join the first apps / creators on
 * boostlink" line, the app logo cloud (`children`), and the platforms creators post on.
 * With reduced motion the line is static.
 */
export function JoinStrip({ children }: { children: React.ReactNode }) {
  return (
    <section aria-labelledby="join-strip-heading" className="flex flex-col gap-6 sm:gap-8">
      <JoinHeadline />
      {children}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>Creators share on</span>
        <PlatformLogos />
      </div>
    </section>
  );
}
