import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MetricsRow, MetricValueSkeleton } from "@/components/layout/metrics-row";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireViewer, type Viewer } from "@/modules/accounts/viewer";
import {
  ClicksValue,
  CommissionThisMonthValue,
  PayingCustomersValue,
} from "@/modules/attribution/components/result-metrics";
import {
  GetStartedChecklist,
  type GetStartedStep,
  HowYouGetPaid,
  ProgramsSection,
  ProgramsSkeleton,
  SimilarAppsList,
  SimilarAppsSkeleton,
} from "@/modules/programs/components/creator-overview";
import {
  type CreatorProgramSummary,
  listCreatorProgramMemberships,
  listSimilarAppsForCreator,
} from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Overview" };

type ViewerPromise = Promise<Viewer>;
type ProgramsPromise = Promise<CreatorProgramSummary[]>;

async function ViewerName({ viewer }: { viewer: ViewerPromise }) {
  return (await viewer).displayName;
}

/** Shown while a step is open; ticked from the creator's own data. */
async function Checklist({ viewer, programs }: { viewer: ViewerPromise; programs: ProgramsPromise }) {
  const [{ creator }, list] = await Promise.all([viewer, programs]);
  const steps: GetStartedStep[] = [
    {
      title: "Add a social profile",
      description: "Show companies where you post.",
      href: "/creator/settings",
      done: (creator?.socialLinkCount ?? 0) > 0,
    },
    {
      title: "Join your first program",
      description: "Pick an app and get your link and code.",
      href: "/",
      done: list.length > 0,
    },
    {
      title: "Create a link for each channel",
      description: "One named link per place you post, like “Instagram bio”.",
      href: "/creator/links",
      // Joining creates the default link; a named one is any other.
      done: list.some((program) => program.links.some((link) => !link.isDefault)),
    },
  ];
  return steps.some((step) => !step.done) ? <GetStartedChecklist steps={steps} /> : null;
}

async function Programs({ programs }: { programs: ProgramsPromise }) {
  return <ProgramsSection programs={await programs} />;
}

/** Suggestions come from the categories of joined programs; without one there's nothing to load. */
async function SimilarApps({ viewer, programs }: { viewer: ViewerPromise; programs: ProgramsPromise }) {
  const [{ userId }, list] = await Promise.all([viewer, programs]);
  if (list.length === 0) return <SimilarAppsList apps={[]} hasPrograms={false} />;
  const apps = await listSimilarAppsForCreator(userId, 3);
  return <SimilarAppsList apps={apps} hasPrograms />;
}

/** Clicks, paying customers and this month's commission across all programs; each tile loads its own figure. */
function Results() {
  return (
    <MetricsRow
      metrics={[
        {
          label: "Clicks",
          href: "/creator/links",
          value: (
            <Suspense fallback={<MetricValueSkeleton />}>
              <ClicksValue caption="All your links" />
            </Suspense>
          ),
        },
        {
          label: "Paying customers",
          href: "/creator/referrals",
          value: (
            <Suspense fallback={<MetricValueSkeleton />}>
              <PayingCustomersValue caption="Referred by you" />
            </Suspense>
          ),
        },
        {
          label: "Earned this month",
          href: "/creator/earnings",
          value: (
            <Suspense fallback={<MetricValueSkeleton />}>
              <CommissionThisMonthValue caption="Sandbox amounts" />
            </Suspense>
          ),
        },
      ]}
    />
  );
}

/**
 * The page itself awaits nothing: the viewer and memberships are started
 * here and awaited only inside <Suspense>, so navigating to the overview
 * shows its frame at once (heading, results, "How you get paid") and each
 * data section streams in on its own.
 */
export default function CreatorOverviewPage() {
  const viewer = requireViewer("/creator");
  const programs = viewer.then((current) => listCreatorProgramMemberships(current.userId));

  return (
    <>
      <PageHeader
        title={
          <>
            Hi,{" "}
            <Suspense fallback={<Skeleton className="inline-block h-6 w-24 align-middle" />}>
              <ViewerName viewer={viewer} />
            </Suspense>
          </>
        }
        description="Your programs, links and results in one place."
        actions={
          <Button asChild size="lg">
            <Link href="/">Discover apps</Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-6">
        {/* No placeholder: the card shows only while a step is open, and most visits are from creators who are done. */}
        <Suspense fallback={null}>
          <Checklist viewer={viewer} programs={programs} />
        </Suspense>
        <Results />
        {/* Desktop: programs in two thirds, payment info and suggestions beside them. Phones: one column in this order. */}
        {/* grid-cols-1: an implicit track would grow to its content's min width and overflow on phones. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <Suspense fallback={<ProgramsSkeleton />}>
              <Programs programs={programs} />
            </Suspense>
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <HowYouGetPaid />
            <Suspense fallback={<SimilarAppsSkeleton />}>
              <SimilarApps viewer={viewer} programs={programs} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
