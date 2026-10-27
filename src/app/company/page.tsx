import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MetricsRow } from "@/components/layout/metrics-row";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  primaryOrganization,
  requireViewer,
  type Viewer,
  type ViewerOrganization,
} from "@/modules/accounts/viewer";
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

/** Its own query after the app's: streams into the metrics row without holding the rest back. */
async function CreatorsJoinedCount({ appId }: { appId: string }) {
  return (await listCompanyCreators(appId)).length;
}

function Metrics({ appId }: { appId: string | null }) {
  return (
    <MetricsRow
      metrics={[
        {
          label: "Creators joined",
          // Without an app nobody can have joined: a real zero, no query needed.
          value: appId ? (
            <Suspense fallback={<Skeleton className="inline-block h-[1em] w-8 align-top" />}>
              <CreatorsJoinedCount appId={appId} />
            </Suspense>
          ) : (
            0
          ),
          caption: appId ? (
            <Link href="/company/creators" className="font-medium underline-offset-4 hover:text-foreground hover:underline">
              View creators
            </Link>
          ) : (
            "Once your app is listed"
          ),
        },
        { label: "Paying customers" },
        { label: "Commission this month" },
      ]}
    />
  );
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

/** Everything that depends on the app: status, checklist, preview and the creators count. */
async function Overview({ organization }: { organization: OrganizationPromise }) {
  const { id, name } = await organization;
  const app = await getCompanyWorkspaceApp(id, name);

  if (!app) {
    return (
      <>
        <AddAppCard />
        <Metrics appId={null} />
      </>
    );
  }

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
      <Metrics appId={app.id} />
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <StatusTimelineSkeleton />
      <OverviewGrid checklist={<SetupChecklistSkeleton />} preview={<OfferPreviewSkeleton />} />
      <MetricsRow
        metrics={[
          { label: "Creators joined", value: <Skeleton className="inline-block h-[1em] w-8 align-top" />, caption: " " },
          { label: "Paying customers" },
          { label: "Commission this month" },
        ]}
      />
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
