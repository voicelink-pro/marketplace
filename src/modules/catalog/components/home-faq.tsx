import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../audience";
import { FAQ } from "../faq-data";
import { PRIMARY_CTA, PRIMARY_CTA_ARROW } from "./cta-styles";
import { HERO_CONTENT } from "./home-hero-content";
import { TrustLine } from "./trust-line";

const SUBTITLE: Record<HomeAudience, string> = {
  creators: "Still unsure? Start for free and see the programs yourself.",
  apps: "Still unsure? Set up your program and go live after review.",
};

/**
 * Last section of the home page: heading, the hero's primary CTA and trust
 * line on the left (sticky from lg), the audience's questions in an accordion on the right.
 */
export function HomeFaq({ audience, signedIn = false }: { audience: HomeAudience; signedIn?: boolean }) {
  const { primary: cta, trust } = HERO_CONTENT[audience];
  const ctaHref = (!signedIn && cta.signedOutHref) || cta.href;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="grid scroll-mt-36 gap-8 lg:scroll-mt-24 lg:grid-cols-12 lg:gap-12"
    >
      <div className="flex flex-col items-start gap-4 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
        <h2 id="faq-heading" className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
          Questions, answered
        </h2>
        <p className="max-w-md text-base text-pretty text-muted-foreground">{SUBTITLE[audience]}</p>
        <Button asChild size="lg" className={cn(PRIMARY_CTA, "mt-2")}>
          <Link href={ctaHref}>
            {cta.label}
            <ArrowRight aria-hidden className={PRIMARY_CTA_ARROW} />
          </Link>
        </Button>
        <TrustLine items={trust} />
      </div>

      <Accordion type="single" collapsible className="rounded-[20px] border bg-card px-5 sm:px-6 lg:col-span-7">
        {FAQ[audience].map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-[15px] text-pretty text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
