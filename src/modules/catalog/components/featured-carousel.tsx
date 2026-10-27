"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { roundIconButtonClassName } from "./scroll-row";
import { usePrefersReducedMotion } from "./use-media-query";

const ADVANCE_MS = 6000;

/**
 * Featured apps, one slide at a time: arrows, dots, swipe (scroll-snap), and
 * auto-advance every 6s while on screen. Auto-advance pauses on hover or
 * focus, can be stopped with its own button (WCAG 2.2.2) and never runs with
 * reduced motion. Slides other than the current one are inert.
 */
export function FeaturedCarousel({ slides, labels }: { slides: React.ReactNode[]; labels: string[] }) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const autoplay = !reducedMotion && !stopped;
  const running = autoplay && !hovered && !focused && inView;

  const goTo = useCallback(
    (next: number) => {
      const node = track.current;
      if (!node) return;
      const target = (next + count) % count;
      node.scrollTo({ left: target * node.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
      setIndex(target);
    },
    [count, reducedMotion],
  );

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Restarts on every slide change, so a manual move gets the full 6s too.
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => goTo(index + 1), ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [running, index, goTo]);

  function handleScroll() {
    const node = track.current;
    if (!node || node.clientWidth === 0) return;
    setIndex(Math.min(count - 1, Math.round(node.scrollLeft / node.clientWidth)));
  }

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-labelledby={`${id}-title`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 id={`${id}-title`} className="text-lg font-bold tracking-tight sm:text-xl">
          Featured
        </h3>
        <div className="flex gap-2">
          {reducedMotion ? null : (
            <button
              type="button"
              onClick={() => setStopped((value) => !value)}
              aria-pressed={stopped}
              className={roundIconButtonClassName}
            >
              {stopped ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
              <span className="sr-only">{stopped ? "Start rotating featured apps" : "Stop rotating featured apps"}</span>
            </button>
          )}
          <button type="button" onClick={() => goTo(index - 1)} aria-controls={`${id}-track`} className={roundIconButtonClassName}>
            <ChevronLeft aria-hidden className="size-4" />
            <span className="sr-only">Previous featured app</span>
          </button>
          <button type="button" onClick={() => goTo(index + 1)} aria-controls={`${id}-track`} className={roundIconButtonClassName}>
            <ChevronRight aria-hidden className="size-4" />
            <span className="sr-only">Next featured app</span>
          </button>
        </div>
      </div>

      <div
        ref={track}
        id={`${id}-track`}
        onScroll={handleScroll}
        aria-live={running ? "off" : "polite"}
        className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={labels[slideIndex]}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${count}: ${labels[slideIndex]}`}
            inert={slideIndex !== index}
            className="flex w-full shrink-0 snap-center snap-always"
          >
            {slide}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        {labels.map((label, dotIndex) => (
          <button
            key={label}
            type="button"
            onClick={() => goTo(dotIndex)}
            aria-label={`Show ${label}`}
            aria-current={dotIndex === index}
            className="group grid h-6 place-items-center px-1 outline-none"
          >
            <span
              className={cn(
                "block h-2 rounded-full transition-[width,background-color] duration-200 group-focus-visible:ring-3 group-focus-visible:ring-ring/50 motion-reduce:transition-none",
                dotIndex === index ? "w-6 bg-primary" : "w-2 bg-foreground/20 group-hover:bg-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
