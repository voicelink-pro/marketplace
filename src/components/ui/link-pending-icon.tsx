"use client";

import { ArrowRight, Loader2, type LucideProps } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/**
 * The trailing arrow of a `<Link>` that opens another page; a spinner of the
 * same size while that navigation is pending, so the button keeps its width.
 * Must sit inside the `<Link>`. Takes the arrow's props (size, hover nudge,
 * `data-icon`); the spinner drops the nudge. Prefetched pages skip pending.
 */
export function LinkPendingIcon({ className, ...props }: LucideProps) {
  const { pending } = useLinkStatus();
  if (!pending) return <ArrowRight aria-hidden className={className} {...props} />;
  return (
    <>
      <Loader2 aria-hidden className={cn(className, "translate-none! animate-spin")} {...props} />
      <span className="sr-only">Loading</span>
    </>
  );
}

/**
 * For a `<Link>` without an icon: nothing until its navigation is pending,
 * then a 14px spinner after the label. Must sit inside the `<Link>`.
 */
export function LinkPendingSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <>
      <Loader2 aria-hidden data-icon="inline-end" className={cn("inline size-3.5 shrink-0 animate-spin", className)} />
      <span className="sr-only">Loading</span>
    </>
  );
}

/**
 * For a card that is one `<Link>`: while its navigation is pending, dims the card
 * and shows a small spinner in the top-right corner. Must sit inside the `<Link>`;
 * the nearest positioned ancestor is the card.
 */
export function LinkPendingCardOverlay() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-background/30">
      <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-background/80">
        <Loader2 aria-hidden className="size-4 animate-spin" />
      </span>
      <span className="sr-only">Loading</span>
    </span>
  );
}
