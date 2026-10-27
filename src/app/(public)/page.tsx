import { SearchX, Store } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppCard } from "@/modules/catalog/components/app-card";
import { CatalogFilterBar } from "@/modules/catalog/components/catalog-filter-bar";
import { CreatorPitch, HomeFacts } from "@/modules/catalog/components/catalog-hero";
import { CatalogPagination } from "@/modules/catalog/components/catalog-pagination";
import { HomeHero } from "@/modules/catalog/components/home-hero";
import { LogoCloud } from "@/modules/catalog/components/logo-cloud";
import {
  hasActiveCatalogFilters,
  parseCatalogFilters,
  type RawSearchParams,
} from "@/modules/catalog/filters";
import { listCatalogApps } from "@/modules/catalog/queries";

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = parseCatalogFilters(rawParams);
  const result = await listCatalogApps(filters);
  const filtersActive = hasActiveCatalogFilters(filters);

  let catalog: React.ReactNode;
  if (result.totalCount === 0 && !filtersActive) {
    catalog = (
      <div className="flex flex-col gap-6">
        <CatalogFilterBar filters={filters} totalCount={0} />
        <EmptyModule
          icon={Store}
          title="No apps are listed yet"
          description="Apps appear here once their company has published a program and it passed our review."
        />
      </div>
    );
  } else {
    catalog = (
      <div className="flex flex-col gap-6">
        <CatalogFilterBar filters={filters} totalCount={result.totalCount} />

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
            <section
              aria-label="Published apps"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {result.items.map((app) => (
                <AppCard key={app.appId} app={app} filters={filters} />
              ))}
            </section>

            <CatalogPagination
              filters={filters}
              totalCount={result.totalCount}
              pageSize={result.pageSize}
              totalPages={result.totalPages}
            />
          </>
        )}
      </div>
    );
  }

  // Fragment children are items of the page's flex column (see the order classes there).
  return (
    <>
      {/* Logos of the apps this page already loaded; hidden while searching so it doesn't echo the results. */}
      {filtersActive ? null : (
        <LogoCloud
          apps={result.items.map((app) => ({ slug: app.slug, name: app.name, logoUrl: app.logoUrl }))}
        />
      )}

      {/* Phones: the offers come straight after the hero; the facts band moves below them. */}
      <div className="order-3 lg:order-none">
        <HomeFacts />
      </div>

      <div id="offers" className="order-2 scroll-mt-24 lg:order-none">
        {catalog}
      </div>
    </>
  );
}

export default function CatalogPage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <HomeHero />

      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>

      <div className="order-4 lg:order-none">
        <CreatorPitch />
      </div>
    </div>
  );
}
