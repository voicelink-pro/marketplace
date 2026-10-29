import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getViewer } from "@/modules/accounts/viewer";
import {
  HOME_AUDIENCE_PARAM,
  type HomeAudience,
  parseHomeAudience,
} from "@/modules/catalog/audience";
import { getDefaultHomeAudience } from "@/modules/catalog/audience-server";
import { EarningsCalculator } from "@/modules/catalog/components/calculator/earnings-calculator";
import { AudienceSwitch } from "@/modules/catalog/components/home-audience";
import {
  HomeCatalogPreview,
  HomeCatalogPreviewSkeleton,
} from "@/modules/catalog/components/home-catalog-preview";
import { HomeFaq } from "@/modules/catalog/components/home-faq";
import { HomeHero } from "@/modules/catalog/components/home-hero";
import { HowItWorks } from "@/modules/catalog/components/how-it-works";
import { JoinStrip } from "@/modules/catalog/components/join-strip";
import { LogoCloud } from "@/modules/catalog/components/logo-cloud";
import { NewEraSection, NewEraSubtitle } from "@/modules/catalog/components/new-era/new-era-section";
import { PlatformStrip } from "@/modules/catalog/components/platform-strip";
import { Testimonials } from "@/modules/catalog/components/testimonials";
import { WhyJoin } from "@/modules/catalog/components/why-join";
import { parseCatalogFilters, type RawSearchParams } from "@/modules/catalog/filters";
import { listCatalogApps } from "@/modules/catalog/queries";

/** `?for=` wins; otherwise the same default the header toggle uses. */
async function resolveAudience(
  searchParams: Promise<RawSearchParams>,
): Promise<HomeAudience> {
  const requested = parseHomeAudience(
    (await searchParams)[HOME_AUDIENCE_PARAM],
  );
  return requested ?? (await getDefaultHomeAudience());
}

/** Renders both variants on the server; the client shows the one the toggle picked. */
async function ByAudience({
  audience,
  creators,
  apps,
}: {
  audience: Promise<HomeAudience>;
  creators: React.ReactNode;
  apps: React.ReactNode;
}) {
  return (
    <AudienceSwitch audience={await audience} creators={creators} apps={apps} />
  );
}

/** The hero for the resolved audience; the apps CTA sends visitors without a session to sign up first. */
async function HeroByAudience({ audience }: { audience: Promise<HomeAudience> }) {
  const [currentAudience, viewer] = await Promise.all([audience, getViewer()]);
  return (
    <AudienceSwitch
      audience={currentAudience}
      creators={<HomeHero audience="creators" />}
      apps={<HomeHero audience="apps" signedIn={viewer !== null} />}
    />
  );
}

/** How it works for the resolved audience; its apps CTA follows the hero's sign-up rule. */
/** Why join for the resolved audience; its CTA follows the hero's sign-up rule. */
async function WhyJoinByAudience({ audience }: { audience: Promise<HomeAudience> }) {
  const [currentAudience, viewer] = await Promise.all([audience, getViewer()]);
  return (
    <AudienceSwitch
      audience={currentAudience}
      creators={<WhyJoin audience="creators" />}
      apps={<WhyJoin audience="apps" signedIn={viewer !== null} />}
    />
  );
}

async function HowItWorksByAudience({ audience }: { audience: Promise<HomeAudience> }) {
  const [currentAudience, viewer] = await Promise.all([audience, getViewer()]);
  return (
    <AudienceSwitch
      audience={currentAudience}
      creators={<HowItWorks audience="creators" />}
      apps={<HowItWorks audience="apps" signedIn={viewer !== null} />}
    />
  );
}

/** The calculator for the resolved audience; its apps link follows the hero's sign-up rule. Keyed so each side keeps its own inputs. */
async function CalculatorByAudience({ audience }: { audience: Promise<HomeAudience> }) {
  const [currentAudience, viewer] = await Promise.all([audience, getViewer()]);
  return (
    <AudienceSwitch
      audience={currentAudience}
      creators={<EarningsCalculator key="creators" audience="creators" />}
      apps={<EarningsCalculator key="apps" audience="apps" signedIn={viewer !== null} />}
    />
  );
}

/** The catalog preview; "See all apps" goes to sign-up first for visitors without a session. */
async function CatalogPreviewByAudience({ audience }: { audience: Promise<HomeAudience> }) {
  const [currentAudience, viewer] = await Promise.all([audience, getViewer()]);
  return <HomeCatalogPreview audience={currentAudience} signedIn={viewer !== null} />;
}

/** The FAQ for the resolved audience; its final CTA follows the hero's sign-up rule. Keyed so an open answer doesn't carry over. */
async function FaqByAudience({ audience }: { audience: Promise<HomeAudience> }) {
  const [currentAudience, viewer] = await Promise.all([audience, getViewer()]);
  return (
    <AudienceSwitch
      audience={currentAudience}
      creators={<HomeFaq key="creators" audience="creators" />}
      apps={<HomeFaq key="apps" audience="apps" signedIn={viewer !== null} />}
    />
  );
}

/** First catalog page, unfiltered: the strip sits above the search, so it never echoes the results. */
async function HomeLogoCloud() {
  const result = await listCatalogApps(parseCatalogFilters({}));
  return (
    <LogoCloud
      apps={result.items.map((app) => ({
        slug: app.slug,
        name: app.name,
        logoUrl: app.logoUrl,
      }))}
    />
  );
}

/** Three logo rows plus the pause button. */
function LogoCloudSkeleton() {
  return <Skeleton className="h-60 w-full rounded-2xl sm:h-66" />;
}

export default function CatalogPage({ searchParams }: PageProps<"/">) {
  const audience = resolveAudience(searchParams);

  // Hero, new era, how it works and the calculator; the join strip with the logo cloud right above the catalog preview;
  // then benefits, testimonials and the FAQ with the final CTA. The static shell shows the creator version; the resolved
  // audience streams in.
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <Suspense fallback={<HomeHero audience="creators" />}>
        <HeroByAudience audience={audience} />
      </Suspense>

      {/* Its own py is the space on both sides: cancels the page gap around it, and from lg New era's top padding too. */}
      <PlatformStrip className="-my-10 sm:-my-14 lg:-mb-28" />

      <NewEraSection
        subtitle={
          <Suspense fallback={<NewEraSubtitle audience="creators" />}>
            <ByAudience
              audience={audience}
              creators={<NewEraSubtitle audience="creators" />}
              apps={<NewEraSubtitle audience="apps" />}
            />
          </Suspense>
        }
      />

      <Suspense fallback={<HowItWorks audience="creators" />}>
        <HowItWorksByAudience audience={audience} />
      </Suspense>

      <Suspense fallback={<EarningsCalculator audience="creators" />}>
        <CalculatorByAudience audience={audience} />
      </Suspense>

      <JoinStrip>
        <Suspense fallback={<LogoCloudSkeleton />}>
          <HomeLogoCloud />
        </Suspense>
      </JoinStrip>

      <Suspense fallback={<HomeCatalogPreviewSkeleton />}>
        <CatalogPreviewByAudience audience={audience} />
      </Suspense>

      <Suspense fallback={<WhyJoin audience="creators" />}>
        <WhyJoinByAudience audience={audience} />
      </Suspense>

      <Suspense fallback={<Testimonials audience="creators" />}>
        <ByAudience
          audience={audience}
          creators={<Testimonials audience="creators" />}
          apps={<Testimonials audience="apps" />}
        />
      </Suspense>

      <Suspense fallback={<HomeFaq audience="creators" />}>
        <FaqByAudience audience={audience} />
      </Suspense>
    </div>
  );
}
