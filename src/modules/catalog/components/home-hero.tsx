"use client";

import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CanvasText } from "@/components/ui/canvas-text";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useAudienceNavClick } from "@/components/layout/audience-nav-provider";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../audience";
import { CTA_SIZE } from "./cta-styles";
import { HERO_CONTENT as CONTENT, type HeroChip, HERO_STAGE, type HeroScreen as Screen } from "./home-hero-content";
import { HeroDotGrid } from "./hero-dot-grid";
import { HomeSectionLink } from "./home-section-link";
import { PrimaryCta } from "./primary-cta";
import { TrustLine } from "./trust-line";
import { usePrefersReducedMotion } from "./use-media-query";

/** Lighter and darker yellows at 40%: a texture over the solid #FFD600 letters. Stable reference for CanvasText. */
const PHRASE_TEXTURE = ["rgb(255 243 176 / 0.4)", "rgb(255 229 92 / 0.4)", "rgb(230 192 0 / 0.4)"];

/**
 * Key phrase: solid brand-yellow letters. With `textured` and without reduced
 * motion, CanvasText sits on top, fills the same glyphs with the same yellow
 * and lets faint lighter/darker lines drift slowly inside them. The DOM text
 * stays underneath: selectable and read by screen readers; the canvas is
 * decorative and mounts only on the client (reduced motion is assumed until
 * hydration).
 */
function KeyPhrase({ text, textured }: { text: string; textured: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <span className="relative inline-block whitespace-nowrap text-primary">
      {text}
      {!textured || reducedMotion ? null : (
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

/**
 * Example month. Each amount is subscribers × rate × monthly price (9 × 20% × $9.99 = $17.98,
 * 4 × 30% × $12.99 = $15.59); together $33.57. Two rows keep the phone about as tall as the chart one.
 */
const RECEIPT = [
  { name: "Note-taking app", subscribers: 9, rate: "20%", price: "$9.99", amount: "$17.98" },
  { name: "Language app", subscribers: 4, rate: "30%", price: "$12.99", amount: "$15.59" },
];

function ReceiptScreen() {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <ul className="flex flex-col">
        {RECEIPT.map((app) => (
          <li
            key={app.name}
            className="flex items-start justify-between gap-2 border-b border-dashed py-2.5 first:pt-0 last:border-b-0"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">{app.name}</span>
              {/* Breaks only after the dot when it needs two lines. */}
              <span className="text-[11px] leading-snug text-muted-foreground">
                <span className="whitespace-nowrap">{app.subscribers} subscribers ·</span>{" "}
                <span className="whitespace-nowrap">
                  {app.rate} of {app.price}/mo
                </span>
              </span>
            </span>
            <span className="font-semibold tabular-nums">{app.amount}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-2 border-t pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-2xl leading-none font-extrabold tracking-[-0.04em] tabular-nums">$33.57</span>
      </div>
      <p className="flex items-center gap-1.5 font-semibold text-primary-ink">
        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
        Paid out via Stripe
      </p>
    </div>
  );
}

/**
 * Six months of example earnings, growing; the current month is the yellow bar. Together
 * $150.36; each bar's height is its amount relative to the current month. Only the total
 * is shown, so the months don't need to match the receipt.
 */
const EARNINGS_MONTHS = [
  { month: "Jun", amount: 10.68 },
  { month: "Jul", amount: 15.6 },
  { month: "Aug", amount: 20.94 },
  { month: "Sep", amount: 27.1 },
  { month: "Oct", amount: 34.98 },
  { month: "Nov", amount: 41.06 },
];
const EARNINGS_PEAK = 41.06;

function ChartScreen() {
  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Right-aligned: as the back phone, its left part sits under the front one. */}
      <div className="flex flex-col items-end gap-1 text-right">
        <p className="text-4xl leading-none font-extrabold tracking-[-0.045em] tabular-nums">$150.36</p>
        <p className="text-muted-foreground">Last 6 months</p>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3">
        <div className="flex h-28 items-end gap-2">
          {EARNINGS_MONTHS.map(({ month, amount }, index) => (
            <span
              key={month}
              style={{ height: `${(amount / EARNINGS_PEAK) * 100}%` }}
              className={cn(
                "flex-1 rounded-md",
                index === EARNINGS_MONTHS.length - 1 ? "bg-primary" : "bg-foreground/15",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {EARNINGS_MONTHS.map(({ month }) => (
            <span key={month} className="flex-1 text-center text-[10px] text-muted-foreground">
              {month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const FUNNEL = [
  { stage: "Visit", width: "w-full" },
  { stage: "Trial", width: "w-2/3" },
  { stage: "Paid", width: "w-1/3" },
];

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

/** Each screen and its header: the app name by default, or the screen's own title, optionally marked as an example. */
const SCREENS: Record<Screen, { Content: () => React.ReactNode; title?: string; example?: boolean }> = {
  receipt: { Content: ReceiptScreen, title: "Earnings", example: true },
  chart: { Content: ChartScreen, title: "Earnings", example: true },
  subscribers: { Content: SubscribersScreen },
  plans: { Content: PlansScreen },
};

/** Illustration only: the product's own screens, with example values. */
function PhoneMock({ screen }: { screen: Screen }) {
  const { Content, title, example } = SCREENS[screen];
  return (
    <div className="w-60 rounded-[2.75rem] border-[9px] border-foreground bg-background p-4 shadow-2xl lg:w-64">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-foreground/15" />
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          <LogoMark className="size-4" />
          <span className="text-xs font-bold tracking-[-0.04em]">{title ?? "boostlink"}</span>
        </span>
        {example ? (
          <span className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Example</span>
        ) : null}
      </div>
      <Content />
    </div>
  );
}

/** Accessible names for the back phone, which brings its screen forward. */
const SHOW_SCREEN: Record<Screen, string> = {
  receipt: "Show earnings receipt",
  chart: "Show earnings chart",
  subscribers: "Show subscribers screen",
  plans: "Show plans screen",
};

/** Where a phone sits: in front (tilted left) or behind (tilted right, smaller). Phones under 640px show only the front one. */
// The front phone is disabled but still catches clicks, so only the visible part of the back phone swaps.
const FRONT_SLOT =
  "pointer-events-auto z-20 top-0 -translate-x-1/2 rotate-[-4deg] scale-100 opacity-100 sm:top-10 sm:-translate-x-[72%] sm:rotate-[-9deg] lg:top-1/2 lg:-translate-y-[46%]";
const BACK_SLOT =
  "z-10 top-6 -translate-x-[10%] rotate-[8deg] scale-90 opacity-95 max-sm:hidden lg:top-1/2 lg:-translate-y-[56%] xl:-translate-x-[6%] pointer-events-auto cursor-pointer";

/**
 * iOS-style notification over the phones: header row (app icon, name, time)
 * above the body text and an optional amount on its own line. Fades in after
 * them, then bobs a few pixels on a slow loop, or with `drift` follows the CSS
 * drift; appears at once and stays still with reduced motion. Motion's hook
 * reads the setting on the first client render, so the server-hidden chip
 * never flashes.
 */
function NotificationChip({
  chip,
  delay,
  drift,
  className,
}: {
  chip: HeroChip;
  delay: number;
  /** CSS drift instead of the bob, started at this point of its cycle (e.g. "-3.5s") so two chips never move in step. */
  drift?: string;
  className: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    // The entry is a CSS animation, not a motion one: server-rendered at opacity 0 and waiting on hydration
    // and the JS frame loop, the chips could stay invisible. Without the animation (reduced motion) they just show.
    <div
      aria-hidden
      style={{ animationDelay: `${delay}s` }}
      className={cn("absolute max-sm:hidden motion-safe:animate-rise-in", className)}
    >
      <motion.div
        animate={reducedMotion || drift ? undefined : { y: [0, -3, 0] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, delay: delay + 0.4 }}
        style={drift ? { animationDelay: drift } : undefined}
        className={cn(
          "flex w-56 flex-col gap-1.5 rounded-[18px] lg:w-64 border bg-background/85 p-3 text-xs shadow-xl backdrop-blur-md",
          drift && "motion-safe:animate-float-drift",
        )}
      >
        <span className="flex items-center gap-1.5">
          {/* App icon: the black "b" on a brand-yellow rounded square. */}
          <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-primary">
            <LogoMark className="size-3 fill-primary-foreground" />
          </span>
          <span className="flex-1 font-semibold text-muted-foreground">boostlink</span>
          <span className="text-muted-foreground">now</span>
        </span>
        <span className="leading-snug font-medium">
          {chip.text}
          {chip.amount ? <span className="block font-semibold text-foreground">{chip.amount}</span> : null}
        </span>
      </motion.div>
    </div>
  );
}

/**
 * Headline periods: in Plus Jakarta Sans the "." glyph carries ~0.13em of empty space on its
 * left, which reads as a gap at display size. Each period is pulled in by 0.09em and kept in one
 * unbreakable run with the word before it.
 */
function tightPeriods(text: string): React.ReactNode[] {
  return text.split(/(\S*\.)/).map((part, index) =>
    part.endsWith(".") ? (
      <span key={index} className="whitespace-nowrap">
        {part.slice(0, -1)}
        <span className="-ml-[0.09em]">.</span>
      </span>
    ) : (
      part
    ),
  );
}

/**
 * The line above the hero box: whose page this is, then a link to the other home page.
 * Sized by its own width (`@container`), not the viewport: below 36rem (phones and
 * 640–767px) it wraps into two lines, brand + audience then the link, and the divider hides.
 * Below 20rem the link drops under its lead-in on `/for-apps`, so both pages reserve
 * three lines there and the box below never moves between them.
 */
function HeroLabel({ label }: { label: (typeof CONTENT)[HomeAudience]["label"] }) {
  const onLinkClick = useAudienceNavClick(label.link.href);
  return (
    // Same inset as the hero copy, so the label lines up with the headline.
    <div className="@container px-6 sm:px-12 lg:px-16">
      <p className="flex flex-col items-start gap-y-1.5 text-sm sm:text-[15px] @max-[20rem]:min-h-18 @xl:flex-row @xl:items-center @xl:gap-x-2">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {/* The phone's "b Earnings" glyph: the yellow "b" on its own. */}
          <LogoMark className="size-4" />
          <span className="sr-only">{siteConfig.name} </span>
          <span className="font-semibold text-foreground">{label.audience}</span>
        </span>
        <span aria-hidden className="hidden h-4 w-px shrink-0 bg-border @xl:block" />
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-muted-foreground">
          {label.lead}
          <Link
            href={label.link.href}
            onClick={onLinkClick}
            className="group inline-flex items-center gap-1 rounded-sm whitespace-nowrap text-foreground underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {label.link.label}
            <ArrowRight
              aria-hidden
              className="size-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </Link>
        </span>
      </p>
    </div>
  );
}

/**
 * Home hero: one large rounded stage on a faint dot grid, with the audience
 * label above it. Desktop: copy on the left, the illustration over the brand
 * mark on the right; below lg it sits under the copy, cropped by the card's
 * bottom edge: two phones (the back one swaps forward; under 640px only the
 * front one) and two notifications. Creators: a larger headline, a plain yellow
 * key phrase and a slowly drifting stage. Apps: a textured key phrase.
 */
export function HomeHero({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const content = CONTENT[audience];
  const creators = audience === "creators";
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

  const stage = HERO_STAGE[audience];
  const phones = [stage.phones.front, stage.phones.back];

  return (
    // With the page's top padding (32/40px): the label sits 36px under the header and 16px above the box.
    <div className="mt-1 flex flex-col gap-4 sm:-mt-1">
      <HeroLabel label={content.label} />
      <section
        aria-labelledby="home-hero-heading"
        // isolate: the phones' and chips' z-index stay inside the hero, below the sticky header.
        className="relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-linear-to-r from-muted to-card px-6 pt-8 sm:px-12 sm:pt-14 lg:min-h-[34rem] lg:flex-row lg:items-center lg:px-16 lg:py-14"
      >
        {/* Dot grid, faded out towards the edges; nudged by the cursor on desktop, a bit more on the creators page. */}
        {creators ? <HeroDotGrid reach={150} maxPush={7} tintReach={72} /> : <HeroDotGrid />}

        {/* Container query: the headline scales with its column so both lines always fit. */}
        <div className="@container relative flex w-full flex-col items-start gap-5 sm:gap-7 lg:max-w-[56%]">
          <div className="flex flex-col gap-3 sm:gap-4">
            <h1
              id="home-hero-heading"
              className={cn(
                // Creators: ~18% larger; "Get paid every month." still fills one line of the column.
                creators ? "text-[length:min(9.2cqi,4.5rem)]" : "text-[length:min(7.8cqi,4.25rem)]",
                // After the size: tailwind-merge drops a line height that comes before a font size.
                "leading-[1.02] font-extrabold tracking-[-0.045em] whitespace-pre-line",
              )}
            >
              {creators ? (
                <>
                  {tightPeriods(content.headline.before)}
                  {/* The phrase and its period never part, even on the narrowest phones. */}
                  <span className="whitespace-nowrap">
                    <KeyPhrase text={content.headline.phrase} textured={false} />
                    {tightPeriods(content.headline.after)}
                  </span>
                </>
              ) : (
                <>
                  {content.headline.before}
                  <KeyPhrase text={content.headline.phrase} textured />
                  {content.headline.after}
                </>
              )}
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
            <PrimaryCta href={primaryHref}>
              {content.primary.label}
            </PrimaryCta>
            {/* In-page anchor: keeps the query, only scrolls to `#offers` (Open programs on `/`, the catalog on `/for-apps`). */}
            {reducedMotion ? (
              <Button asChild size="lg" variant="outline" className={CTA_SIZE}>
                <HomeSectionLink section="offers">
                  {content.secondaryLabel}
                  <ArrowDown aria-hidden className="size-4.5" />
                </HomeSectionLink>
              </Button>
            ) : (
              <HoverBorderGradient
                as="div"
                duration={1.5}
                containerClassName="bg-border max-sm:w-full [--hover-border-highlight:var(--primary)] [--hover-border-spot:var(--primary)]"
                className="bg-background p-0 text-foreground max-sm:w-full"
              >
                {/* 48px inside the gradient's 1px padding and border: 52px overall, like the primary. */}
                <HomeSectionLink
                  section="offers"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {content.secondaryLabel}
                  <ArrowDown aria-hidden className="size-4.5" />
                </HomeSectionLink>
              </HoverBorderGradient>
            )}
          </div>
          {/* 16px under the buttons: the column's gap minus 4px / 12px. Centered under the full-width buttons on phones. */}
          <TrustLine
            items={content.trust}
            className="-mt-1 w-full justify-center gap-x-3.5 text-[13px] sm:-mt-3 sm:w-auto sm:justify-start sm:gap-x-[18px] sm:text-sm"
          />
        </div>

        {/* Brand stage over the yellow "b": the audience's screen in front, the other one tilted behind (click it to swap),
            two notifications on top. On the creators page the notifications drift slowly, out of step; the phones stay still. */}
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
            chip={stage.chips[0]}
            delay={0.5}
            drift={creators ? "0s" : undefined}
            // Creators: higher and further left than the apps chip, so the front phone's header row ("b Earnings" and
            // "EXAMPLE") stays uncovered through the whole drift: ≥13px from it at lg (the narrower stage puts
            // "EXAMPLE" under the chip's right end), ≥15px at xl. Below lg: ≥12px from 700px up; at 640–699px the
            // trust line above leaves room for 7–11px.
            className={cn(
              "z-30",
              creators
                ? "-top-7 left-[1%] lg:top-[5%] lg:-left-[6%] xl:top-[8%]"
                : "top-0 left-[8%] lg:top-[14%] lg:-left-[6%]",
            )}
          />
          <NotificationChip
            chip={stage.chips[1]}
            delay={0.8}
            drift={creators ? "-3.5s" : undefined}
            className="z-30 right-[3%] bottom-6 lg:right-[2%] lg:bottom-[7%]"
          />
        </div>
      </section>
    </div>
  );
}
