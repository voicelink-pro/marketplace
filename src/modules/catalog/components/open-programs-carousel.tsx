"use client";

import { BadgeCheck, ChevronDown, ChevronUp, User } from "lucide-react";
import Link from "next/link";
import {
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type TransitionEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { LinkPendingCardOverlay, LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { cn } from "@/lib/utils";
import { APP_PLATFORM_LABELS, type AppPlatform } from "../constants";
import { AppLogo } from "./app-card";
import { CarouselArrow, useCarouselKeys } from "./carousel-controls";
import { TOGGLE_PILL } from "./cta-styles";
import { PlatformIcon } from "./platform-icons";
import { usePrefersReducedMotion } from "./use-media-query";

/** One published program, already formatted on the server. */
export type OpenProgram = {
  id: string;
  href: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  coverUrl: string | null;
  /** Deduplicated marks: "web" (also for SaaS), "ios", "android". */
  platforms: AppPlatform[];
  /** Time since publishing: "3h", "1d", "2w", "3mo". */
  age: string;
  /** "30%" or "10–12%"; null while the app has no commission set. */
  commission: string | null;
  /** Not in the backend yet (see demo-program-stats.ts); without them the pill or the budget row hides. */
  creatorsJoined?: number;
  budgetUsedMinor?: number;
  budgetTotalMinor?: number;
};

const GAP = 16;
const ADVANCE_MS = 2800;
/** Auto-advance waits this long after an arrow, key or swipe. */
const MANUAL_HOLD_MS = 6000;
/** Horizontal travel that counts as a swipe. */
const SWIPE_PX = 40;
/** Cards needed on each side of the active one to fill the widest row (1280px). */
const SIDE_CARDS = 5;

/** Opacity by distance from the active card. */
const DIM = [1, 0.6, 0.35];

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactUsd = (minor: number) => COMPACT_USD.format(minor / 100);

/** `eager`: on screen at first paint, so its cover loads right away; the rest load lazily. */
function ProgramCard({ program, eager }: { program: OpenProgram; eager: boolean }) {
  const { budgetUsedMinor: used, budgetTotalMinor: total } = program;
  const budget = used !== undefined && total !== undefined && total > 0 ? { used, total } : null;
  return (
    <Link
      href={program.href}
      className="relative flex h-full flex-col overflow-hidden rounded-[20px] border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Dims the card with a corner spinner while the app's page loads. */}
      <LinkPendingCardOverlay />
      <div className="h-[180px] shrink-0 bg-muted">
        {program.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={program.coverUrl}
            alt=""
            loading={eager ? "eager" : "lazy"}
            className="size-full object-cover object-top"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <AppLogo app={program} className="size-14 text-xl" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        {/* On the 300px phone card the platform chips shrink to 24px, so the name gets the room first. */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <p className="flex min-w-0 items-center gap-1.5 text-sm">
            <AppLogo app={program} className="size-6 rounded-md text-xs" />
            <span className="truncate font-medium">{program.name}</span>
            {/* Every published app passed the admin review. */}
            <BadgeCheck aria-hidden className="size-4 shrink-0 fill-primary text-primary-foreground" />
            <span className="sr-only"> Verified</span>
            <span className="shrink-0 text-muted-foreground">
              <span aria-hidden>· </span>
              <span className="sr-only">published </span>
              {program.age}
              <span className="sr-only"> ago</span>
            </span>
          </p>
          {program.platforms.length > 0 ? (
            <ul aria-label="Platforms" className="flex shrink-0 items-center gap-1">
              {program.platforms.map((platform) => (
                <li
                  key={platform}
                  title={APP_PLATFORM_LABELS[platform]}
                  className="grid size-6 place-items-center rounded-full bg-muted text-foreground sm:size-8"
                >
                  <PlatformIcon platform={platform} className="size-3.5 sm:size-4" />
                  <span className="sr-only">{APP_PLATFORM_LABELS[platform]}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <h3 className="truncate text-lg leading-snug font-bold">{program.tagline}</h3>

        <div className="mt-auto flex flex-col gap-2">
          {/* One line at 360px; on the 300px phone card the pills wrap under the budget rather than shrink. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {budget ? (
              <p className="text-sm font-semibold tabular-nums">
                {compactUsd(budget.used)}
                <span className="text-muted-foreground">/{compactUsd(budget.total)}</span>
                <span className="sr-only"> of the budget used</span>
              </p>
            ) : (
              <span />
            )}
            <div className="flex shrink-0 items-center gap-1 tabular-nums">
              {program.creatorsJoined !== undefined ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                  <User aria-hidden className="size-3.5" />
                  {program.creatorsJoined}
                  <span className="sr-only"> creators joined</span>
                </span>
              ) : null}
              {program.commission ? (
                <span className="rounded-full bg-primary/15 px-3 py-1.5 text-sm text-primary">
                  <span className="font-medium">
                    Recurring<span aria-hidden> ·</span>{" "}
                  </span>
                  <span className="font-bold">{program.commission}</span>
                  <span className="sr-only"> commission</span>
                </span>
              ) : null}
            </div>
          </div>
          {budget ? (
            <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (budget.used / budget.total) * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/**
 * One row of program cards with the active card centered. Cards dim with
 * distance from the center and the row fades out at both edges. Arrow buttons,
 * the Left/Right keys and a swipe move one card; with reduced motion manual
 * moves jump. Tabbing to a card centers it. With `autoAdvance` it steps one card
 * to the left every 2.8s and loops (waiting 6s after a manual move), pausing on
 * hover, keyboard focus, off-screen, in a hidden tab and with reduced motion.
 */
function ProgramRow({
  programs,
  autoAdvance,
  label,
}: {
  programs: OpenProgram[];
  autoAdvance: boolean;
  /** Names the arrows' row for screen readers: "Previous program in Most popular". */
  label?: string;
}) {
  const count = programs.length;
  const loop = count > 1;
  // The list repeated so the row is always full; the active card stays in the middle copy.
  const copies = loop ? 2 * Math.ceil(SIDE_CARDS / count) + 1 : 1;
  const base = Math.floor(copies / 2) * count;

  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(base);
  // Off for one frame after the silent jump back to the middle copy.
  const [animate, setAnimate] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [held, setHeld] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const playing =
    autoAdvance && loop && !reducedMotion && !hovered && !focused && !held && onScreen && tabVisible;

  /** The same card in the middle copy. */
  const toMiddle = (slot: number) => base + ((((slot - base) % count) + count) % count);

  /** One card left (-1) or right (+1), by hand. */
  function step(delta: -1 | 1) {
    if (!loop) return;
    setIndex((current) => {
      // Without a transition there is no transitionend to re-center on, so jump straight to the middle copy.
      if (reducedMotion) return toMiddle(current + delta);
      // Rapid steps before the slide ends stay inside the rendered copies.
      return Math.min(Math.max(current + delta, base - count), base + 2 * count - 1);
    });
    setHeld(true);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setHeld(false), MANUAL_HOLD_MS);
  }

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((current) => current + 1), ADVANCE_MS);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !autoAdvance) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(row);
    return () => observer.disconnect();
  }, [autoAdvance]);

  useEffect(() => {
    if (!autoAdvance) return;
    const update = () => setTabVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [autoAdvance]);

  useEffect(() => {
    if (animate) return;
    // Two frames: the jump is painted without a transition before transitions come back.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate]);

  function handleTransitionEnd(event: TransitionEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    // Outside the middle copy: the same card there looks identical, so jump to it unseen.
    if (index < base || index >= base + count) {
      setAnimate(false);
      setIndex(toMiddle);
    }
  }

  // Only keyboard focus pauses: a clicked arrow keeps focus, and the 6s hold covers clicks.
  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.target.matches(":focus-visible")) setFocused(true);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  }

  const handleKeyDown = useCarouselKeys(step);

  // Touch and pen only; `touch-pan-y` leaves vertical scrolling to the browser.
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY, moved: false };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      start.moved = true;
      step(dx < 0 ? 1 : -1);
    } else {
      swipe.current = null;
    }
  }

  // A swipe that ends on a card doesn't open it.
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (swipe.current?.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
    swipe.current = null;
  }

  const transitions = animate && !reducedMotion;
  const suffix = label ? ` in ${label}` : "";

  return (
    // Full width of the page column. Arrows and keys work anywhere inside; only the row itself is masked.
    <div
      ref={rowRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="relative -mx-4 sm:-mx-6"
    >
      {/* The edges fade into the background. */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (swipe.current = null)}
        onClickCapture={handleClickCapture}
        className="touch-pan-y overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        <ul
          aria-live="off"
          onTransitionEnd={handleTransitionEnd}
          // Starts at the center of the row, then moves left so the active card's middle sits there.
          // --card is the card width: 300px on phones, 360px from sm.
          style={{
            transform: `translateX(calc(-1 * (${index} * (var(--card) + ${GAP}px) + var(--card) / 2)))`,
            gap: GAP,
          }}
          className={cn(
            "ml-[50%] flex w-max [--card:300px] sm:[--card:360px]",
            transitions && "transition-transform duration-500 ease-out",
          )}
        >
          {Array.from({ length: copies }, (_, copy) =>
            programs.map((program, position) => {
              const slot = copy * count + position;
              const distance = Math.min(Math.abs(slot - index), DIM.length - 1);
              // Copies for the loop: inert and hidden, so only the middle copy is focusable and read.
              // Taps on a copy fall through to the row, so swipes still work.
              const clone = slot < base || slot >= base + count;
              return (
                <li
                  key={`${copy}-${program.id}`}
                  aria-hidden={clone || undefined}
                  inert={clone}
                  onFocus={clone ? undefined : () => setIndex(slot)}
                  style={{ opacity: DIM[distance] }}
                  className={cn("w-(--card) shrink-0", transitions && "transition-opacity duration-500 ease-out")}
                >
                  {/* The first row's cards around the start position are on screen at first paint. */}
                  <ProgramCard program={program} eager={autoAdvance && Math.abs(slot - base) <= 2} />
                </li>
              );
            }),
          )}
        </ul>
      </div>

      {loop ? (
        <>
          {/* Over the faded edges, clear of the centered card: 32px at the screen edges on phones. */}
          <CarouselArrow
            direction="previous"
            label={`Previous program${suffix}`}
            onClick={() => step(-1)}
            className="left-1 sm:left-4"
          />
          <CarouselArrow
            direction="next"
            label={`Next program${suffix}`}
            onClick={() => step(1)}
            className="right-1 sm:right-4"
          />
        </>
      ) : null}
    </div>
  );
}

/** A titled row under the first one, sorted on the server. */
export type ProgramRowData = { title: string; programs: OpenProgram[] };


/** Same inset as the hero copy, so headers line up with the headline above. */
const INSET = "px-6 sm:px-12 lg:px-16";

/** The small label over each row. `!`: the global h3 weight is unlayered and would win otherwise. */
const ROW_LABEL = cn("text-sm font-semibold! text-muted-foreground", INSET);

/**
 * "Open programs" on the creators home page, right under the hero: the most
 * popular programs in an auto-advancing row, then "See more programs", which
 * expands (height transition) to two manual rows from the data already loaded:
 * highest commission and newest, mounted only on the first expand. Expanded, the button reads "Show less"
 * and a "See all programs" link to Discover follows the last row. Collapsed rows
 * are inert, so they are skipped by keyboard and screen readers.
 */
export function OpenProgramsCarousel({
  first,
  moreRows,
  totalCount,
  seeAllHref,
}: {
  /** Always shown, auto-advancing. */
  first: ProgramRowData;
  moreRows: ProgramRowData[];
  /** Every published app, not just the cards in the row. */
  totalCount: number;
  seeAllHref: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const moreId = useId();

  return (
    // `#offers`: "Discover apps" in the header, footer and hero scrolls here. Below lg the header carries the audience row, so more room.
    <section
      id="offers"
      aria-labelledby="open-programs-heading"
      className="flex scroll-mt-36 flex-col gap-6 sm:gap-8 lg:scroll-mt-24"
    >
      <div className={cn("flex flex-col gap-2", INSET)}>
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-primary" />
          Open programs right now
        </p>
        <h2 id="open-programs-heading" className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
          {totalCount} {totalCount === 1 ? "app" : "apps"} looking for creators
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className={ROW_LABEL}>{first.title}</h3>
        <ProgramRow programs={first.programs} autoAdvance label={first.title} />
      </div>

      {moreRows.length > 0 ? (
        // No gap of its own: collapsed, the button sits one section gap under the first row.
        <div className="flex flex-col">
          {/* 0fr → 1fr animates the height to the rows' own. The clip box takes the rows' bleed
              (-mx) as padding, so they keep the first row's full width. */}
          <div
            id={moreId}
            inert={!expanded}
            className={cn(
              "-mx-4 grid sm:-mx-6 motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            {/* The clip box has no padding of its own, so 0fr collapses it to nothing. */}
            <div className="min-h-0 overflow-hidden">
              {/* Mounted on the first "See more programs", then kept, so "Show less" can animate the height. */}
              {mounted ? (
                <div className="flex flex-col gap-6 px-4 pb-6 sm:gap-8 sm:px-6 sm:pb-8">
                  {moreRows.map((row) => (
                    <div key={row.title} className="flex flex-col gap-3">
                      <h3 className={ROW_LABEL}>{row.title}</h3>
                      <ProgramRow programs={row.programs} autoAdvance={false} label={row.title} />
                    </div>
                  ))}
                  <Link
                    href={seeAllHref}
                    className="group inline-flex items-center gap-1.5 self-center rounded-sm text-sm font-semibold underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    See all programs
                    <LinkPendingIcon
                      aria-hidden
                      className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={moreId}
            onClick={() => {
              setMounted(true);
              setExpanded((open) => !open);
            }}
            className={TOGGLE_PILL}
          >
            {expanded ? "Show less" : "See more programs"}
            {expanded ? (
              <ChevronUp aria-hidden className="size-4" />
            ) : (
              <ChevronDown aria-hidden className="size-4" />
            )}
          </button>
        </div>
      ) : null}
    </section>
  );
}
