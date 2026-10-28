import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { type Metric, MetricsRow, MetricValue, MetricValueSkeleton } from "@/components/layout/metrics-row";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  primaryOrganization,
  requireViewer,
  type Viewer,
  type ViewerOrganization,
} from "@/modules/accounts/viewer";
import {
  ClicksValue,
  CommissionThisMonthValue,
  PayingCustomersValue,
  settled,
} from "@/modules/attribution/components/result-metrics";
import { appReadiness } from "@/modules/company-app/components/app-readiness";
import {
  AddAppCard,
  OfferPreview,
  OfferPreviewSkeleton,
  SetupChecklist,
  SetupChecklistSkeleton,
  StatusTimeline,
  StatusTimelineSkeleton,
} from "@/modules/company-app/components/company-overview";
import { getCompanyWorkspaceApp, listCompanyCreators } from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "Company overview" };

type OrganizationPromise = Promise<ViewerOrganization>;

function organizationOf(viewer: Viewer): ViewerOrganization {
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");
  return organization;
}

async function OrganizationName({ organization }: { organization: OrganizationPromise }) {
  return (await organization).name;
}

/** Its own query after the app's. Creators live in the app tables, so this tile works in the local sandbox too. */
async function CreatorsJoined({ appId }: { appId: string }) {
  const creators = await settled(() => listCompanyCreators(appId));
  return creators ? (
    <MetricValue value={creators.length} caption="In your program" />
  ) : (
    <MetricValue caption="Unavailable" />
  );
}

/**
 * Results row for the company's app; each tile loads its own figure. Without
 * an app id (the overview is still loading) every tile is a skeleton.
 */
function Results({ appId }: { appId?: string }) {
  const tile = (figure: (appId: string) => React.ReactNode) =>
    appId ? <Suspense fallback={<MetricValueSkeleton />}>{figure(appId)}</Suspense> : <MetricValueSkeleton />;
  const metrics: Metric[] = [
    { label: "Creators joined", href: "/company/creators", value: tile((id) => <CreatorsJoined appId={id} />) },
    {
      label: "Clicks",
      href: "/company/referrals",
      value: tile((id) => <ClicksValue company appId={id} caption="All creators’ links" />),
    },
    {
      label: "Paying customers",
      href: "/company/referrals",
      value: tile((id) => <PayingCustomersValue company appId={id} caption="Referred customers" />),
    },
    {
      label: "Commission this month",
      href: "/company/funding",
      value: tile((id) => <CommissionThisMonthValue company appId={id} caption="Sandbox amounts" />),
    },
  ];
  return <MetricsRow metrics={metrics} />;
}

/** Desktop: checklist in two thirds, the creator's view of the offer beside it. Phones: one column in this order. */
function OverviewGrid({ checklist, preview }: { checklist: React.ReactNode; preview: React.ReactNode }) {
  return (
    // grid-cols-1: an implicit track would grow to its content's min width and overflow on phones.
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">{checklist}</div>
      <div className="min-w-0">{preview}</div>
    </div>
  );
}

/** Everything that depends on the app: status, checklist, preview and results. */
async function Overview({ organization }: { organization: OrganizationPromise }) {
  const { id, name } = await organization;
  const app = await getCompanyWorkspaceApp(id, name);

  // No app, no results: the card is the one next step.
  if (!app) return <AddAppCard />;

  return (
    <>
      {app.status === "rejected" && app.rejectionReason ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Administrator requested changes on {app.name}</AlertTitle>
          <AlertDescription>{app.rejectionReason}</AlertDescription>
        </Alert>
      ) : null}
      <StatusTimeline app={app} />
      <OverviewGrid checklist={<SetupChecklist checklist={appReadiness(app)} app={app} />} preview={<OfferPreview app={app} />} />
      <Results appId={app.id} />
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <StatusTimelineSkeleton />
      <OverviewGrid checklist={<SetupChecklistSkeleton />} preview={<OfferPreviewSkeleton />} />
      <Results />
    </>
  );
}

/**
 * The page itself awaits nothing: the viewer is started here and awaited only
 * inside <Suspense>, so navigating to the overview shows its frame at once and
 * the company name and app sections stream in.
 */
export default function CompanyOverviewPage() {
  const organization = requireViewer("/company").then(organizationOf);

  return (
    <>
      <PageHeader
        title={
          <Suspense fallback={<Skeleton className="inline-block h-6 w-40 align-middle" />}>
            <OrganizationName organization={organization} />
          </Suspense>
        }
        description="Your app, its program and its results."
      />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<OverviewSkeleton />}>
          <Overview organization={organization} />
        </Suspense>
      </div>
    </>
  );
}
