"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { scrollerClassName } from "./scroller";
import { usePrefersReducedMotion } from "./use-media-query";

export const roundIconButtonClassName =
  "inline-flex size-9 items-center justify-center rounded-full border bg-background text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40";

/**
 * Titled horizontal row: swipe or scroll on touch, arrow buttons from md.
 * Items snap to the start; the list runs into the page gutter on phones.
 */
export function ScrollRow({
  title,
  children,
  itemClassName = "w-[17.5rem]",
}: {
  title: string;
  children: React.ReactNode;
  itemClassName?: string;
}) {
  const id = useId();
  const list = useRef<HTMLUListElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const update = useCallback(() => {
    const node = list.current;
    if (!node) return;
    setEdges({
      atStart: node.scrollLeft <= 1,
      atEnd: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const node = list.current;
    if (!node) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [update]);

  function page(direction: 1 | -1) {
    const node = list.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h3 id={`${id}-title`} className="text-lg font-bold tracking-tight sm:text-xl">
          {title}
        </h3>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={edges.atStart}
            aria-controls={`${id}-list`}
            className={roundIconButtonClassName}
          >
            <ChevronLeft aria-hidden className="size-4" />
            <span className="sr-only">Scroll {title} back</span>
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={edges.atEnd}
            aria-controls={`${id}-list`}
            className={roundIconButtonClassName}
          >
            <ChevronRight aria-hidden className="size-4" />
            <span className="sr-only">Scroll {title} forward</span>
          </button>
        </div>
      </div>
      <ul
        ref={list}
        id={`${id}-list`}
        onScroll={update}
        className={cn(scrollerClassName, "-mx-4 scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6")}
      >
        {Children.map(children, (child) => (
          <li className={cn("flex shrink-0 snap-start", itemClassName)}>{child}</li>
        ))}
      </ul>
    </section>
  );
}
