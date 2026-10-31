"use client";

import { Play } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CREATOR_TESTIMONIALS, type CreatorTestimonial } from "../creator-testimonials-data";
import { CarouselArrow, useCarouselKeys } from "./carousel-controls";
import { usePrefersReducedMotion } from "./use-media-query";

const GAP = 16;

/**
 * One 9:16 video card. With a video: a muted preview plays while a mouse hovers
 * (not with reduced motion) or after a tap on touch, and pauses on leave or a
 * second tap; the play button starts it with sound and the native controls,
 * and the overlays step aside. Without one: a dotted placeholder, play disabled.
 */
function VideoCard({ item }: { item: CreatorTestimonial }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pointerType = useRef("mouse");
  const [engaged, setEngaged] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const hasVideo = Boolean(item.videoSrc);

  function preview(play: boolean) {
    const video = videoRef.current;
    if (!video || engaged) return;
    if (play) void video.play().catch(() => {});
    else video.pause();
  }

  function engage() {
    const video = videoRef.current;
    if (!video) return;
    setEngaged(true);
    video.muted = false;
    void video.play().catch(() => {});
  }

  return (
    <div
      onPointerDown={(event) => (pointerType.current = event.pointerType)}
      onPointerEnter={(event) => event.pointerType === "mouse" && !reducedMotion && preview(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && preview(false)}
      onClick={() => {
        if (pointerType.current !== "mouse" && videoRef.current) preview(videoRef.current.paused);
      }}
      className="relative aspect-[9/16] overflow-hidden rounded-[22px] border bg-card"
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          muted
          playsInline
          preload="none"
          poster={item.poster}
          controls={engaged}
          className="absolute inset-0 size-full object-cover"
        >
          <source src={item.videoSrc} />
          {item.captionsSrc ? <track kind="captions" src={item.captionsSrc} srcLang="en" label="English" /> : null}
        </video>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(var(--muted-foreground)_1px,transparent_1px)] [background-size:14px_14px] opacity-20"
        />
      )}

      {engaged ? null : (
        <>
          <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {item.platform}
          </span>
          <button
            type="button"
            disabled={!hasVideo}
            aria-label={hasVideo ? `Play ${item.handle}'s video` : "Video coming soon"}
            onClick={(event) => {
              event.stopPropagation();
              engage();
            }}
            className="absolute top-1/2 left-1/2 grid size-14 -translate-1/2 place-items-center rounded-full border border-white/20 bg-white/15 text-white outline-none backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 disabled:hover:bg-white/15"
          >
            <Play aria-hidden className="ml-0.5 size-5 fill-current" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 bg-linear-to-t from-black/85 via-black/50 to-transparent p-4 pt-20">
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
              Earned {item.earned} in {item.period}
            </span>
            <span className="text-sm font-bold text-white">{item.handle}</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * "What creators say" on the creators home page, between Who it's for and How
 * it works: a row of 9:16 video cards. 4 visible from
 * lg, 2 from md, ~1.3 on phones. Native scroll with snap points, so swipes
 * work; the arrows and the Left/Right keys move one card and hide at either
 * end. No loop, no autoplay. `children` (the proof strip, a server component)
 * goes 64px under the carousel, with 16px extra room under it.
 */
export function CreatorTestimonials({ children }: { children?: ReactNode }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setAtStart(scroller.scrollLeft <= 1);
    setAtEnd(scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [update]);

  function step(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    const card = scroller?.firstElementChild;
    if (!scroller || !(card instanceof HTMLElement)) return;
    scroller.scrollBy({ left: direction * (card.offsetWidth + GAP), behavior: reducedMotion ? "auto" : "smooth" });
  }

  const handleKeyDown = useCarouselKeys(step);

  return (
    <section aria-labelledby="creator-testimonials-heading" className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="flex max-w-3xl flex-col items-center gap-3 text-center">
        <span className="text-sm font-bold text-primary">Creators on boostlink</span>
        {/* Same size as the How it works heading. */}
        <h2
          id="creator-testimonials-heading"
          className="text-[clamp(1.5rem,6.4vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.045em] text-balance sm:text-[clamp(1rem,5vw,2.25rem)] sm:whitespace-nowrap"
        >
          What creators say about <span className="text-primary">boostlink</span>
        </h2>
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Creator testimonials"
        onKeyDown={handleKeyDown}
        className="relative mt-8 w-full sm:mt-10"
      >
        <ul
          ref={scrollerRef}
          onScroll={update}
          style={{ gap: GAP }}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CREATOR_TESTIMONIALS.map((item, index) => (
            // Placeholder items are identical, so the position is the key.
            <li
              key={index}
              className="w-[75%] shrink-0 snap-start md:w-[calc((100%-16px)/2)] lg:w-[calc((100%-48px)/4)]"
            >
              <VideoCard item={item} />
            </li>
          ))}
        </ul>

        {/* Over the cards' edges on phones, just outside them from lg. */}
        <CarouselArrow
          direction="previous"
          label="Previous testimonial"
          onClick={() => step(-1)}
          className={cn("left-1 lg:-left-5", atStart && "hidden")}
        />
        <CarouselArrow
          direction="next"
          label="Next testimonial"
          onClick={() => step(1)}
          className={cn("right-1 lg:-right-5", atEnd && "hidden")}
        />
      </div>

      {children ? <div className="mt-16 w-full pb-4">{children}</div> : null}
    </section>
  );
}
