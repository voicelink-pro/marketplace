"use client";

import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  label: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
  phone: "creator" | "company";
};

const SLIDES: Slide[] = [
  {
    id: "creators",
    label: "For creators",
    title: "Share apps, earn every month",
    body: "Join an app’s offer, share your link, and get a share of every subscription payment your audience makes.",
    cta: { href: "/signup", label: "Start as a creator" },
    phone: "creator",
  },
  {
    id: "companies",
    label: "For companies",
    title: "Let creators grow your app",
    body: "List your app, set a commission for each plan, and pay creators when the customers they bring keep subscribing.",
    cta: { href: "/signup", label: "List your app" },
    phone: "company",
  },
];

/** Illustration only: shows the product's own screens, with example values. */
function PhoneMock({ kind }: { kind: Slide["phone"] }) {
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

function ArrowButton({ direction, onClick, className }: { direction: "prev" | "next"; onClick: () => void; className?: string }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border bg-background text-foreground shadow-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}

/**
 * Home hero: one large rounded stage with a slide for each side of the
 * marketplace. No autoplay; arrows, dots and swipe move between slides.
 */
export function HomeHero() {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  return (
    <section aria-roledescription="carousel" aria-label="What boostlink does" className="relative flex flex-col gap-3">
      <div
        className="relative grid overflow-hidden rounded-[2rem] bg-linear-to-r from-muted to-card"
        onTouchStart={(event) => {
          touchX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchX.current;
          const end = event.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start === null || end === undefined || Math.abs(end - start) < 40) return;
          go(index + (end < start ? 1 : -1));
        }}
      >
        {SLIDES.map((slide, i) => {
          const active = i === index;
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${slide.label}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "relative col-start-1 row-start-1 flex items-center px-6 py-7 motion-safe:transition-opacity motion-safe:duration-500 sm:px-12 md:min-h-[30rem] lg:min-h-[34rem] lg:px-16",
                active ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {/* Brand stage: oversized mark with the product screen tilted over it. */}
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block">
                <LogoMark
                  className={cn(
                    "absolute size-[34rem] lg:size-[40rem]",
                    slide.phone === "creator" ? "-right-24 -bottom-40 rotate-[-8deg]" : "-right-44 -bottom-24 rotate-[16deg]",
                  )}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div
                    className={cn(
                      "motion-safe:transition-transform motion-safe:duration-700",
                      slide.phone === "creator" ? "rotate-[-9deg]" : "rotate-[7deg]",
                      active ? "translate-y-0" : "translate-y-8",
                    )}
                  >
                    <PhoneMock kind={slide.phone} />
                  </div>
                </div>
              </div>

              <div className="relative flex max-w-xl flex-col items-start gap-3 sm:gap-6 md:max-w-[46%]">
                <Heading className="text-4xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                  {slide.title}
                </Heading>
                <p className="max-w-md text-sm text-muted-foreground sm:text-lg">{slide.body}</p>
                <Button asChild size="lg">
                  <Link href={slide.cta.href}>{slide.cta.label}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ArrowButton direction="prev" onClick={() => go(index - 1)} className="absolute top-[calc(50%-1.5rem)] -left-5 hidden -translate-y-1/2 lg:inline-flex" />
      <ArrowButton direction="next" onClick={() => go(index + 1)} className="absolute top-[calc(50%-1.5rem)] -right-5 hidden -translate-y-1/2 lg:inline-flex" />

      <div className="flex items-center justify-center gap-3">
        <ArrowButton direction="prev" onClick={() => go(index - 1)} className="size-9 lg:hidden" />
        <div className="flex items-center gap-1">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${slide.label}`}
              aria-current={i === index}
              className="group flex h-6 items-center px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-full"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full motion-safe:transition-all",
                  i === index ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/50 group-hover:bg-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
        <ArrowButton direction="next" onClick={() => go(index + 1)} className="size-9 lg:hidden" />
      </div>
    </section>
  );
}
