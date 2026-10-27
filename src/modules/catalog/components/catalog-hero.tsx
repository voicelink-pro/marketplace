import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
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
          <div key={fact.label} className="flex flex-col-reverse justify-end gap-1 lg:w-36 lg:items-center lg:text-center">
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

/** Dark creator pitch below the results, as on the brand board. */
export function CreatorPitch() {
  const points = [
    { title: "Join instantly", body: "No application and no waiting for the company to approve you." },
    { title: "Your own link and code", body: "Every app you join gives you a personal link and a code to share." },
    { title: "Paid on renewals", body: "Commission on every subscription payment, for as long as the customer stays." },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="creator-pitch-heading"
      className="dark relative scroll-mt-24 overflow-hidden rounded-[2rem] bg-background px-6 py-10 text-foreground sm:px-10 sm:py-14 dark:bg-card"
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
        <ul className="grid gap-6 sm:grid-cols-3">
          {points.map((point) => (
            <li key={point.title} className="flex flex-col gap-1 border-t border-primary pt-4">
              <h3 className="text-base">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.body}</p>
            </li>
          ))}
        </ul>
        <div>
          <Button asChild size="lg">
            <Link href="/signup">Start as a creator</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
