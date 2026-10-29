import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HomeAudience } from "../audience";
import { FEATURED_MAX, FEATURED_MIN, sortByCommission } from "../discover";
import { loadPlanInfo, loadPublishedCatalog } from "../discover-data";
import { buildAppDetailHref, DEFAULT_CATALOG_FILTERS } from "../filters";
import type { CatalogAppCard } from "../queries";
import { AppCard } from "./app-card";
import { PRIMARY_CTA, PRIMARY_CTA_ARROW } from "./cta-styles";
import { FeaturedCarousel } from "./featured-carousel";
import { FeaturedSlide } from "./featured-slide";
import { AudienceSwitch } from "./home-audience";

/** Apps in the "More apps" grid: two full rows from lg. */
const MORE_APPS_MAX = 6;

const HEADING = "text-2xl leading-tight font-extrabold tracking-[-0.04em] sm:text-3xl";

/** Below lg the header carries the toggle row, so anchors need more room. */
const WRAPPER = "flex scroll-mt-36 flex-col gap-8 lg:scroll-mt-24";

export function HomeCatalogPreviewSkeleton() {
  return (
    <div id="offers" className={WRAPPER}>
      <Skeleton className="h-96 w-full rounded-[20px]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-96 w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

/**
 * The home page's catalog (`#offers`): the featured carousel, a few more of
 * the newest apps and a "See all apps" link to Discover, which needs an
 * account. No filters, search or pagination; those live on Discover.
 */
export async function HomeCatalogPreview({ audience, signedIn }: { audience: HomeAudience; signedIn: boolean }) {
  const published = await loadPublishedCatalog();
  const ranked = published.complete ? sortByCommission(published.apps) : [];
  const featured = ranked.length >= FEATURED_MIN ? ranked.slice(0, FEATURED_MAX) : [];
  const featuredIds = new Set(featured.map((app) => app.appId));
  // Newest first, like the published list itself.
  const more = published.apps.filter((app) => !featuredIds.has(app.appId)).slice(0, MORE_APPS_MAX);
  const planInfo = await loadPlanInfo([...featured, ...more]);
  const href = (app: CatalogAppCard) => buildAppDetailHref(app.slug, DEFAULT_CATALOG_FILTERS);

  return (
    <div id="offers" className={WRAPPER}>
      <AudienceSwitch
        audience={audience}
        creators={
          <div className="flex flex-col gap-1.5">
            <h2 className={HEADING}>Discover apps</h2>
            <p className="text-base text-muted-foreground">A few of the programs open right now.</p>
          </div>
        }
        apps={<h2 className={HEADING}>This is how creators see your offer</h2>}
      />

      {published.total === 0 ? (
        <EmptyModule
          icon={Store}
          title="No apps are listed yet"
          description="Apps appear here once their company has published a program and it passed our review."
        />
      ) : (
        <>
          {featured.length > 0 ? (
            <FeaturedCarousel
              labels={featured.map((app) => app.name)}
              slides={featured.map((app) => (
                <FeaturedSlide key={app.appId} app={app} href={href(app)} planInfo={planInfo.get(app.slug)} />
              ))}
            />
          ) : null}

          {more.length > 0 ? (
            <section aria-labelledby="more-apps-heading" className="flex flex-col gap-3">
              <h3 id="more-apps-heading" className="text-lg font-bold tracking-tight sm:text-xl">
                More apps
              </h3>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((app) => (
                  <li key={app.appId} className="flex">
                    <AppCard app={app} href={href(app)} planInfo={planInfo.get(app.slug)} glow />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-col items-center gap-3 text-center">
            <Button asChild size="lg" className={cn(PRIMARY_CTA, "max-sm:w-auto")}>
              <Link href={signedIn ? "/creator/discover" : "/signup?next=/creator/discover"}>
                See all apps
                <ArrowRight aria-hidden className={PRIMARY_CTA_ARROW} />
              </Link>
            </Button>
            {signedIn ? null : (
              <p className="text-sm text-muted-foreground">Free account needed to see every program.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
