import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  UserRound,
} from "lucide-react";
import { Fragment } from "react";
import { LogoMark } from "@/components/brand/logo";
import type { HomeAudience } from "../audience";
import styles from "./how-it-works.module.css";
import { HowItWorksSection } from "./how-it-works-section";
import { PlatformLogos } from "./platform-logos";

/** Seconds each card glows, then the beam's trip to the next card (matches how-it-works.module.css). */
const GLOW_S = 3.5;
const BEAM_S = 1.5;

// Mini screens in their final state, built from the same pieces as the real app
// (catalog card, fields, chips). Static: the only motion here is the connector beam.

function OfferScene() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-foreground text-sm font-bold text-background">
          L
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-semibold">
            Lexi Notes
          </span>
          <span className="truncate text-xs text-muted-foreground">
            AI &amp; Writing
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
          20% recurring
        </span>
        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-muted px-3 text-xs font-semibold text-foreground">
          <Check className="size-3.5 text-primary-ink" />
          Joined
        </span>
      </div>
    </div>
  );
}

function LinkScene() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-2 rounded-xl border bg-card p-3 text-xs">
      <span className="text-muted-foreground">Your link</span>
      <span className="truncate rounded-lg border bg-background px-2.5 py-2 font-mono">
        boostlink.co/r/your-name
      </span>
      <span className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-muted font-semibold text-foreground">
        <Check className="size-3.5 text-primary-ink" />
        Copied
      </span>
    </div>
  );
}

function NotificationScene() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-1.5 rounded-[18px] border bg-background/85 p-3 text-xs shadow-lg">
      <span className="flex items-center gap-1.5">
        <span className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-primary">
          <LogoMark className="size-3 fill-primary-foreground" />
        </span>
        <span className="flex-1 font-semibold text-muted-foreground">
          boostlink
        </span>
        <span className="text-muted-foreground">now</span>
      </span>
      <span className="leading-snug font-medium">
        New subscriber via your TikTok link. +$7.80 commission.
      </span>
    </div>
  );
}

function PlanScene() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-2 rounded-xl border bg-card p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-col">
          <span className="text-sm font-semibold">Pro Monthly</span>
          <span className="text-muted-foreground">$39/month</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="text-muted-foreground">Commission</span>
          <span className="flex h-8 w-16 items-center justify-end rounded-lg border border-primary bg-background px-2 font-semibold tabular-nums">
            20%
          </span>
        </span>
      </div>
    </div>
  );
}

function JoinRow() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-card p-2.5 text-xs">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <UserRound className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">
        A creator joined your offer
      </span>
      <span className="text-muted-foreground">now</span>
    </div>
  );
}

function JoinsScene() {
  return (
    <div className="flex w-full max-w-64 flex-col gap-2">
      <JoinRow />
      <JoinRow />
    </div>
  );
}

const FUNNEL = ["Visit", "Trial", "Paid"];

function FunnelScene() {
  return (
    <div className="flex w-full max-w-64 items-center gap-1">
      {FUNNEL.map((step, index) => (
        <Fragment key={step}>
          {index > 0 ? (
            <ArrowRight
              aria-hidden
              className="size-3 shrink-0 text-muted-foreground"
            />
          ) : null}
          <span
            className={
              step === "Paid"
                ? "flex-1 rounded-xl border border-primary bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground"
                : "flex-1 rounded-xl border bg-card py-2.5 text-center text-xs font-semibold"
            }
          >
            {step}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

type Step = {
  title: string;
  body: string;
  Scene: () => React.ReactNode;
  /** Platform logo row under the mini screen. */
  platforms?: boolean;
};

const STEPS: Record<HomeAudience, Step[]> = {
  creators: [
    {
      title: "Pick an app to promote",
      body: "Browse the catalog and choose an app your audience will love, with a commission that suits you.",
      Scene: OfferScene,
    },
    {
      title: "Share your link on Instagram, TikTok and more",
      body: "Get your personal link and code instantly. Put them in your bio, captions or videos, wherever you post.",
      Scene: LinkScene,
      platforms: true,
    },
    {
      title: "Earn on every renewal",
      body: "Get paid each month your referrals stay subscribed. Commission keeps coming for as long as they pay.",
      Scene: NotificationScene,
    },
  ],
  apps: [
    {
      title: "List your app and set your commission",
      body: "Add your plans and choose the commission creators earn on each one.",
      Scene: PlanScene,
    },
    {
      title: "Creators discover and share it",
      body: "Creators who like your app join your offer and post about it.",
      Scene: JoinsScene,
      platforms: true,
    },
    {
      title: "Pay only for paying subscribers",
      body: "No upfront fees. You pay commission only when a referred customer pays.",
      Scene: FunnelScene,
    },
  ],
};

const EXAMPLE: Record<HomeAudience, string> = {
  creators:
    "Example: 20% of a $39 plan = $7.80 every month, for as long as they stay.",
  apps: "Example: 40 paying subscribers on a $39 plan bring $1,560 a month. You pay $312 in commission.",
};

/** `index`: 1 for the connector between cards 1 and 2, 2 for the next one. */
function Connector({ index }: { index: number }) {
  return (
    <li
      aria-hidden
      className="flex items-center justify-center py-1 text-muted-foreground lg:row-span-2 lg:py-0"
    >
      {/* Phones and tablets: down; desktop: right, with the beam. */}
      <span className="flex flex-col items-center lg:hidden">
        <span className="h-5 border-l-2 border-dashed" />
        <ChevronDown className="-mt-1.5 size-4" />
      </span>
      <span className="relative hidden items-center lg:flex">
        <span className="w-5 border-t-2 border-dashed xl:w-7" />
        <ChevronRight className="-ml-1.5 size-4" />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden">
          <span
            className={`${styles.beam} absolute inset-0 rounded-full bg-[linear-gradient(90deg,transparent_45%,var(--primary)_85%,transparent)] blur-[1px]`}
            // Leaves as card `index` stops glowing.
            style={{
              animationDelay: `${index * GLOW_S + (index - 1) * BEAM_S}s`,
            }}
          />
        </span>
      </span>
    </li>
  );
}

/**
 * "How it works": the "New era of marketing" intro (the same for both sides),
 * then three step cards for the selected side, each with a static
 * mini screen. On desktop the cards glow one at a time, with a short yellow
 * beam along the connector between them (CSS cycle started on scroll; none
 * on phones or with reduced motion).
 */
export function HowItWorks({ audience }: { audience: HomeAudience }) {
  const steps = STEPS[audience];

  return (
    <HowItWorksSection>
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="text-sm font-semibold text-muted-foreground">How it works</p>
        <h2
          id="how-it-works-heading"
          className="text-3xl leading-tight font-extrabold tracking-[-0.04em] sm:text-4xl"
        >
          New era of marketing.
        </h2>
        <p className="text-base text-pretty text-muted-foreground sm:text-lg">
          People skip ads, but they listen to creators they trust.{" "}
          {/* Marker stroke: black on yellow reads in both themes. */}
          <span className="rounded-[4px] bg-[#FFD600] px-1 font-semibold text-[#111111] [box-decoration-break:clone]">
            boostlink
          </span>{" "}
          lets apps grow through those creators, and money moves only when it works.
          <br />
          Creators and apps win together.
        </p>
      </div>
      {/* Desktop: card, arrow, card, arrow, card; equal card widths. Each card spans the
          same two rows (screen, text), so screens and titles line up across cards. */}
      <ol className="flex flex-col lg:grid lg:grid-cols-[1fr_2rem_1fr_2rem_1fr] xl:grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr]">
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            {index > 0 ? <Connector index={index} /> : null}
            <li className="relative flex flex-col rounded-[20px] border bg-card lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-0">
              {/* Lights up when the beam arrives (card 1: at the start of the cycle). */}
              <span
                aria-hidden
                className={`${styles.cardGlow} pointer-events-none absolute -inset-px hidden rounded-[20px] border border-primary/50 shadow-[0_0_20px_-6px_var(--primary)] lg:block`}
                style={{ animationDelay: `${index * (GLOW_S + BEAM_S)}s` }}
              />
              <span
                aria-hidden
                className="absolute -top-3 left-5 z-10 grid size-7 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm"
              >
                {index + 1}
              </span>
              <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-t-[20px] border-b bg-muted/40 px-4 pt-6 pb-4">
                {/* Decorative mini screen; the title and sentence carry the meaning. */}
                <div aria-hidden className="flex w-full justify-center">
                  <step.Scene />
                </div>
                {step.platforms ? <PlatformLogos /> : null}
              </div>
              <div className="flex flex-col gap-1 p-5 lg:px-4 xl:px-5">
                <h3 className="text-base font-semibold text-balance">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          </Fragment>
        ))}
      </ol>
      <p className="text-center text-sm text-balance text-muted-foreground">
        {EXAMPLE[audience]}
      </p>
    </HowItWorksSection>
  );
}
