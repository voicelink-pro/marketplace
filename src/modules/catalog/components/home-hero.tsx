"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MorphingText } from "@/components/ui/morphing-text";

const MORPH_WORDS = ["income.", "customers."];
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
 * Home hero: one large rounded stage. The last word of the headline morphs
 * between what a link brings each side; everything else is static.
 */
export function HomeHero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative flex overflow-hidden rounded-[2rem] bg-linear-to-r from-muted to-card px-6 py-7 sm:px-12 md:min-h-[30rem] md:items-center lg:min-h-[34rem] lg:px-16"
    >
      {/* Brand stage: oversized mark with both sides of the product tilted over it. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
        <LogoMark className="absolute -right-24 -bottom-40 size-[34rem] rotate-[-8deg] lg:size-[40rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-[15%] -translate-y-[56%] rotate-[8deg] scale-90 opacity-95 max-lg:hidden">
          <PhoneMock kind="company" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-[78%] -translate-y-[46%] rotate-[-9deg] max-lg:-translate-x-1/2">
          <PhoneMock kind="creator" />
        </div>
      </div>

      <div className="relative flex max-w-xl flex-col items-start gap-3 sm:gap-6 md:max-w-[46%]">
        <h1
          id="home-hero-heading"
          aria-label="Every link brings income and customers."
          className="text-4xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-6xl md:text-5xl lg:text-6xl xl:text-7xl"
        >
          <span aria-hidden>Every link brings</span>
          {/* Own line at a fixed height, so the morph never reflows the hero. */}
          <span aria-hidden className="block h-[0.95em] text-primary-ink dark:text-primary">
            {reducedMotion ? (
              MORPH_WORDS[0]
            ) : (
              <MorphingText
                texts={MORPH_WORDS}
                className="mx-0 h-[0.95em] max-w-none text-left font-extrabold text-[length:inherit] leading-[inherit] md:h-[0.95em] lg:text-[length:inherit]"
              />
            )}
          </span>
        </h1>
        <p className="max-w-md text-sm text-muted-foreground sm:text-lg">
          Creators earn on every renewal. Apps pay only for real subscribers.
        </p>
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
