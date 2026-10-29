import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { HomeAudience } from "../audience";
import { APP_TESTIMONIALS, CREATOR_TESTIMONIALS } from "../testimonials-data";
import { PRIMARY_CTA, PRIMARY_CTA_ARROW } from "./cta-styles";
import { HERO_CONTENT } from "./home-hero-content";
import { TestimonialBoard } from "./testimonial-board";

/** The hero's key phrase color: black on a yellow marker in light, yellow letters in dark. */
const KEY_PHRASE = "rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary";

const CONTENT = {
  creators: {
    heading: { before: "Loved by", phrase: "creators", after: "who earn every month" },
    subtitle: "Hear from creators who turned their posts into recurring income with boostlink.",
    items: CREATOR_TESTIMONIALS,
  },
  apps: {
    heading: { before: "Loved by", phrase: "apps", after: "that pay only for results" },
    subtitle: "Hear from founders who grow with creators and pay only when customers pay.",
    items: APP_TESTIMONIALS,
  },
} satisfies Record<HomeAudience, unknown>;

/**
 * Testimonials for the selected side: the heading, subtitle and the hero's
 * primary CTA in the middle of a stage of draggable quote cards (from lg),
 * or above a swipeable row of them (below lg).
 */
export function Testimonials({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const content = CONTENT[audience];
  const cta = HERO_CONTENT[audience].primary;
  const ctaHref = (!signedIn && cta.signedOutHref) || cta.href;

  return (
    <section aria-labelledby="testimonials-heading" className="mx-auto w-full max-w-6xl">
      <TestimonialBoard items={content.items}>
        <h2
          id="testimonials-heading"
          className="text-[34px] leading-[1.04] font-extrabold tracking-[-0.045em] text-balance sm:text-[44px] lg:text-[52px]"
        >
          {content.heading.before} <span className={KEY_PHRASE}>{content.heading.phrase}</span> {content.heading.after}
        </h2>
        <p className="max-w-[500px] text-base text-pretty text-muted-foreground sm:text-[17px]">{content.subtitle}</p>
        <Button asChild size="lg" className={PRIMARY_CTA}>
          <Link href={ctaHref}>
            {cta.label}
            <ArrowRight aria-hidden className={PRIMARY_CTA_ARROW} />
          </Link>
        </Button>
      </TestimonialBoard>
    </section>
  );
}
