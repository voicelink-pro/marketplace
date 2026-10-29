import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../../audience";
import { HomeSectionLink } from "../home-section-link";
import { NewEraMarquee } from "./new-era-marquee";

/** The hero's key phrase marker: black on yellow in light, yellow letters in dark. */
const KEY_PHRASE = "rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary";

const PROMISES = [
  { lead: "Creators", rest: "share apps they actually use." },
  { lead: "Apps", rest: "pay only for customers who pay." },
  { lead: "Everyone", rest: "earns every month the customer stays." },
];

const SUBTITLE: Record<HomeAudience, { lead: string; end: string }> = {
  creators: { lead: "Your audience trusts you more than", end: "any ad ever will." },
  apps: { lead: "Your next customers trust creators more than", end: "any ad ever will." },
};

/** The line under the heading: muted start, then the end in full color. The only part that differs per side. */
export function NewEraSubtitle({ audience }: { audience: HomeAudience }) {
  const { lead, end } = SUBTITLE[audience];
  return (
    <p className="max-w-md text-xl leading-tight font-bold tracking-[-0.025em] text-balance text-muted-foreground sm:text-2xl xl:text-[1.75rem]">
      {lead} <span className="text-foreground">{end}</span>
    </p>
  );
}

/**
 * "New era of marketing", right under the hero: the heading, the side's
 * subtitle (`subtitle`, so the page can stream it per audience while the
 * rest renders once), three numbered promises, a link down to How it works,
 * and the 3D marquee of product pieces. From lg the marquee sits on the left
 * and the text on the right; below that the text comes first and the marquee
 * runs edge to edge under it.
 */
export function NewEraSection({ subtitle }: { subtitle: React.ReactNode }) {
  return (
    <section
      aria-labelledby="new-era-heading"
      className="mx-auto grid w-full max-w-6xl justify-items-center gap-6 text-center lg:grid-cols-[520px_minmax(0,1fr)] lg:items-center lg:justify-items-start lg:gap-16 lg:py-14 lg:text-left xl:grid-cols-[620px_minmax(0,1fr)]"
    >
      <div className="flex max-w-2xl flex-col items-center gap-3 sm:gap-4 lg:col-start-2 lg:row-start-1 lg:max-w-xl lg:items-start">
        {/* 30px when stacked (may wrap on phones); from lg a step below the hero headline,
            on two lines beside the marquee. */}
        <h2
          id="new-era-heading"
          className="text-3xl leading-[1.05] font-extrabold tracking-[-0.04em] lg:text-4xl xl:text-[2.75rem]"
        >
          New era of <br className="max-lg:hidden" />
          <span className={KEY_PHRASE}>marketing</span>
          .
        </h2>
        {subtitle}
        {/* Left-aligned block even when the column is centered, so the numbers line up.
            A little more room above it than between the heading and the subtitle. */}
        <ol className="mx-auto mt-1 flex w-full max-w-md list-none flex-col gap-3.5 p-0 text-left sm:mt-2 lg:mx-0">
          {PROMISES.map((promise, index) => (
            <li
              key={promise.lead}
              className={cn("flex items-baseline gap-3", index > 0 && "border-t pt-3.5")}
            >
              <span aria-hidden className="w-6 shrink-0 text-[13px] font-extrabold">
                <span className={KEY_PHRASE}>{String(index + 1).padStart(2, "0")}</span>
              </span>
              <span className="text-base leading-snug sm:text-[17px]">
                <span className="font-bold text-foreground">{promise.lead}</span>{" "}
                <span className="text-muted-foreground">{promise.rest}</span>
              </span>
            </li>
          ))}
        </ol>
        {/* Only rendered on `/`, so this is always the in-page smooth scroll. */}
        <HomeSectionLink
          section="how-it-works"
          defaultAudience={null}
          className="inline-flex items-center gap-1.5 rounded-sm text-base font-semibold text-foreground underline decoration-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          See how it works
          <ArrowDown aria-hidden className="size-4" />
        </HomeSectionLink>
      </div>

      <NewEraMarquee />
    </section>
  );
}
