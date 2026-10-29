import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HomeSectionLink } from "../home-section-link";
import { NewEraMarquee } from "./new-era-marquee";

/** The hero's key phrase marker: black on yellow in light, yellow letters in dark. */
const KEY_PHRASE = "rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary";

const PROMISES = [
  { lead: "Creators", rest: "share apps they actually use." },
  { lead: "Apps", rest: "pay only for customers who pay." },
  { lead: "Everyone", rest: "earns every month the customer stays." },
];

/**
 * "New era of marketing", right under the hero and the same for both sides:
 * the pitch with three numbered promises, a link down to How it works, and
 * the 3D marquee of product pieces. From lg the marquee sits on the left and the text on the right;
 * below that the text comes first and the marquee runs edge to edge under it.
 */
export function NewEraSection() {
  return (
    <section
      aria-labelledby="new-era-heading"
      className="mx-auto grid w-full max-w-6xl justify-items-center gap-6 text-center lg:grid-cols-[520px_minmax(0,1fr)] lg:items-center lg:justify-items-start lg:gap-16 lg:py-14 lg:text-left xl:grid-cols-[620px_minmax(0,1fr)]"
    >
      <div className="flex max-w-2xl flex-col items-center gap-3 sm:gap-4 lg:col-start-2 lg:row-start-1 lg:max-w-xl lg:items-start">
        {/* Always a step below the hero headline, which scales with its column. Two lines
            beside the marquee (lg+), one line when stacked. */}
        <h2
          id="new-era-heading"
          className="text-xl leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-3xl lg:text-4xl xl:text-[2.75rem]"
        >
          New era of <br className="max-lg:hidden" />
          <span className={KEY_PHRASE}>marketing</span>
          .
        </h2>
        <p className="text-base text-pretty text-muted-foreground sm:text-lg">
          People skip ads. They don’t skip the creators they follow.
        </p>
        {/* Left-aligned block even when the column is centered, so the numbers line up. */}
        <ol className="mx-auto flex w-full max-w-md list-none flex-col gap-3.5 p-0 text-left lg:mx-0">
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
        <Button asChild variant="outline" className="h-11 gap-2 px-5 text-xs font-bold tracking-wide uppercase sm:text-sm">
          {/* Only rendered on `/`, so this is always the in-page scroll. */}
          <HomeSectionLink section="how-it-works" defaultAudience={null}>
            See how it works
            <ArrowDown aria-hidden className="size-4" />
          </HomeSectionLink>
        </Button>
      </div>

      <NewEraMarquee />
    </section>
  );
}
