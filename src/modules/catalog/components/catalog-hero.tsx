import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/** Short light hero above the catalog. The catalog stays the home page (W-01). */
export function CatalogHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card px-5 py-7 sm:px-10 sm:py-14">
      {/* Oversized brand shapes from the brand board; purely decorative. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[26rem] md:block">
        <LogoMark className="absolute -right-10 -bottom-20 size-[22rem] rotate-[-8deg]" />
      </div>

      <div className="relative flex max-w-xl flex-col gap-4">
        <h1 className="text-3xl leading-[1.05] sm:text-5xl">Promote apps. Earn on every renewal.</h1>
        <p className="text-muted-foreground sm:text-lg">
          Join an app’s offer, share your link, and get a share of every subscription payment your
          audience makes.
        </p>
      </div>
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
      aria-labelledby="creator-pitch-heading"
      className="dark relative overflow-hidden rounded-3xl bg-background px-6 py-10 text-foreground sm:px-10 sm:py-14 dark:bg-card"
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
