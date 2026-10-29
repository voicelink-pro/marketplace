import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeSectionLink } from "../home-section-link";
import { NewEraOrbit } from "./new-era-orbit";

/**
 * "New era of marketing", right under the hero and the same for both sides:
 * the pitch, a link down to How it works, and the animated creator orbit.
 * Phones and tablets stack them; from lg the text sits on the left,
 * vertically centered next to the orbit.
 */
export function NewEraSection() {
  return (
    <section
      aria-labelledby="new-era-heading"
      // xl: inset like the hero's content, so both columns line up with it.
      className="grid justify-items-center gap-4 text-center lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:justify-items-start lg:gap-x-16 lg:text-left xl:px-16"
    >
      <div className="flex max-w-2xl flex-col items-center gap-3 sm:gap-4 lg:max-w-xl lg:items-start">
        {/* Always a step below the hero headline, which scales with its column. */}
        <h2
          id="new-era-heading"
          className="text-xl leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-3xl xl:text-4xl"
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
    </section>
  );
}
