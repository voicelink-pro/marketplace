import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomeAudience } from "../../audience";
import { HomeSectionLink } from "../home-section-link";
import { NewEraFeed } from "./new-era-feed";

/**
 * "New era of marketing", right under the hero: the pitch (the same for both
 * sides), a link down to How it works, and the side's activity feed. From lg
 * the feed sits on the left and the text on the right; below that the text
 * comes first and the feed runs edge to edge under it.
 */
export function NewEraSection({ audience }: { audience: HomeAudience }) {
  return (
    <section
      aria-labelledby="new-era-heading"
      className="mx-auto grid w-full max-w-6xl justify-items-center gap-6 text-center lg:grid-cols-[520px_minmax(0,1fr)] lg:items-center lg:justify-items-start lg:gap-16 lg:py-14 lg:text-left xl:grid-cols-[620px_minmax(0,1fr)]"
    >
      <div className="flex max-w-2xl flex-col items-center gap-3 sm:gap-4 lg:col-start-2 lg:row-start-1 lg:max-w-xl lg:items-start">
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

      <NewEraFeed audience={audience} />
    </section>
  );
}
