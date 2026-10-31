import { Suspense } from "react";
import { EarningsCalculator } from "@/modules/catalog/components/calculator/earnings-calculator";
import { CreatorPricing } from "@/modules/catalog/components/creator-pricing";
import { CreatorTestimonials } from "@/modules/catalog/components/creator-testimonials";
import { HomeFaq } from "@/modules/catalog/components/home-faq";
import { HomeHero } from "@/modules/catalog/components/home-hero";
import { HowItWorks } from "@/modules/catalog/components/how-it-works";
import { OpenPrograms, OpenProgramsSkeleton } from "@/modules/catalog/components/open-programs";
import { ProofStrip, ProofStripSkeleton } from "@/modules/catalog/components/proof-strip";
import { SectionDivider } from "@/modules/catalog/components/section-divider";
import { WhoItsFor, WhoItsForCta } from "@/modules/catalog/components/who-its-for";

/** The home page for creators. The apps version lives at `/for-apps`. */
export default function CreatorsHomePage() {
  // Hero and the open programs row (`#offers`), who it's for, creator testimonials with the proof strip, how it works and the calculator;
  // then pricing and the FAQ; the footer's "Ready to …" panel closes the page.
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <HomeHero audience="creators" />

      <Suspense fallback={<OpenProgramsSkeleton />}>
        <OpenPrograms />
      </Suspense>

      <WhoItsFor />

      <WhoItsForCta />

      <SectionDivider />

      <CreatorTestimonials>
        {/* The average commission comes from the catalog. */}
        <Suspense fallback={<ProofStripSkeleton />}>
          <ProofStrip />
        </Suspense>
      </CreatorTestimonials>

      <SectionDivider />

      <HowItWorks audience="creators" />

      {/* 32px more than the section gap between the steps and the calculator box. */}
      <div className="mt-8">
        <EarningsCalculator audience="creators" />
      </div>

      <SectionDivider />

      <CreatorPricing />

      <SectionDivider />

      <HomeFaq audience="creators" />
    </div>
  );
}
