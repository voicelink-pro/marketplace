import type { HomeAudience } from "../audience";
import { FAQ } from "../faq-data";
import { FaqList } from "./faq-list";

const SUBTITLE: Record<HomeAudience, string> = {
  creators: "Still unsure? Start for free and see the programs yourself.",
  apps: "Still unsure? Set up your program and go live after review.",
};

/**
 * Last section of the home page: heading and subtitle on the left (sticky from
 * lg), the audience's questions in an accordion on the right (the first six, then "Show all questions"). No CTA: the
 * footer's "Ready to …" panel follows.
 */
export function HomeFaq({ audience }: { audience: HomeAudience }) {
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
      </div>

      <FaqList items={FAQ[audience]} />
    </section>
  );
}
