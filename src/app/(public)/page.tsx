import { SearchX, Store } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logUnexpected } from "@/lib/log";
import { getViewer } from "@/modules/accounts/viewer";
import {
  HOME_AUDIENCE_PARAM,
  type HomeAudience,
  parseHomeAudience,
} from "@/modules/catalog/audience";
import { getDefaultHomeAudience } from "@/modules/catalog/audience-server";
import { AppCard } from "@/modules/catalog/components/app-card";
import { CatalogFilterBar } from "@/modules/catalog/components/catalog-filter-bar";
import { BenefitGrid } from "@/modules/catalog/components/benefit-grid";
import { CatalogPagination } from "@/modules/catalog/components/catalog-pagination";
import { AudienceSwitch } from "@/modules/catalog/components/home-audience";
import { HomeHero } from "@/modules/catalog/components/home-hero";
import { HowItWorks } from "@/modules/catalog/components/how-it-works";
import { JoinStrip } from "@/modules/catalog/components/join-strip";
import { LogoCloud } from "@/modules/catalog/components/logo-cloud";
import { CategoryTile } from "@/modules/catalog/components/category-tile";
import { FeaturedCarousel } from "@/modules/catalog/components/featured-carousel";
import { FeaturedSlide } from "@/modules/catalog/components/featured-slide";
import { ScrollRow } from "@/modules/catalog/components/scroll-row";
import {
  type CardPlanInfo,
  cardPlanInfo,
  countCategories,
  FEATURED_MAX,
  FEATURED_MIN,
  isNewListing,
  MAX_ROW_ITEMS,
  MIN_APPS_FOR_ROWS,
  MIN_ROW_ITEMS,
  shouldMarkNew,
  sortByCommission,
} from "@/modules/catalog/discover";
import {
  buildAppDetailHref,
  DEFAULT_CATALOG_FILTERS,
  hasActiveCatalogFilters,
  parseCatalogFilters,
  type RawSearchParams,
} from "@/modules/catalog/filters";
import { type CatalogAppCard, getPublishedAppBySlug, listCatalogApps } from "@/modules/catalog/queries";

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

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-full rounded-[20px]" />
      <Skeleton className="h-96 w-full rounded-[20px]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-96 w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

// list_catalog_apps caps a page at 48 apps and only sorts newest first.
const PUBLISHED_PAGE_SIZE = 48;
const PUBLISHED_MAX_PAGES = 5;

/**
 * The unfiltered catalog, newest first, while it fits in a few pages: the
 * commission ranking and category counts need every app. `complete` is false
 * past that, and those sections are skipped rather than shown wrong.
 */
async function loadPublishedCatalog(): Promise<{
  apps: CatalogAppCard[];
  total: number;
  complete: boolean;
  loadedAt: number;
}> {
  const first = await listCatalogApps(DEFAULT_CATALOG_FILTERS, PUBLISHED_PAGE_SIZE);
  const pageCount = Math.min(first.totalPages, PUBLISHED_MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      listCatalogApps({ ...DEFAULT_CATALOG_FILTERS, page: index + 2 }, PUBLISHED_PAGE_SIZE),
    ),
  );
  const apps = [first, ...rest].flatMap((page) => page.items);
  // Reference time for the "New" badges.
  return { apps, total: first.totalCount, complete: apps.length >= first.totalCount, loadedAt: Date.now() };
}

/** Billing chips and per-customer amounts for the apps on screen; an app is left out if its plans fail to load. */
async function loadPlanInfo(apps: CatalogAppCard[]): Promise<Map<string, CardPlanInfo>> {
  const slugs = [...new Set(apps.map((app) => app.slug))];
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const detail = await getPublishedAppBySlug(slug);
        return detail ? ([slug, cardPlanInfo(detail.plans)] as const) : null;
      } catch (error) {
        logUnexpected("catalog.discover.plans", error);
        return null;
      }
    }),
  );
  return new Map(entries.filter((entry) => entry !== null));
}

async function CatalogContent({
  searchParams,
  audience,
}: {
  searchParams: Promise<RawSearchParams>;
  audience: Promise<HomeAudience>;
}) {
  const rawParams = await searchParams;
  const filters = parseCatalogFilters(rawParams);
  const filtersActive = hasActiveCatalogFilters(filters);
  // Search, filters and later pages show only the results.
  const showDiscover = !filtersActive && filters.page === 1;
  const [result, currentAudience, published] = await Promise.all([
    listCatalogApps(filters),
    audience,
    showDiscover ? loadPublishedCatalog() : null,
  ]);

  const ranked = published?.complete ? sortByCommission(published.apps) : [];
  const featured = ranked.length >= FEATURED_MIN ? ranked.slice(0, FEATURED_MAX) : [];
  // A short catalog shows only Featured and All apps; the rows would repeat the same apps.
  const showRows = published !== null && published.total >= MIN_APPS_FOR_ROWS;
  const topCommission = showRows && ranked.length >= MIN_ROW_ITEMS ? ranked.slice(0, MAX_ROW_ITEMS) : [];
  const newest = showRows && published.apps.length >= MIN_ROW_ITEMS ? published.apps.slice(0, MAX_ROW_ITEMS) : [];
  const categories = showRows && published.complete ? countCategories(published.apps) : [];
  const markNew =
    published !== null &&
    shouldMarkNew(
      published.apps.filter((app) => isNewListing(app.publishedAt, published.loadedAt)).length,
      published.total,
    );
  const planInfo = await loadPlanInfo([...featured, ...topCommission, ...newest, ...result.items]);
  const href = (app: CatalogAppCard) => buildAppDetailHref(app.slug, filters);

  let catalog: React.ReactNode;
  if (result.totalCount === 0 && !filtersActive) {
    catalog = (
      <EmptyModule
        icon={Store}
        title="No apps are listed yet"
        description="Apps appear here once their company has published a program and it passed our review."
      />
    );
  } else {
    catalog = (
      <>
        {featured.length > 0 ? (
          <FeaturedCarousel
            labels={featured.map((app) => app.name)}
            slides={featured.map((app) => (
              <FeaturedSlide key={app.appId} app={app} href={href(app)} planInfo={planInfo.get(app.slug)} />
            ))}
          />
        ) : null}

        {topCommission.length > 0 ? (
          <ScrollRow title="Highest commission">
            {topCommission.map((app, index) => (
              <AppCard
                key={app.appId}
                app={app}
                href={href(app)}
                planInfo={planInfo.get(app.slug)}
                badge={{ kind: "rank", rank: index + 1 }}
              />
            ))}
          </ScrollRow>
        ) : null}

        {newest.length > 0 ? (
          <ScrollRow title="New on boostlink">
            {newest.map((app) => (
              <AppCard
                key={app.appId}
                app={app}
                href={href(app)}
                planInfo={planInfo.get(app.slug)}
                badge={markNew && isNewListing(app.publishedAt, published!.loadedAt) ? { kind: "new" } : undefined}
              />
            ))}
          </ScrollRow>
        ) : null}

        {categories.length >= MIN_ROW_ITEMS ? (
          <ScrollRow title="Browse by category" itemClassName="w-44">
            {categories.map(({ category, count }) => (
              <CategoryTile key={category} category={category} count={count} />
            ))}
          </ScrollRow>
        ) : null}

        <section aria-labelledby="all-apps-heading" className="flex flex-col gap-3">
          <h3 id="all-apps-heading" className="text-lg font-bold tracking-tight sm:text-xl">
            All apps
          </h3>
          {result.items.length === 0 ? (
            <EmptyModule
              icon={SearchX}
              title="No apps match these filters"
              description="Try clearing a filter or searching with different keywords."
            >
              <Button asChild variant="outline">
                <Link href="/">Clear filters</Link>
              </Button>
            </EmptyModule>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((app) => (
                  <li key={app.appId} className="flex">
                    <AppCard app={app} href={href(app)} planInfo={planInfo.get(app.slug)} glow />
                  </li>
                ))}
              </ul>
              <CatalogPagination
                filters={filters}
                totalCount={result.totalCount}
                pageSize={result.pageSize}
                totalPages={result.totalPages}
              />
            </>
          )}
        </section>
      </>
    );
  }

  return (
    // Below lg the header carries the toggle row, so anchors need more room.
    <div id="offers" className="flex scroll-mt-36 flex-col gap-8 lg:scroll-mt-24">
      <div className="flex flex-col gap-4">
        <AudienceSwitch
          audience={currentAudience}
          creators={null}
          apps={
            <h2 className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
              This is how creators see your offer
            </h2>
          }
        />
        <CatalogFilterBar filters={filters} totalCount={result.totalCount} />
      </div>
      {catalog}
    </div>
  );
}

export default function CatalogPage({ searchParams }: PageProps<"/">) {
  const audience = resolveAudience(searchParams);

  // Intro (hero, how it works, benefits), then the join strip with the logo cloud and the catalog. The static
  // shell shows the creator version; the resolved audience streams in.
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <Suspense fallback={<HomeHero audience="creators" />}>
        <HeroByAudience audience={audience} />
      </Suspense>

      <Suspense fallback={<HowItWorks audience="creators" />}>
        <ByAudience
          audience={audience}
          creators={<HowItWorks audience="creators" />}
          apps={<HowItWorks audience="apps" />}
        />
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

      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParams={searchParams} audience={audience} />
      </Suspense>
    </div>
  );
}
