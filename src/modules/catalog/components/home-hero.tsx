"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MorphingText } from "@/components/ui/morphing-text";

// "\n" + pre-line keeps each sentence on exactly two lines.
const SENTENCES = ["Promote apps.\nEarn on every renewal.", "List your app.\nGet paying customers."];
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** True on the server and before hydration, so the first paint is the static word. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

/** Illustration only: shows the product's own screens, with example values. */
function PhoneMock({ kind }: { kind: "creator" | "company" }) {
  return (
    <div className="w-60 rounded-[2.75rem] border-[9px] border-foreground bg-background p-4 shadow-2xl lg:w-64">
      <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-foreground/15" />
      <div className="mb-4 flex items-center gap-1">
        <LogoMark className="size-4" />
        <span className="text-xs font-bold tracking-[-0.04em]">boostlink</span>
      </div>
      {kind === "creator" ? (
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
      ) : (
        <div className="flex flex-col gap-3 text-xs">
          <p className="text-sm font-bold">Plans & commissions</p>
          {[
            { name: "Monthly", price: "€19 / month", rate: "20%" },
            { name: "Annual", price: "€190 / year", rate: "15%" },
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
            <p className="font-semibold">20% recurring · €3.80 per customer / month</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Home hero: one large rounded stage. The headline morphs between the
 * creator and the company sentence; the CTAs below serve both.
 */
export function HomeHero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative flex overflow-hidden rounded-[2rem] bg-linear-to-r from-muted to-card px-6 py-8 sm:px-12 sm:py-14 lg:min-h-[34rem] lg:items-center lg:px-16"
    >
      {/* Brand stage: oversized mark with both sides of the product tilted over it. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] lg:block">
        <LogoMark className="absolute -right-24 -bottom-40 size-[36rem] rotate-[-8deg] xl:size-[40rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-[10%] -translate-y-[56%] rotate-[8deg] scale-90 opacity-95 max-xl:hidden">
          <PhoneMock kind="company" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[46%] rotate-[-9deg] xl:-translate-x-[72%]">
          <PhoneMock kind="creator" />
        </div>
      </div>

      {/* Container query: the headline scales with its column so both lines always fit. */}
      <div className="@container relative flex w-full flex-col items-start gap-5 sm:gap-8 lg:max-w-[56%]">
        <h1
          id="home-hero-heading"
          aria-label="Promote apps. Earn on every renewal. List your app. Get paying customers."
          className="w-full text-[length:min(8.8cqi,4.75rem)] font-extrabold tracking-[-0.045em] whitespace-pre-line"
        >
          {/* Fixed two-line box, so the morph never reflows the hero. */}
          <span aria-hidden className="block h-[2em] leading-none">
            {reducedMotion ? (
              SENTENCES[0]
            ) : (
              <MorphingText
                texts={SENTENCES}
                className="mx-0 h-[2em] max-w-none text-left font-extrabold text-[length:inherit] leading-none md:h-[2em] lg:text-[length:inherit]"
              />
            )}
          </span>
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Start as a creator</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/onboarding/company">List your app</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
