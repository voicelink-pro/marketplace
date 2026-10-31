import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange } from "@/lib/money";
import { getViewer } from "@/modules/accounts/viewer";
import type { AppPlatform } from "../constants";
import { DEMO_PROGRAM_STATS } from "../demo-program-stats";
import { loadPublishedCatalog } from "../discover-data";
import { buildAppDetailHref, DEFAULT_CATALOG_FILTERS } from "../filters";
import { type CatalogAppCard } from "../queries";
import { type OpenProgram, OpenProgramsCarousel, type ProgramRowData } from "./open-programs-carousel";
import { SectionDivider } from "./section-divider";

/** Newest first, like the catalog; enough for a full loop. */
const MAX_PROGRAMS = 12;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** "3h", "1d", "2w", "3mo", "1y" since publishing. */
function compactAge(publishedAt: string, now: number): string {
  const elapsed = Math.max(0, now - new Date(publishedAt).getTime());
  if (elapsed < DAY) return `${Math.max(1, Math.floor(elapsed / HOUR))}h`;
  const days = Math.floor(elapsed / DAY);
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** Web and SaaS share one globe; then iOS and Android. */
function platformMarks(platforms: AppPlatform[]): AppPlatform[] {
  const marks: AppPlatform[] = [];
  if (platforms.includes("web") || platforms.includes("saas")) marks.push("web");
  if (platforms.includes("ios")) marks.push("ios");
  if (platforms.includes("android")) marks.push("android");
  return marks;
}

/**
 * The creators home page's "Open programs": published apps by creators joined,
 * then (behind "See more programs") by top commission and by publishing date,
 * each up to 12. "See all programs" goes to
 * sign-up first for visitors without a session, like the catalog preview.
 * Nothing renders while no app is published.
 */
export async function OpenPrograms() {
  const [published, viewer] = await Promise.all([loadPublishedCatalog(), getViewer()]);
  if (published.apps.length === 0) return null;

  const toProgram = (app: CatalogAppCard): OpenProgram => ({
    id: app.appId,
    href: buildAppDetailHref(app.slug, DEFAULT_CATALOG_FILTERS),
    name: app.name,
    tagline: app.tagline,
    logoUrl: app.logoUrl,
    coverUrl: app.coverImageUrl,
    platforms: platformMarks(app.platforms),
    age: compactAge(app.publishedAt, published.loadedAt),
    commission: app.maxCommissionBps > 0 ? formatCommissionRange(app.minCommissionBps, app.maxCommissionBps, "") : null,
    ...DEMO_PROGRAM_STATS[app.slug],
  });
  const row = (apps: CatalogAppCard[]) => apps.slice(0, MAX_PROGRAMS).map(toProgram);
  const sorted = (compare: (a: CatalogAppCard, b: CatalogAppCard) => number) => row([...published.apps].sort(compare));
  const time = (app: CatalogAppCard) => new Date(app.publishedAt).getTime();

  const first: ProgramRowData = {
    title: "Most popular",
    // Demo creator counts until real data exists; apps without one go last.
    programs: sorted(
      (a, b) => (DEMO_PROGRAM_STATS[b.slug]?.creatorsJoined ?? -1) - (DEMO_PROGRAM_STATS[a.slug]?.creatorsJoined ?? -1),
    ),
  };
  const moreRows: ProgramRowData[] = [
    { title: "Highest commission", programs: sorted((a, b) => b.maxCommissionBps - a.maxCommissionBps) },
    { title: "New on boostlink", programs: sorted((a, b) => time(b) - time(a)) },
  ];

  // The divider is a sibling of the section, so the page's section gap sits above and below it.
  return (
    <>
      <OpenProgramsCarousel
        first={first}
        moreRows={moreRows}
        totalCount={published.total}
        seeAllHref={viewer ? "/creator/discover" : "/signup?next=/creator/discover"}
      />
      <SectionDivider />
    </>
  );
}

/** Header, a row of card-sized placeholders, the toggle and the divider, the same height as the loaded section. */
export function OpenProgramsSkeleton() {
  return (
    <>
      {/* `#offers` already while loading, so "Discover apps" has its target. */}
      <div id="offers" aria-hidden className="flex scroll-mt-36 flex-col gap-6 sm:gap-8 lg:scroll-mt-24">
        <div className="flex flex-col gap-2 px-6 sm:px-12 lg:px-16">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="flex justify-center gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-[333px] w-[300px] shrink-0 rounded-[20px] sm:w-[360px]" />
          ))}
        </div>
        <Skeleton className="h-10 w-44 self-center rounded-full" />
      </div>
      <SectionDivider />
    </>
  );
}
