import { SearchX, Store } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeAudience } from "../audience";
import {
  countCategories,
  FEATURED_MAX,
  FEATURED_MIN,
  isNewListing,
  MAX_ROW_ITEMS,
  MIN_APPS_FOR_ROWS,
  MIN_ROW_ITEMS,
  shouldMarkNew,
  sortByCommission,
} from "../discover";
import { loadPlanInfo, loadPublishedCatalog } from "../discover-data";
import {
  buildAppDetailHref,
  hasActiveCatalogFilters,
  parseCatalogFilters,
  type RawSearchParams,
} from "../filters";
import { type CatalogAppCard, listCatalogApps } from "../queries";
import { AppCard } from "./app-card";
import { CatalogFilterBar } from "./catalog-filter-bar";
import { CatalogPagination } from "./catalog-pagination";
import { CategoryTile } from "./category-tile";
import { FeaturedCarousel } from "./featured-carousel";
import { FeaturedSlide } from "./featured-slide";
import { AudienceSwitch } from "./home-audience";
import { ScrollRow } from "./scroll-row";

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

type CatalogSectionProps = {
  searchParams: Promise<RawSearchParams>;
  /** The page the catalog lives on; filters, search and pagination stay there. */
  basePath?: string;
  /** Home page only: the apps side gets a heading above the filter bar. */
  audience?: Promise<HomeAudience>;
  /** False when the page heading already says "Discover apps". */
  showTitle?: boolean;
};

async function CatalogContent({ searchParams, basePath = "/", audience, showTitle = true }: CatalogSectionProps) {
  const rawParams = await searchParams;
  const filters = parseCatalogFilters(rawParams);
  const filtersActive = hasActiveCatalogFilters(filters);
  // Search, filters and later pages show only the results.
  const showDiscover = !filtersActive && filters.page === 1;
  const [result, currentAudience, published] = await Promise.all([
    listCatalogApps(filters),
    audience ?? null,
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
              <CategoryTile key={category} category={category} count={count} basePath={basePath} />
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
                <Link href={basePath}>Clear filters</Link>
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
                basePath={basePath}
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
        {currentAudience ? (
          <AudienceSwitch
            audience={currentAudience}
            creators={null}
            apps={
              <h2 className="text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl">
                This is how creators see your offer
              </h2>
            }
          />
        ) : null}
        <CatalogFilterBar
          filters={filters}
          totalCount={result.totalCount}
          basePath={basePath}
          showTitle={showTitle}
        />
      </div>
      {catalog}
    </div>
  );
}

/**
 * The catalog block (`#offers`): filter bar, featured carousel, rows, the
 * all-apps grid with pagination, and the empty states. Used on the home page
 * and on Discover in the creator panel.
 */
export function CatalogSection(props: CatalogSectionProps) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent {...props} />
    </Suspense>
  );
}
