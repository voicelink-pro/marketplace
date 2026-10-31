"use client";

import { useEffect, useState } from "react";

/**
 * Phone-only bar that keeps the join action in reach on long app profiles.
 * It hides while the real join card is on screen, so it never covers it.
 */
export function StickyJoinBar({ targetId, commissionLabel }: { targetId: string; commissionLabel: string }) {
  const [targetVisible, setTargetVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setTargetVisible(entry?.isIntersecting ?? false));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (targetVisible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="tabular truncate text-sm font-bold">{commissionLabel}</p>
          <p className="truncate text-xs text-muted-foreground">Creator commission</p>
        </div>
        <a
          href={`#${targetId}`}
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Join program
        </a>
      </div>
    </div>
  );
}
