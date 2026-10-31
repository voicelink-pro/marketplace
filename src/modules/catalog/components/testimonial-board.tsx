"use client";

import { Hand } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Testimonial } from "../testimonials-data";
import { usePrefersReducedMotion } from "./use-media-query";

/**
 * Where each card sits on the stage, as % of its size, and its tilt. Around
 * the edges, leaving the middle to the heading. Right-hand cards are placed
 * from the right edge, so they stay inside the stage at every width from lg.
 */
const SLOTS: { left?: number; right?: number; top: number; rotate: number }[] = [
  { left: 3, top: 5, rotate: -4 }, // top-left
  { left: 36, top: 2, rotate: 2 }, // top-center
  { right: 3, top: 7, rotate: 4 }, // top-right
  { right: 1.5, top: 40, rotate: -3 }, // mid-right
  { left: 1.5, top: 38, rotate: 3 }, // mid-left
  { left: 5, top: 70, rotate: -2 }, // bottom-left
  { left: 41, top: 72, rotate: 3 }, // bottom-center-right
  { right: 3, top: 72, rotate: -5 }, // bottom-right
];

/** Always at full opacity (the corners clear of the heading); the others are dimmed and take turns coming forward. */
const BRIGHT = new Set([0, 7]);
const DIMMED = SLOTS.map((_, index) => index).filter((index) => !BRIGHT.has(index));
const HIGHLIGHT_MS = 3000;

/** Avatar fills, rotating through the cards: brand yellow, near-white, grey. */
const AVATAR_FILLS = [
  "bg-[#FFD600] text-[#111111]",
  "bg-[#F4F4F5] text-[#111111] ring-1 ring-border",
  "bg-[#71717A] text-white",
];

function TestimonialCard({ item, index, className }: { item: Testimonial; index: number; className?: string }) {
  return (
    <figure className={cn("flex flex-col gap-3 rounded-[20px] border bg-card p-5 text-left", className)}>
      <blockquote className="flex flex-col gap-1.5">
        <p className="font-bold">“{item.title}”</p>
        <p className="text-sm text-pretty text-muted-foreground">{item.quote}</p>
      </blockquote>
      <figcaption className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
            AVATAR_FILLS[index % AVATAR_FILLS.length],
          )}
        >
          {item.name.charAt(0)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-sm font-bold">{item.name}</span>
          <span className="truncate text-xs text-muted-foreground">{item.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Desktop: cards scattered over the stage, draggable, dimmed in the back, drifting slowly. */
function DraggableCards({ items, boundsRef }: { items: Testimonial[]; boundsRef: React.RefObject<HTMLDivElement | null> }) {
  const reducedMotion = usePrefersReducedMotion();
  const [highlight, setHighlight] = useState(0);
  // Stacking order: the card dragged last sits on top (still under the heading).
  const [order, setOrder] = useState(() => items.map((_, index) => index));

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setHighlight((value) => (value + 1) % DIMMED.length), HIGHLIGHT_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <ul className="absolute inset-0 hidden lg:block">
      {items.slice(0, SLOTS.length).map((item, index) => {
        const slot = SLOTS[index]!;
        const dimmed = !BRIGHT.has(index) && (reducedMotion || DIMMED[highlight] !== index);
        return (
          <li
            key={item.name}
            className="absolute w-[300px]"
            style={{
              left: slot.left === undefined ? undefined : `${slot.left}%`,
              right: slot.right === undefined ? undefined : `${slot.right}%`,
              top: `${slot.top}%`,
              zIndex: order.indexOf(index) + 1,
            }}
          >
            <motion.div
              drag={!reducedMotion}
              dragConstraints={boundsRef}
              dragElastic={0.2}
              dragMomentum={false}
              onDragStart={() => setOrder((value) => [...value.filter((card) => card !== index), index])}
              style={{ rotate: slot.rotate }}
              initial={false}
              animate={{ opacity: dimmed ? 0.32 : 1, filter: dimmed ? "blur(1.2px)" : "blur(0px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              whileDrag={{ scale: 1.04, opacity: 1, filter: "blur(0px)", zIndex: 30 }}
              className={cn(!reducedMotion && "cursor-grab active:cursor-grabbing")}
            >
              <motion.div
                animate={reducedMotion ? undefined : { y: [0, -8, 0, 8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: index * 0.9 }}
              >
                <TestimonialCard item={item} index={index} />
              </motion.div>
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}

/** Below lg: a swipeable row with dots for the card in view. */
function CardRow({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col gap-4 lg:hidden">
      <ul
        onScroll={(event) => {
          const row = event.currentTarget;
          const step = row.scrollWidth / items.length;
          setActive(Math.min(items.length - 1, Math.round(row.scrollLeft / step)));
        }}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <li key={item.name} className="flex w-[280px] shrink-0 snap-start">
            <TestimonialCard item={item} index={index} className="w-full" />
          </li>
        ))}
      </ul>
      <div aria-hidden className="flex justify-center gap-1.5">
        {items.map((item, index) => (
          <span
            key={item.name}
            className={cn("size-1.5 rounded-full transition-colors", index === active ? "bg-foreground" : "bg-foreground/20")}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The testimonials stage. From lg the heading (`children`) sits in the middle
 * of a dotted stage with the cards around it; below lg the heading comes first
 * and the cards follow as a swipeable row. Dragging is decorative: the cards
 * are a plain list, read in order.
 */
export function TestimonialBoard({ items, children }: { items: Testimonial[]; children: React.ReactNode }) {
  const boundsRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className={cn(
        "relative flex flex-col gap-8 [--stage:#0d0d0d]",
        "lg:block lg:h-[760px] lg:overflow-hidden lg:rounded-[32px] lg:border lg:bg-(--stage)",
      )}
    >
      {/* Flat dot grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden [background-image:radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.07] lg:block"
      />

      {/* The heading block: above the cards; only its text takes the pointer, so cards under the veil stay draggable. */}
      <div className="pointer-events-none relative z-20 flex flex-col items-center gap-4 text-center *:pointer-events-auto lg:absolute lg:top-1/2 lg:left-1/2 lg:w-[620px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:gap-5">
        {/* A flat fade in the stage color, so dimmed cards behind never reduce the text's contrast. */}
        <div
          aria-hidden
          className="pointer-events-none! absolute -inset-x-24 -inset-y-28 -z-10 hidden bg-[radial-gradient(closest-side,var(--stage)_62%,transparent)] lg:block"
        />
        {children}
      </div>

      {/* Drag bounds: 20px inside the stage, room for a card's tilt and drift, so no corner gets clipped. */}
      <div ref={boundsRef} aria-hidden className="pointer-events-none absolute inset-5 hidden lg:block" />
      <DraggableCards items={items} boundsRef={boundsRef} />
      <CardRow items={items} />

      {/* Pointer-only hint; dragging is decorative, so screen readers skip it. */}
      <p aria-hidden className="absolute right-5 bottom-4 z-20 hidden items-center gap-1.5 text-xs text-muted-foreground motion-reduce:hidden! lg:flex">
        <Hand aria-hidden className="size-3.5" />
        Drag the cards
      </p>
    </div>
  );
}
