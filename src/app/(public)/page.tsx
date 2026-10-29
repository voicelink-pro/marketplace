import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getViewer } from "@/modules/accounts/viewer";
import {
  HOME_AUDIENCE_PARAM,
  type HomeAudience,
  parseHomeAudience,
} from "@/modules/catalog/audience";
import { getDefaultHomeAudience } from "@/modules/catalog/audience-server";
import { BenefitGrid } from "@/modules/catalog/components/benefit-grid";
import { CatalogSection } from "@/modules/catalog/components/catalog-section";
import { AudienceSwitch } from "@/modules/catalog/components/home-audience";
import { HomeHero } from "@/modules/catalog/components/home-hero";
import { HowItWorks } from "@/modules/catalog/components/how-it-works";
import { JoinStrip } from "@/modules/catalog/components/join-strip";
import { LogoCloud } from "@/modules/catalog/components/logo-cloud";
import { NewEraSection, NewEraSubtitle } from "@/modules/catalog/components/new-era/new-era-section";
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

  // Intro (hero, new era, how it works, benefits), then the join strip with the logo cloud and the catalog. The static
  // shell shows the creator version; the resolved audience streams in.
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <Suspense fallback={<HomeHero audience="creators" />}>
        <HeroByAudience audience={audience} />
      </Suspense>

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

      {/* Keyed so switching sides replays the illustrations. */}
      <Suspense fallback={<BenefitGrid audience="creators" />}>
        <ByAudience
          audience={audience}
          creators={<BenefitGrid key="creators" audience="creators" />}
          apps={<BenefitGrid key="apps" audience="apps" />}
        />
      </Suspense>

      <JoinStrip>
        <Suspense fallback={<LogoCloudSkeleton />}>
          <HomeLogoCloud />
        </Suspense>
      </JoinStrip>

      <CatalogSection searchParams={searchParams} audience={audience} />
    </div>
  );
}
