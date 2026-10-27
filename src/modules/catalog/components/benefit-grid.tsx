"use client";

import { ArrowRight, Check, LayoutGrid, UserRound } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { AnimatedList } from "@/components/ui/animated-list";
import { NumberTicker } from "@/components/ui/number-ticker";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../audience";
import { usePrefersReducedMotion } from "./use-media-query";

/**
 * How a scene renders: `still` is the final state (reduced motion, and the
 * server render); otherwise it waits off screen and plays once in view.
 */
type Stage = { still: boolean; play: boolean };

const ease = "easeOut" as const;
const enter = (delay = 0) => ({ duration: 0.4, ease, delay });

function formatAmount(value: number, decimals: number) {
  return Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

/** Magic UI NumberTicker once playing; a plain formatted figure otherwise. */
function Ticker({ value, decimals = 0, delay = 0, stage }: { value: number; decimals?: number; delay?: number; stage: Stage }) {
  if (stage.still) return <>{formatAmount(value, decimals)}</>;
  if (!stage.play) return <>{formatAmount(0, decimals)}</>;
  return (
    <NumberTicker
      value={value}
      decimalPlaces={decimals}
      delay={delay}
      className="tracking-[inherit] text-inherit dark:text-inherit"
    />
  );
}

// Platform marks, drawn as simple outlines so they sit quietly on the orbit.
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-4.5",
} as const;

function InstagramMark() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TikTokMark() {
  return (
    <svg {...iconProps}>
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c.4 2.6 2.4 4.4 5 4.6" />
    </svg>
  );
}

function YouTubeMark() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.2 9.4v5.2l4.4-2.6z" fill="currentColor" />
    </svg>
  );
}

function XMark() {
  return (
    <svg {...iconProps}>
      <path d="M5 4.5h3.6l10.4 15h-3.6z" fill="currentColor" strokeWidth={1} />
      <path d="M18.5 4.5l-6 6.8M11.4 12.8l-6 6.7" />
    </svg>
  );
}

const PLATFORMS = [
  { name: "Instagram", Mark: InstagramMark },
  { name: "TikTok", Mark: TikTokMark },
  { name: "YouTube", Mark: YouTubeMark },
  { name: "X", Mark: XMark },
];

/** Platform icons circling a center mark; the orbit waits until the card is seen and stands still with reduced motion. */
function PlatformOrbit({ center, stage }: { center: React.ReactNode; stage: Stage }) {
  return (
    <div className="relative flex size-full items-center justify-center">
      {center}
      <OrbitingCircles
        radius={76}
        duration={36}
        iconSize={40}
        className={cn(
          "rounded-full border bg-card text-foreground shadow-sm",
          // Reduced motion: no orbit, each icon parked at its own angle.
          "motion-reduce:animate-none motion-reduce:[transform:rotate(calc(var(--angle)*1deg))_translateY(calc(var(--radius)*1px))_rotate(calc(var(--angle)*-1deg))]",
          !stage.play && "[animation-play-state:paused]",
        )}
      >
        {PLATFORMS.map(({ name, Mark }) => (
          <Mark key={name} />
        ))}
      </OrbitingCircles>
    </div>
  );
}

// Creators

const EARNINGS_BARS = [28, 36, 44, 58, 74, 100];

function RecurringIncomeScene({ stage }: { stage: Stage }) {
  return (
    <div className="flex w-full max-w-60 flex-col gap-3">
      <div>
        <p className="text-xs text-muted-foreground">This month</p>
        <p className="text-3xl font-extrabold tracking-[-0.04em] tabular-nums">
          $<Ticker value={632} decimals={2} stage={stage} />
        </p>
      </div>
      <div className="flex h-20 items-end gap-1.5 rounded-2xl border bg-card p-3">
        {EARNINGS_BARS.map((height, index) => (
          <motion.span
            key={height}
            initial={stage.still ? false : { scaleY: 0, opacity: 0 }}
            animate={stage.still || stage.play ? { scaleY: 1, opacity: 1 } : undefined}
            transition={enter(index * 0.08)}
            style={{ height: `${height}%`, originY: 1 }}
            className={cn("flex-1 rounded-md", index === EARNINGS_BARS.length - 1 ? "bg-primary" : "bg-foreground/15")}
          />
        ))}
      </div>
    </div>
  );
}

/** Offers from the demo catalog, with their listed commission. */
const OFFERS = [
  { name: "Lexi Notes", rate: "20%" },
  { name: "Pulse Coach", rate: "15–25%" },
  { name: "Framecut Studio", rate: "25%" },
];
const JOINED_OFFER = "Lexi Notes";
const LIST_DELAY_MS = 900;

function OfferRow({ name, rate, joined }: { name: string; rate: string; joined: boolean }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border bg-card p-2.5 text-xs">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground font-bold text-background">
        {name[0]}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="text-muted-foreground">{rate} recurring</span>
      </span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-semibold transition-colors duration-500 ease-out motion-reduce:transition-none",
          joined ? "border-primary bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        {joined ? (
          <>
            <Check className="size-3.5" />
            Joined
          </>
        ) : (
          "Join"
        )}
      </span>
    </div>
  );
}

function DealsScene({ stage }: { stage: Stage }) {
  // Flips one offer to "Joined" after every row has arrived.
  const [joined, setJoined] = useState(false);
  useEffect(() => {
    if (!stage.play) return;
    const timer = window.setTimeout(() => setJoined(true), OFFERS.length * LIST_DELAY_MS + 300);
    return () => window.clearTimeout(timer);
  }, [stage.play]);

  const rows = OFFERS.map((offer) => (
    <OfferRow key={offer.name} {...offer} joined={(stage.still || joined) && offer.name === JOINED_OFFER} />
  ));
  if (stage.still) return <div className="flex w-full max-w-72 flex-col gap-2">{[...rows].reverse()}</div>;
  if (!stage.play) return null;
  return (
    <AnimatedList delay={LIST_DELAY_MS} className="w-full max-w-72 gap-2">
      {rows}
    </AnimatedList>
  );
}

function ReferralScene({ stage }: { stage: Stage }) {
  return (
    <PlatformOrbit
      stage={stage}
      center={
        <span className="grid size-14 place-items-center rounded-2xl bg-primary shadow-sm">
          <LogoMark className="size-7 fill-primary-foreground" />
        </span>
      }
    />
  );
}

// Apps

const FUNNEL = ["Visit", "Trial", "Paid"];

function ResultsScene({ stage }: { stage: Stage }) {
  return (
    <div className="flex w-full max-w-sm items-stretch gap-1">
      {FUNNEL.map((step, index) => {
        const paid = index === FUNNEL.length - 1;
        return (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-1">
            {index > 0 ? <ArrowRight aria-hidden className="size-3 shrink-0 text-muted-foreground" /> : null}
            <motion.div
              initial={stage.still ? false : { opacity: 0, y: 8 }}
              animate={stage.still || stage.play ? { opacity: 1, y: 0 } : undefined}
              transition={enter(index * 0.3)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border px-1.5 py-3 text-center",
                paid ? "border-primary bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              <span className="text-sm font-semibold">{step}</span>
              {paid ? (
                <span className="flex flex-col text-[11px] leading-tight font-semibold">
                  <span className="text-sm tabular-nums">
                    +$<Ticker value={7.8} decimals={2} delay={0.9} stage={stage} />
                  </span>
                  commission
                </span>
              ) : (
                <span className="text-[11px] leading-tight text-muted-foreground">no commission</span>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function OrganicScene({ stage }: { stage: Stage }) {
  return (
    <PlatformOrbit
      stage={stage}
      center={
        <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <LayoutGrid className="size-6" />
        </span>
      }
    />
  );
}

/** Oldest first: the list shows the newest on top. */
const JOINS = ["6 min", "3 min", "now"];

function JoinRow({ time }: { time: string }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border bg-card p-2.5 text-xs">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <UserRound className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">A creator joined your offer</span>
      <span className="shrink-0 text-muted-foreground">{time}</span>
    </div>
  );
}

function CreatorsJoinScene({ stage }: { stage: Stage }) {
  const rows = JOINS.map((time) => <JoinRow key={time} time={time} />);
  return (
    <div className="flex w-full max-w-80 flex-col gap-2">
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-semibold">Your offer</span>
        <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground">+3 this week</span>
      </div>
      {stage.still ? (
        [...rows].reverse()
      ) : stage.play ? (
        <AnimatedList delay={LIST_DELAY_MS} className="w-full gap-2">
          {rows}
        </AnimatedList>
      ) : null}
    </div>
  );
}

type Feature = { title: string; body: string; Scene: (props: { stage: Stage }) => React.ReactNode };

const FEATURES: Record<HomeAudience, { heading: string; items: Feature[] }> = {
  creators: {
    heading: "Why creators join",
    items: [
      {
        title: "Monthly recurring income",
        body: "Get paid every time a customer you referred renews, not just once. One good post can keep earning month after month, for as long as they stay subscribed.",
        Scene: RecurringIncomeScene,
      },
      {
        title: "Pick your own deals",
        body: "Browse offers, compare commissions and join the apps you actually like in one click. No pitching, no waiting for brands to DM you.",
        Scene: DealsScene,
      },
      {
        title: "Easy referral links",
        body: "Get your link and code instantly. Use them on Instagram, TikTok, YouTube or anywhere you post, with a separate link per channel to see what works.",
        Scene: ReferralScene,
      },
    ],
  },
  apps: {
    heading: "Why apps join",
    items: [
      {
        title: "Pay only for results",
        body: "No upfront fees and no ad budget. You pay commission only when a creator's audience becomes paying subscribers.",
        Scene: ResultsScene,
      },
      {
        title: "Organic content that converts",
        body: "Creators post native content to people who already trust them. It reads like a recommendation, not an ad.",
        Scene: OrganicScene,
      },
      {
        title: "Creators come to you",
        body: "Creators who are interested in your app find your offer in the catalog and join on their own. No outreach, no negotiation.",
        Scene: CreatorsJoinScene,
      },
    ],
  },
};

/**
 * "Why … join": the three benefits of the selected side as a vertical tab list,
 * with one fixed-size panel showing the active benefit's illustration. Scenes
 * crossfade on switch and replay each time their tab is picked; the first
 * plays once the panel scrolls into view. Final states with reduced motion.
 * The page keys this on the audience, so the toggle resets it to the first tab.
 */
export function BenefitGrid({ audience }: { audience: HomeAudience }) {
  const { heading, items } = FEATURES[audience];
  const reducedMotion = usePrefersReducedMotion();
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(panel, { once: true, amount: 0.4 });
  const [active, setActive] = useState(0);
  // Times each tab has been picked: remounting a scene on a new pick replays it.
  const [runs, setRuns] = useState<number[]>(() => items.map((_, index) => (index === 0 ? 1 : 0)));

  function select(index: number) {
    if (index === active) return;
    setActive(index);
    setRuns((current) => current.map((count, i) => (i === index ? count + 1 : count)));
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const last = items.length - 1;
    const targets: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowRight: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    tabs.current[next]?.focus();
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-4 sm:gap-6">
      <h2 id={`${id}-heading`} className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
        {heading}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-center lg:gap-8">
        {/* Phones and tablets: the panel sits above the list. */}
        <div
          role="tablist"
          aria-labelledby={`${id}-heading`}
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
          className="order-2 flex flex-col gap-1 lg:order-1"
        >
          {items.map((feature, index) => {
            const selected = index === active;
            return (
              <button
                key={feature.title}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                aria-labelledby={`${id}-title-${index}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(index)}
                className={cn(
                  "flex flex-col gap-1 rounded-r-[14px] border-l-[3px] px-4 py-3.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-5",
                  selected
                    ? "border-primary bg-card"
                    : "border-border text-muted-foreground hover:bg-card/50 hover:text-foreground",
                )}
              >
                <span id={`${id}-title-${index}`} className="text-base font-semibold">
                  {feature.title}
                </span>
                <span className="text-sm text-pretty text-muted-foreground">{feature.body}</span>
              </button>
            );
          })}
        </div>

        <div
          ref={panel}
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${active}`}
          tabIndex={0}
          className="relative order-1 h-64 overflow-hidden rounded-[20px] border bg-muted/40 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-72 lg:order-2 lg:h-80"
        >
          <p className="sr-only">{items[active].body}</p>
          {/* Decorative: every scene stays mounted so the outgoing one can fade out. */}
          {items.map(({ title, Scene }, index) => (
            <div
              key={title}
              aria-hidden
              className={cn(
                "absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-200 ease-out motion-reduce:transition-none",
                index === active ? "opacity-100" : "opacity-0",
              )}
            >
              {/* Keyed on the mode (motion only reads `initial` on mount) and on each pick, to replay it. */}
              <Scene
                key={`${reducedMotion}-${runs[index]}`}
                stage={{ still: reducedMotion, play: !reducedMotion && inView && runs[index] > 0 }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
