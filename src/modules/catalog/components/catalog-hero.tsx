import { Check } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { APP_CATEGORIES } from "../constants";

/**
 * "Commission that keeps paying" band under the hero. Every figure is a
 * product rule or a real constant, never a made-up metric.
 */
export function HomeFacts() {
  const facts = [
    { value: "0", label: "approvals to wait for" },
    { value: String(APP_CATEGORIES.length), label: "app categories" },
    { value: "Every", label: "renewal earns commission" },
    { value: "Upfront", label: "rates, shown for each plan" },
  ];

  return (
    <section
      aria-labelledby="home-facts-heading"
      className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10"
    >
      <h2
        id="home-facts-heading"
        className="text-3xl leading-tight font-extrabold tracking-[-0.04em] sm:text-5xl"
      >
        Commission that{" "}
        <mark className="rounded-sm bg-primary px-1.5 text-primary-foreground [box-decoration-break:clone]">
          keeps
        </mark>{" "}
        paying
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:gap-x-4">
        {facts.map((fact) => (
          // dt before dd for screen readers; shown value-first like a stat.
          <div key={fact.label} className="flex flex-col-reverse justify-end gap-1 lg:w-28 lg:items-center xl:w-36 lg:text-center">
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="tabular text-3xl leading-none font-extrabold tracking-[-0.04em] sm:text-4xl">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TileStage({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="flex min-h-28 flex-1 flex-col justify-center gap-2 rounded-2xl bg-muted/60 p-4 text-xs">
      {children}
    </div>
  );
}

const RENEWAL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Illustrative mini screens for each tile; example values only. */
const TILES = [
  {
    title: "Join instantly",
    body: "No application and no waiting for the company to approve you.",
    span: "md:col-span-2",
    stage: (
      <TileStage>
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground font-bold text-background">P</span>
          <span className="flex-1 font-semibold">Your next app</span>
          <span className="rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground max-sm:hidden">20% recurring</span>
          <span className="rounded-full bg-foreground px-3 py-1.5 font-semibold text-background">Join offer</span>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-medium">
          <Check className="size-3 text-primary" />
          You’ve joined
        </span>
      </TileStage>
    ),
  },
  {
    title: "Your own link and code",
    body: "Every app you join gives you a personal link and a code to share.",
    span: "",
    stage: (
      <TileStage>
        <span className="truncate rounded-xl border bg-card px-3 py-2 font-mono">boostlink/r/your-name</span>
        <span className="w-fit rounded-xl border border-primary px-3 py-2 font-mono font-semibold">YOURNAME</span>
      </TileStage>
    ),
  },
  {
    title: "Paid on every renewal",
    body: "Commission on every subscription payment, for as long as the customer stays.",
    span: "",
    stage: (
      <TileStage>
        <div className="grid grid-cols-6 gap-1.5">
          {RENEWAL_MONTHS.map((month) => (
            <span key={month} className="flex flex-col items-center gap-1.5">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" />
              </span>
              <span className="text-muted-foreground">{month}</span>
            </span>
          ))}
        </div>
      </TileStage>
    ),
  },
  {
    title: "For apps: pay only for real subscribers",
    body: "Set a commission for each plan. You pay it only on subscription payments from the customers creators bring.",
    span: "md:col-span-2",
    stage: (
      <TileStage>
        <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3">
          <span className="flex flex-col">
            <span className="font-semibold">Monthly</span>
            <span className="text-muted-foreground">€19 / month</span>
          </span>
          <span className="rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground">20% recurring</span>
        </div>
        <p>
          <span className="text-muted-foreground">Creators will see: </span>
          <span className="font-semibold">20% recurring · €3.80 per customer / month</span>
        </p>
      </TileStage>
    ),
  },
];

/** Dark "how it works" section below the results, laid out as a bento grid. */
export function CreatorPitch() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="creator-pitch-heading"
      className="dark relative scroll-mt-24 overflow-hidden rounded-[2rem] bg-background px-5 py-10 text-foreground sm:px-10 sm:py-14 dark:bg-card"
    >
      <LogoMark
        className="pointer-events-none absolute -right-16 -top-16 hidden size-72 rotate-12 opacity-90 lg:block"
      />
      <div className="relative flex flex-col gap-8">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 id="creator-pitch-heading" className="text-3xl leading-tight sm:text-4xl">
            Your audience. Your links. Your income.
          </h2>
          <p className="text-muted-foreground">One creator account works for every app on {siteConfig.name}.</p>
        </div>
        <BentoGrid className="max-w-none gap-3 md:auto-rows-auto sm:gap-4">
          {TILES.map((tile) => (
            <BentoGridItem
              key={tile.title}
              className={cn(
                "rounded-3xl border-border bg-background p-4 shadow-none hover:shadow-none sm:p-5 dark:border-border dark:bg-background motion-reduce:transition-none motion-reduce:[&>div]:translate-x-0! motion-reduce:[&>div]:transition-none",
                tile.span,
              )}
              header={tile.stage}
              title={<h3 className="text-base text-foreground">{tile.title}</h3>}
              description={<span className="text-sm text-muted-foreground">{tile.body}</span>}
            />
          ))}
        </BentoGrid>
        <div>
          <Button asChild size="lg">
            <Link href="/signup">Start as a creator</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
