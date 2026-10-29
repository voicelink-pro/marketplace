"use client";

import { ArrowDown, ArrowRight, Check, Copy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Fragment, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CanvasText } from "@/components/ui/canvas-text";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../audience";
import { CTA_SIZE, PRIMARY_CTA, PRIMARY_CTA_ARROW } from "./cta-styles";
import { HeroDotGrid } from "./hero-dot-grid";
import { HomeSectionLink } from "./home-section-link";
import { usePrefersReducedMotion } from "./use-media-query";

type Screen = "earnings" | "link" | "subscribers" | "plans";

// "\n" + pre-line keeps each headline on exactly two lines; `phrase` is the animated key phrase.
const CONTENT: Record<
  HomeAudience,
  {
    headline: { before: string; phrase: string; after: string };
    /** Desktop lines (>=1024px); joined and wrapped with text-wrap: pretty below that. */
    subtitle: [string, string, string];
    /** `signedOutHref` replaces `href` for visitors without a session. */
    primary: { href: string; signedOutHref?: string; label: string };
    secondaryLabel: string;
    phones: { front: Screen; back: Screen };
    /** Notification bodies; every chip is from the boostlink app. */
    chips: [string, string];
  }
> = {
  creators: {
    headline: { before: "Turn your audience\ninto ", phrase: "recurring income", after: "." },
    subtitle: [
      "Pick the apps you like, join in one click, and earn",
      "a share of every subscription your followers pay,",
      "for as long as they stay.",
    ],
    primary: { href: "/signup", label: "Start as a creator" },
    secondaryLabel: "Discover apps",
    phones: { front: "earnings", back: "link" },
    chips: [
      "New subscriber via your TikTok link. +$7.80 commission.",
      "New subscriber via your Instagram link. +$7.80 commission.",
    ],
  },
  apps: {
    headline: { before: "Creators sell your app.\nYou pay only for ", phrase: "results", after: "." },
    subtitle: [
      "Set a commission per plan. Creators join on their own,",
      "post organic content, and you pay only when",
      "their audience subscribes.",
    ],
    primary: {
      href: "/onboarding/company",
      signedOutHref: "/signup?for=apps&next=/onboarding/company",
      label: "List your app",
    },
    secondaryLabel: "Discover apps",
    phones: { front: "subscribers", back: "plans" },
    chips: ["A creator joined your offer", "New paying subscriber"],
  },
};

/** Lighter and darker yellows at 40%: a texture over the solid #FFD600 letters. Stable reference for CanvasText. */
const PHRASE_TEXTURE = ["rgb(255 243 176 / 0.4)", "rgb(255 229 92 / 0.4)", "rgb(230 192 0 / 0.4)"];

/**
 * Key phrase. Light mode: #111111 on a #FFD600 marker, like "boostlink" in
 * How it works. Dark mode: solid brand-yellow letters; without reduced motion,
 * CanvasText sits on top, fills the same glyphs with the same yellow and lets
 * faint lighter/darker lines drift slowly inside them. The DOM text stays
 * underneath: selectable and read by screen readers; the canvas is decorative.
 */
function KeyPhrase({ text }: { text: string }) {
  const reducedMotion = usePrefersReducedMotion();
  // Unknown until hydration, so the canvas only ever mounts on the client.
  const { resolvedTheme } = useTheme();
  return (
    <span className="relative inline-block rounded-[0.1em] bg-[#FFD600] px-[0.08em] whitespace-nowrap text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary">
      {text}
      {reducedMotion || resolvedTheme !== "dark" ? null : (
        <span aria-hidden className="pointer-events-none absolute inset-0 select-none">
          <CanvasText
            text={text}
            colors={PHRASE_TEXTURE}
            backgroundClassName="bg-primary"
            animationDuration={12}
            lineWidth={2}
            lineGap={5}
            curveIntensity={10}
          />
        </span>
      )}
    </span>
  );
}

/** Six months of example earnings, trending up; the current month is the yellow bar. */
const EARNINGS_BARS = [28, 36, 44, 58, 74, 100];
const FUNNEL = [
  { stage: "Visit", width: "w-full" },
  { stage: "Trial", width: "w-2/3" },
  { stage: "Paid", width: "w-1/3" },
];

function EarningsScreen() {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <div>
        <p className="text-muted-foreground">This month</p>
        <p className="text-4xl font-extrabold tracking-[-0.04em] tabular-nums">$632.00</p>
      </div>
      <div className="flex h-24 items-end gap-2 rounded-2xl border bg-card p-3">
        {EARNINGS_BARS.map((height, index) => (
          <span
            key={height}
            style={{ height: `${height}%` }}
            className={cn(
              "flex-1 rounded-md",
              index === EARNINGS_BARS.length - 1 ? "bg-primary" : "bg-foreground/15",
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl border bg-card p-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground font-bold text-background">L</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex justify-between gap-2">
            <span className="truncate font-semibold">Lexi Notes</span>
            <span className="font-semibold tabular-nums">+$7.80</span>
          </span>
          <span className="text-muted-foreground">renews monthly</span>
        </span>
      </div>
    </div>
  );
}

function LinkScreen() {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium">
        <Check className="size-3 text-primary-ink" />
        You’ve joined
      </span>
      <div>
        <p className="text-muted-foreground">Your commission</p>
        <p className="text-4xl font-extrabold tracking-[-0.04em]">20%</p>
        <p className="text-muted-foreground">on every renewal</p>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3">
        <p className="text-muted-foreground">Your link</p>
        <p className="truncate font-mono">boostlink/r/your-name</p>
        <span className="inline-flex items-center justify-center gap-1 rounded-full bg-primary py-1.5 font-semibold text-primary-foreground">
          <Copy className="size-3" />
          Copy link
        </span>
      </div>
      <div className="flex items-center justify-between rounded-2xl border bg-card p-3">
        <span className="text-muted-foreground">Your code</span>
        <span className="font-mono font-semibold">YOURNAME</span>
      </div>
    </div>
  );
}

function SubscribersScreen() {
  return (
    <div className="flex flex-col gap-4 text-xs">
      <div>
        <p className="text-muted-foreground">Paying subscribers from creators</p>
        <p className="text-4xl font-extrabold tracking-[-0.04em] tabular-nums">40</p>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3">
        {FUNNEL.map(({ stage, width }) => {
          const paid = stage === "Paid";
          return (
            <span
              key={stage}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-semibold",
                width,
                paid ? "bg-primary text-primary-foreground" : "bg-foreground/10",
              )}
            >
              {stage}
            </span>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
        <span className="text-muted-foreground">You paid</span>
        <span className="font-semibold">commission only</span>
      </div>
    </div>
  );
}

function PlansScreen() {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <p className="text-sm font-bold">Plans & commissions</p>
      {[
        { name: "Monthly", price: "$19 / month", rate: "20%" },
        { name: "Annual", price: "$190 / year", rate: "15%" },
      ].map((plan) => (
        <div key={plan.name} className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3">
          <span className="flex flex-col">
            <span className="font-semibold">{plan.name}</span>
            <span className="text-muted-foreground">{plan.price}</span>
          </span>
          <span className="rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground">
            {plan.rate} recurring
          </span>
        </div>
      ))}
      <div className="rounded-2xl bg-muted p-3">
        <p className="text-muted-foreground">Creators will see</p>
        <p className="font-semibold">20% recurring · $3.80 per customer / month</p>
      </div>
    </div>
  );
}

const SCREENS: Record<Screen, () => React.ReactNode> = {
  earnings: EarningsScreen,
  link: LinkScreen,
  subscribers: SubscribersScreen,
  plans: PlansScreen,
};

/** Illustration only: the product's own screens, with example values. */
function PhoneMock({ screen }: { screen: Screen }) {
  const Content = SCREENS[screen];
  return (
    <div className="w-60 rounded-[2.75rem] border-[9px] border-foreground bg-background p-4 shadow-2xl lg:w-64">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-foreground/15" />
      <div className="mb-4 flex items-center gap-1">
        <LogoMark className="size-4" />
        <span className="text-xs font-bold tracking-[-0.04em]">boostlink</span>
      </div>
      <Content />
    </div>
  );
}

/** The front phone of one side's hero, for other brand surfaces such as the auth panel. */
export function AudiencePhone({ audience }: { audience: HomeAudience }) {
  return <PhoneMock screen={CONTENT[audience].phones.front} />;
}

/** Accessible names for the back phone, which brings its screen forward. */
const SHOW_SCREEN: Record<Screen, string> = {
  earnings: "Show earnings screen",
  link: "Show link screen",
  subscribers: "Show subscribers screen",
  plans: "Show plans screen",
};

/** Where a phone sits: in front (tilted left) or behind (tilted right, smaller). Phones under 640px show only the front one. */
// The front phone is disabled but still catches clicks, so only the visible part of the back phone swaps.
const FRONT_SLOT =
  "pointer-events-auto z-20 top-0 -translate-x-1/2 rotate-[-4deg] scale-100 opacity-100 sm:top-10 sm:-translate-x-[72%] sm:rotate-[-9deg] lg:top-1/2 lg:-translate-y-[46%]";
const BACK_SLOT =
  "z-10 top-6 -translate-x-[10%] rotate-[8deg] scale-90 opacity-95 max-sm:hidden lg:top-1/2 lg:-translate-y-[56%] pointer-events-auto cursor-pointer";

/**
 * iOS-style notification over the phones: header row (app icon, name, time)
 * above one block of body text. Fades in after them, then floats
 * a few pixels on a slow loop; appears at once and stays still with reduced
 * motion. Motion's hook reads the setting on the first client render, so the
 * server-hidden chip never flashes.
 */
function NotificationChip({ text, delay, className }: { text: string; delay: number; className: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut", delay }}
      className={cn("absolute max-sm:hidden", className)}
    >
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: delay + 0.4 }}
        className="flex w-56 flex-col gap-1.5 rounded-[18px] lg:w-64 border bg-background/85 p-3 text-xs shadow-xl backdrop-blur-md"
      >
        <span className="flex items-center gap-1.5">
          {/* App icon: the black "b" on a brand-yellow rounded square. */}
          <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-primary">
            <LogoMark className="size-3 fill-primary-foreground" />
          </span>
          <span className="flex-1 font-semibold text-muted-foreground">boostlink</span>
          <span className="text-muted-foreground">now</span>
        </span>
        <span className="leading-snug font-medium">{text}</span>
      </motion.div>
    </motion.div>
  );
}

/**
 * Home hero: one large rounded stage on a faint dot grid. The header toggle
 * switches the whole page between the creator and the company version.
 * Desktop: copy on the left, phones over the brand mark on the right.
 * Below lg the phones sit under the copy, cropped by the card's bottom edge;
 * phones under 640px show only the front screen.
 */
export function HomeHero({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const content = CONTENT[audience];
  const primaryHref = (!signedIn && content.primary.signedOutHref) || content.primary.href;
  // Tied to the audience, so switching the toggle puts the default screen back in front.
  const [swappedFor, setSwappedFor] = useState<HomeAudience | null>(null);
  const swapped = swappedFor === audience;
  const phoneButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const focusBackPhone = useRef(false);

  // After a swap the clicked phone is in front and disabled; keep keyboard focus on the one now behind.
  useEffect(() => {
    if (!focusBackPhone.current) return;
    focusBackPhone.current = false;
    phoneButtons.current[swapped ? 0 : 1]?.focus();
  }, [swapped]);

  const phones = [content.phones.front, content.phones.back];

  return (
    <section
      aria-labelledby="home-hero-heading"
      // isolate: the phones' and chips' z-index stay inside the hero, below the sticky header.
      className="relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-linear-to-r from-muted to-card px-6 pt-8 sm:px-12 sm:pt-14 lg:min-h-[34rem] lg:flex-row lg:items-center lg:px-16 lg:py-14"
    >
      {/* Dot grid, faded out towards the edges; nudged by the cursor on desktop. */}
      <HeroDotGrid />

      {/* Container query: the headline scales with its column so both lines always fit. */}
      <div className="@container relative flex w-full flex-col items-start gap-5 sm:gap-7 lg:max-w-[56%]">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1
            id="home-hero-heading"
            className="text-[length:min(7.8cqi,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.045em] whitespace-pre-line"
          >
            {content.headline.before}
            <KeyPhrase text={content.headline.phrase} />
            {content.headline.after}
          </h1>
          <p className="max-w-lg text-base text-pretty text-muted-foreground sm:text-lg lg:max-w-none">
            {content.subtitle.map((line, index) => (
              <Fragment key={line}>
                {index > 0 ? (
                  <>
                    {" "}
                    <br className="max-lg:hidden" />
                  </>
                ) : null}
                {line}
              </Fragment>
            ))}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="lg" className={PRIMARY_CTA}>
            <Link href={primaryHref}>
              {content.primary.label}
              <ArrowRight aria-hidden className={PRIMARY_CTA_ARROW} />
            </Link>
          </Button>
          {/* In-page anchor: keeps the query, only scrolls to the catalog. */}
          {reducedMotion ? (
            <Button asChild size="lg" variant="outline" className={CTA_SIZE}>
              <HomeSectionLink section="offers" defaultAudience={audience}>
                {content.secondaryLabel}
                <ArrowDown aria-hidden className="size-4.5" />
              </HomeSectionLink>
            </Button>
          ) : (
            <HoverBorderGradient
              as="div"
              duration={1.5}
              containerClassName="bg-border max-sm:w-full dark:bg-border [--hover-border-highlight:var(--primary)] [--hover-border-spot:var(--primary)]"
              className="bg-background p-0 text-foreground max-sm:w-full"
            >
              {/* 48px inside the gradient's 1px padding and border: 52px overall, like the primary. */}
              <HomeSectionLink
                section="offers"
                defaultAudience={audience}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {content.secondaryLabel}
                <ArrowDown aria-hidden className="size-4.5" />
              </HomeSectionLink>
            </HoverBorderGradient>
          )}
        </div>
      </div>

      {/* Brand stage: the current audience's screen in front, the other one tilted behind (click it to swap), two notifications on top. */}
      <div className="pointer-events-none relative -mx-6 mt-8 h-80 sm:-mx-12 sm:mt-10 sm:h-[26rem] lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:h-auto lg:w-[44%]">
        <LogoMark className="absolute -right-24 -bottom-40 hidden size-[36rem] rotate-[-8deg] lg:block xl:size-[40rem]" />
        {phones.map((screen, index) => {
          const inFront = (index === 0) !== swapped;
          return (
            // One element per phone for its whole life, so the slot change transitions instead of remounting.
            <button
              key={index}
              ref={(node) => {
                phoneButtons.current[index] = node;
              }}
              type="button"
              disabled={inFront}
              aria-hidden={inFront || undefined}
              aria-label={inFront ? undefined : SHOW_SCREEN[screen]}
              onClick={() => {
                focusBackPhone.current = true;
                setSwappedFor(swapped ? null : audience);
              }}
              className={cn(
                "group absolute left-1/2 rounded-[2.75rem] text-left outline-none transition-[translate,rotate,scale,top,opacity,z-index] duration-450 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                inFront ? FRONT_SLOT : BACK_SLOT,
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "transition-[translate] duration-200 ease-out motion-reduce:transition-none",
                  !inFront && "motion-safe:group-hover:-translate-y-0.5",
                )}
              >
                <PhoneMock screen={screen} />
              </div>
            </button>
          );
        })}
        <NotificationChip
          text={content.chips[0]}
          delay={0.5}
          className="z-30 top-0 left-[8%] lg:top-[14%] lg:-left-[6%]"
        />
        <NotificationChip
          text={content.chips[1]}
          delay={0.8}
          className="z-30 right-[3%] bottom-6 lg:right-[2%] lg:bottom-[7%]"
        />
      </div>
    </section>
  );
}
