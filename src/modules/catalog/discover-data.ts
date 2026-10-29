import { logUnexpected } from "@/lib/log";
import { type CardPlanInfo, cardPlanInfo } from "./discover";
import { DEFAULT_CATALOG_FILTERS } from "./filters";
import { type CatalogAppCard, getPublishedAppBySlug, listCatalogApps } from "./queries";

// list_catalog_apps caps a page at 48 apps and only sorts newest first.
const PUBLISHED_PAGE_SIZE = 48;
const PUBLISHED_MAX_PAGES = 5;

/**
 * The unfiltered catalog, newest first, while it fits in a few pages: the
 * commission ranking and category counts need every app. `complete` is false
 * past that, and those sections are skipped rather than shown wrong.
 */
export async function loadPublishedCatalog(): Promise<{
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
export async function loadPlanInfo(apps: CatalogAppCard[]): Promise<Map<string, CardPlanInfo>> {
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
