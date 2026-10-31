import { Skeleton } from "@/components/ui/skeleton";
import { parseCatalogFilters } from "../filters";
import { listCatalogApps } from "../queries";
import { LogoCloud } from "./logo-cloud";

/** First catalog page, unfiltered: the strip sits above the search, so it never echoes the results. */
export async function HomeLogoCloud() {
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
export function HomeLogoCloudSkeleton() {
  return <Skeleton className="h-60 w-full rounded-2xl sm:h-66" />;
}
