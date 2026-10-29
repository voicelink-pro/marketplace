import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSectionLink } from "../home-section-link";
import { NewEraOrbit } from "./new-era-orbit";

/** Legend under the orbit, in flow order; each swatch matches its element in the graphic. */
const LEGEND: { label: string; swatch: string }[] = [
  { label: "Viewers find creators", swatch: "size-2.5 rounded-full bg-muted-foreground" },
  { label: "Creators send them to the app", swatch: "h-1 w-[18px] rounded-full bg-primary" },
  { label: "The app gets paying customers", swatch: "size-3.5 rounded-[5px] bg-side-apps" },
];

/**
 * "New era of marketing", right under the hero and the same for both sides:
 * the pitch, a link down to How it works, and the animated creator orbit
 * with its legend.
 */
export function NewEraSection() {
  return (
    <section
      aria-labelledby="new-era-heading"
      className="flex flex-col items-center gap-4 pt-4 text-center sm:gap-5 sm:pt-8"
    >
      <div className="flex max-w-2xl flex-col items-center gap-4 sm:gap-5">
        <h2
          id="new-era-heading"
          className="text-4xl leading-[1.02] font-extrabold tracking-[-0.045em] sm:text-6xl"
        >
          New era of{" "}
          {/* The hero's key phrase marker: black on yellow in light, yellow letters in dark. */}
          <span className="rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary">
            marketing
          </span>
          .
        </h2>
        <p className="text-base text-pretty text-muted-foreground sm:text-lg">
          People skip ads, but they listen to creators they trust.{" "}
          <span className="font-semibold text-foreground">boostlink</span> lets apps grow
          through those creators, and money moves only when it works.
        </p>
        <Button asChild variant="outline" className="h-11 gap-2 px-5 text-xs font-bold tracking-wide uppercase sm:text-sm">
          {/* Only rendered on `/`, so this is always the in-page scroll. */}
          <HomeSectionLink section="how-it-works" defaultAudience={null}>
            See how it works
            <ArrowDown aria-hidden className="size-4" />
          </HomeSectionLink>
        </Button>
      </div>

      <NewEraOrbit />

      <ol className="-mt-2 flex flex-col items-start gap-2.5 text-sm font-semibold text-foreground/80 lg:flex-row lg:items-center lg:gap-3.5">
        {LEGEND.map((item, index) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            {/* Desktop row: an arrow between steps; phones stack them without arrows. */}
            {index > 0 ? (
              <ArrowRight aria-hidden className="mr-1.5 hidden size-4 text-muted-foreground lg:block" />
            ) : null}
            <span aria-hidden className={`shrink-0 ${item.swatch}`} />
            {item.label}
          </li>
        ))}
      </ol>
    </section>
  );
}
