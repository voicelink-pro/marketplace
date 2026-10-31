import type { Metadata } from "next";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getViewer } from "@/modules/accounts/viewer";
import { EarningsCalculator } from "@/modules/catalog/components/calculator/earnings-calculator";
import {
  HomeCatalogPreview,
  HomeCatalogPreviewSkeleton,
} from "@/modules/catalog/components/home-catalog-preview";
import { HomeFaq } from "@/modules/catalog/components/home-faq";
import { HomeHero } from "@/modules/catalog/components/home-hero";
import { HERO_CONTENT } from "@/modules/catalog/components/home-hero-content";
import { HomeLogoCloud, HomeLogoCloudSkeleton } from "@/modules/catalog/components/home-logo-cloud";
import { HomePricing } from "@/modules/catalog/components/home-pricing";
import { HowItWorks } from "@/modules/catalog/components/how-it-works";
import { JoinStrip } from "@/modules/catalog/components/join-strip";
import { NewEraSection, NewEraSubtitle } from "@/modules/catalog/components/new-era/new-era-section";
import { Testimonials } from "@/modules/catalog/components/testimonials";
import { WhyJoin } from "@/modules/catalog/components/why-join";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} for apps` },
  description: HERO_CONTENT.apps.subtitle.join(" "),
};

/** Renders `children` with whether there is a session; the apps CTAs send visitors without one to sign up first. */
async function WithSignedIn({ children }: { children: (signedIn: boolean) => React.ReactNode }) {
  const viewer = await getViewer();
  return children(viewer !== null);
}

/** The home page for apps. Same sections as `/`; the session streams in, the static shell shows the signed-out CTAs. */
export default function AppsHomePage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <Suspense fallback={<HomeHero audience="apps" />}>
        <WithSignedIn>{(signedIn) => <HomeHero audience="apps" signedIn={signedIn} />}</WithSignedIn>
      </Suspense>

      <NewEraSection subtitle={<NewEraSubtitle audience="apps" />} />

      <Suspense fallback={<HowItWorks audience="apps" />}>
        <WithSignedIn>{(signedIn) => <HowItWorks audience="apps" signedIn={signedIn} />}</WithSignedIn>
      </Suspense>

      {/* Extra room under How it works, so its CTA and the calculator box don't crowd each other. */}
      <div className="mt-6 sm:mt-10">
        <Suspense fallback={<EarningsCalculator audience="apps" />}>
          <WithSignedIn>{(signedIn) => <EarningsCalculator audience="apps" signedIn={signedIn} />}</WithSignedIn>
        </Suspense>
      </div>

      <JoinStrip>
        <Suspense fallback={<HomeLogoCloudSkeleton />}>
          <HomeLogoCloud />
        </Suspense>
      </JoinStrip>

      <Suspense fallback={<HomeCatalogPreviewSkeleton />}>
        <WithSignedIn>{(signedIn) => <HomeCatalogPreview signedIn={signedIn} />}</WithSignedIn>
      </Suspense>

      <Suspense fallback={<WhyJoin />}>
        <WithSignedIn>{(signedIn) => <WhyJoin signedIn={signedIn} />}</WithSignedIn>
      </Suspense>

      <Testimonials />

      <HomePricing />

      <HomeFaq audience="apps" />
    </div>
  );
}
