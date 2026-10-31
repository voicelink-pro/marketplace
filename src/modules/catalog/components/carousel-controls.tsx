"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/** Low-key round arrow at a carousel's side, vertically centered; `className` places (or hides) it. */
const ARROW =
  "absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/70 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:size-10";

/** A carousel's previous or next arrow button. */
export function CarouselArrow({
  direction,
  label,
  onClick,
  className,
}: {
  direction: "previous" | "next";
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" aria-label={label} onClick={onClick} className={cn(ARROW, className)}>
      <Icon aria-hidden className="size-4 sm:size-[18px]" />
    </button>
  );
}

/**
 * The Left/Right keys move a carousel one card (`step(-1)` / `step(1)`). Keys on
 * a video are left to it: its own controls seek with them.
 */
export function useCarouselKeys(step: (delta: -1 | 1) => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target instanceof HTMLVideoElement) return;
    event.preventDefault();
    step(event.key === "ArrowLeft" ? -1 : 1);
  };
}
