import { KeyRound, Link2, MousePointerClick, Plus, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StatStrip, StatValue, StatValueSkeleton } from "@/components/layout/stat-strip";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireViewer } from "@/modules/accounts/viewer";
import { CreateLinkDialog } from "@/modules/programs/components/create-link-dialog";
import { HomeCard } from "@/modules/programs/components/home/card";
import { percentOf } from "@/modules/programs/components/home/home-data";
import { type LinkSort, linkRows, linksHref, parseSort, plural, sortLinkRows } from "@/modules/programs/components/links/link-data";
import { LinkRowsSkeleton, LinkTable } from "@/modules/programs/components/links/link-rows";
import { CountingRules, ReferralCodes } from "@/modules/programs/components/links/links-side-cards";
import { type AttributionSummary, loadAttribution } from "@/modules/programs/components/links/load-attribution";
import { ProgramFilter } from "@/modules/programs/components/links/program-filter";
import { SortMenu } from "@/modules/programs/components/links/sort-menu";
import { type CreatorProgramSummary, listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Links" };

const DESCRIPTION = "One link per place you post. See which one brings customers.";

type LinksData = {
  /** The filtered program, or every program. */
  visible: CreatorProgramSummary[];
  selected: CreatorProgramSummary | undefined;
  sort: LinkSort;
  attribution: Promise<AttributionSummary | undefined>;
};

const count = new Intl.NumberFormat("en");
const untracked = <StatValue value="—" caption="Tracking unavailable" muted />;

async function ClicksStat({ data }: { data: LinksData }) {
  const summary = await data.attribution;
  if (!summary) return untracked;
  return (
    <StatValue
      value={count.format(summary.clicks)}
      caption={data.selected ? `All time, ${data.selected.appName}` : "All time, all links"}
    />
  );
}

async function LinkSignupsStat({ data }: { data: LinksData }) {
  const summary = await data.attribution;
  if (!summary) return untracked;
  const rate = percentOf(summary.registrations, summary.clicks);
  return (
    <StatValue value={count.format(summary.registrations)} caption={rate ? `${rate} of clicks` : "Via your links"} />
  );
}

async function CodeSignupsStat({ data }: { data: LinksData }) {
  const summary = await data.attribution;
  if (!summary) return untracked;
  return <StatValue value={count.format(summary.code_registrations)} caption="Typed at sign-up" />;
}

/** The strip's cells, shared with the page skeleton; Links counts come with the programs. */
const STAT_CELLS = [
  { icon: MousePointerClick, label: "Clicks", Value: ClicksStat },
  { icon: UserPlus, label: "Link sign-ups", Value: LinkSignupsStat },
  { icon: KeyRound, label: "Code sign-ups", Value: CodeSignupsStat },
];

function Overview({ data }: { data: LinksData }) {
  const links = data.visible.reduce((total, program) => total + program.links.length, 0);
  return (
    <StatStrip
      ariaLabel="Link results, all time"
      cells={[
        ...STAT_CELLS.map(({ icon, label, Value }) => ({
          icon,
          label,
          value: (
            <Suspense fallback={<StatValueSkeleton />}>
              <Value data={data} />
            </Suspense>
          ),
        })),
        {
          icon: Link2,
          label: "Links",
          value: <StatValue value={count.format(links)} caption={`Across ${plural(data.visible.length, "program")}`} />,
        },
      ]}
    />
  );
}

/** Rows in the chosen order once the results arrive; without named links, a nudge to make some. */
async function LinkList({ data }: { data: LinksData }) {
  const summary = await data.attribution;
  const rows = sortLinkRows(linkRows(data.visible, summary?.links), data.sort);
  return (
    <>
      <LinkTable rows={rows} />
      {rows.some((row) => !row.isDefault) ? null : (
        <p className="pt-3 text-[13px] leading-snug text-muted-foreground sm:border-t">
          These are your primary links. Create one per place you post, like “TikTok bio” or “Video 1”, to see which one
          brings customers.
        </p>
      )}
    </>
  );
}

function CreateLinkButton({
  programs,
  selected,
}: {
  programs: CreatorProgramSummary[];
  selected: CreatorProgramSummary | undefined;
}) {
  return (
    <CreateLinkDialog
      programs={programs.map((program) => ({
        membershipId: program.membershipId,
        appName: program.appName,
        logoUrl: program.logoUrl,
        availableDestinations: program.availableDestinations,
      }))}
      defaultMembershipId={selected?.membershipId}
    >
      <Button>
        <Plus data-icon="inline-start" />
        Create link
      </Button>
    </CreateLinkDialog>
  );
}

/**
 * Programs decide the frame (empty state, filter, codes); clicks and
 * sign-ups stream into their own <Suspense>. Without tracking (local PGlite
 * sandbox or a failed query) results show "—", never 0.
 */
async function LinksContent({ searchParams }: Pick<PageProps<"/creator/links">, "searchParams">) {
  const [viewer, rawSearch] = await Promise.all([requireViewer("/creator/links"), searchParams]);
  const programs = await listCreatorProgramMemberships(viewer.userId);

  if (programs.length === 0) {
    return (
      <>
        <PageHeader title="Links" description={DESCRIPTION} />
        <EmptyModule
          icon={Link2}
          title="No links yet"
          description="Join a program first. Then create named links such as “Instagram bio” or “TikTok video 1” for that app."
          className="rounded-[20px]"
        >
          <Button asChild variant="outline">
            <Link href="/">Browse apps</Link>
          </Button>
        </EmptyModule>
      </>
    );
  }

  const slug = typeof rawSearch.program === "string" ? rawSearch.program.trim().toLowerCase() : "";
  // An unknown slug falls back to all programs.
  const selected = programs.find((program) => program.slug === slug);
  const visible = selected ? [selected] : programs;
  const data: LinksData = {
    visible,
    selected,
    sort: parseSort(rawSearch.sort),
    attribution: loadAttribution(selected?.appId),
  };

  return (
    <>
      <PageHeader
        title="Links"
        description={DESCRIPTION}
        actions={<CreateLinkButton programs={programs} selected={selected} />}
      />
      <div className="flex flex-col gap-7">
        <Overview data={data} />
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* One card from sm; on phones the rows are cards of their own, so the frame drops away. */}
          <HomeCard
            titleId="links-heading"
            className="gap-0 rounded-none border-0 bg-transparent p-0 sm:rounded-[20px] sm:border sm:bg-card sm:px-6 sm:pt-5 sm:pb-2 lg:col-span-2"
          >
            <h2 id="links-heading" className="sr-only">
              Your links
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 sm:border-b">
              {programs.length > 1 ? (
                <ProgramFilter
                  programs={programs.map(({ slug, appName }) => ({ slug, appName }))}
                  selected={selected?.slug ?? null}
                  hrefFor={(program) => linksHref(program, data.sort)}
                />
              ) : (
                <span />
              )}
              <SortMenu program={selected?.slug ?? null} sort={data.sort} />
            </div>
            <Suspense fallback={<LinkRowsSkeleton rows={Math.min(5, visible.flatMap((p) => p.links).length || 1)} />}>
              <LinkList data={data} />
            </Suspense>
          </HomeCard>
          <div className="flex min-w-0 flex-col gap-4">
            <ReferralCodes programs={visible} />
            <CountingRules windowDays={visible.map((program) => program.attributionWindowDays)} />
          </div>
        </div>
      </div>
    </>
  );
}

/** Header with a placeholder for its button, the strip and both columns, in the page's boxes. */
function LinksSkeleton() {
  return (
    <div aria-busy>
      <PageHeader title="Links" description={DESCRIPTION} actions={<Skeleton className="h-9 w-32 rounded-full" />} />
      <div className="flex flex-col gap-7">
        <StatStrip
          ariaLabel="Link results, all time"
          cells={[...STAT_CELLS, { icon: Link2, label: "Links" }].map(({ icon, label }) => ({
            icon,
            label,
            value: <StatValueSkeleton />,
          }))}
        />
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-[20px] lg:col-span-2" />
          <Skeleton className="h-56 rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}

/** Synchronous like Home: the viewer, programs and search params are read below, inside <Suspense>. */
export default function CreatorLinksPage({ searchParams }: PageProps<"/creator/links">) {
  return (
    <Suspense fallback={<LinksSkeleton />}>
      <LinksContent searchParams={searchParams} />
    </Suspense>
  );
}
