"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StaticDots } from "./hero-dot-grid";

const EARNS = [
  "A follower subscribes or buys with your link or code, on web, iOS or Android",
  "Every renewal, for as long as they stay subscribed",
  "One-time purchases: you earn once, on the sale",
  "Annual plans: your cut of the full yearly payment",
  "Free trials once they turn into a paid subscription",
];

const DOESNT = ["Views, likes and shares", "Free trials that never convert", "Purchases that get refunded"];

const STEPS = [
  {
    title: "A follower pays",
    subtitle: "Subscription, renewal or one-time purchase",
    description:
      "Someone subscribes, renews or buys once with your link or code. A free trial counts once it turns into the first paid payment.",
  },
  {
    title: "Commission added",
    subtitle: "To this month's earnings",
    description:
      "Your share of that payment is added to this month's earnings. You can see every payment in your dashboard.",
  },
  {
    title: "Month closes",
    subtitle: "Earnings become available",
    description: "At the end of each calendar month your earnings are confirmed and become available to withdraw.",
  },
  {
    title: "You withdraw",
    subtitle: "Any amount, no minimum",
    description: "Withdraw whenever you like. There is no minimum amount.",
  },
  {
    title: "In your bank",
    subtitle: "Paid out via Stripe",
    description: "The money goes to your bank via Stripe. A purchase refunded before the payout cancels its commission.",
  },
];

const PANEL_ID = "payout-step-panel";

const CARD = "relative flex flex-col gap-5 overflow-hidden rounded-[28px] border bg-card p-8";
/** `!`: the global h3 weight and tracking are unlayered and would win otherwise. */
const CARD_TITLE = "text-[22px] leading-tight font-extrabold! tracking-tight!";
const LIST = "flex flex-col gap-3.5";
const ITEM = "flex items-start gap-3 text-base";
const MARKER = "grid size-6 shrink-0 place-items-center rounded-full";

/**
 * The payout steps: a row from lg, a column below. Hovering, focusing or
 * tapping a step makes it active: a ring on its circle, the line up to it in
 * yellow, and its description as plain text under the row (crossfaded). All
 * descriptions share one grid cell, so it is as tall as the longest and the
 * page never jumps. Step 1 starts active.
 */
function PayoutTimeline() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-5 lg:grid lg:grid-cols-5 lg:gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative">
            {index < STEPS.length - 1 ? (
              // To the next step, stopping 4px short of both circles (and their focus ring): down across the
              // 20px gap on phones, right across the 16px column gap from lg. Yellow once the step after it is active.
              <span
                aria-hidden
                className={cn(
                  "absolute top-10 -bottom-4 left-[15.5px] w-px lg:top-4 lg:-right-3 lg:bottom-auto lg:left-11 lg:h-px lg:w-auto",
                  index < active ? "bg-primary" : "bg-border",
                  "motion-safe:transition-colors motion-safe:duration-200",
                )}
              />
            ) : null}
            <button
              type="button"
              aria-pressed={active === index}
              aria-controls={PANEL_ID}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              className="flex w-full items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:flex-col"
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                  index === STEPS.length - 1 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  active === index && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  "motion-safe:transition-shadow motion-safe:duration-200",
                )}
              >
                {index + 1}
              </span>
              <span className="flex flex-col gap-0.5 pt-1 lg:pt-0">
                <span className="text-[15px] font-bold">{step.title}</span>
                <span className="text-sm text-muted-foreground">{step.subtitle}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div id={PANEL_ID} className="max-w-[720px]">
        <p aria-live="polite" className="sr-only">
          {STEPS[active]!.description}
        </p>
        <div aria-hidden className="grid">
          {STEPS.map((step, index) => (
            <p
              key={step.title}
              className={cn(
                "col-start-1 row-start-1 text-base text-pretty text-muted-foreground",
                index === active ? "opacity-100" : "opacity-0",
                "motion-safe:transition-opacity motion-safe:duration-200",
              )}
            >
              {step.description}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Pricing on the creators home page (`#pricing`), right after the calculator:
 * free to join, what earns money and what doesn't, then how and when the money
 * arrives as a five-step timeline. Static apart from the timeline.
 */
export function CreatorPricing() {
  return (
    // Below lg the header carries the audience row, so the anchor needs more room.
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="mx-auto flex w-full max-w-6xl scroll-mt-36 flex-col lg:scroll-mt-24"
    >
      <div className="flex flex-col items-center gap-3 self-center text-center">
        <span className="text-sm font-bold text-primary">Pricing</span>
        {/* Same size as the How it works heading. */}
        <h2
          id="pricing-heading"
          className="text-[clamp(1.5rem,6.4vw,2.25rem)] leading-[1.1] font-extrabold tracking-[-0.045em] text-balance sm:text-[clamp(1rem,5vw,2.25rem)] sm:whitespace-nowrap"
        >
          Free to join. You only earn.
        </h2>
        <p className="max-w-[620px] text-base text-pretty text-muted-foreground sm:text-lg">
          No sign-up fee and no subscription. It&apos;s free to join and use.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-[1.3fr_1fr]">
        <div className={CARD}>
          {/* The calculator box's dots, without the cursor effect. */}
          <StaticDots />
          <h3 className={cn(CARD_TITLE, "relative")}>What earns you money</h3>
          <ul className={cn(LIST, "relative")}>
            {EARNS.map((item) => (
              <li key={item} className={cn(ITEM, "text-foreground")}>
                <span aria-hidden className={cn(MARKER, "bg-primary text-[#111111]")}>
                  <Check className="size-[13px]" strokeWidth={3.2} />
                </span>
                <span className="pt-px">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={CARD}>
          <h3 className={cn(CARD_TITLE, "text-muted-foreground")}>What doesn&apos;t</h3>
          <ul className={LIST}>
            {DOESNT.map((item) => (
              <li key={item} className={cn(ITEM, "text-muted-foreground")}>
                <span aria-hidden className={cn(MARKER, "bg-muted")}>
                  <X className="size-3" strokeWidth={3} />
                </span>
                <span className="pt-px">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="mt-12 text-[22px] leading-tight font-extrabold! tracking-tight! sm:mt-14">
        How and when you get paid
      </h3>
      <div className="mt-6">
        <PayoutTimeline />
      </div>
      <p className="mt-3 text-[13px] text-muted-foreground">You report your own earnings for taxes.</p>
    </section>
  );
}
