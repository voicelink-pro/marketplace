import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  primaryOrganization,
  requireViewer,
  type Viewer,
  type ViewerOrganization,
} from "@/modules/accounts/viewer";
import { AttributionPanel } from "@/modules/attribution/components/attribution-panel";
import { CommissionPanel } from "@/modules/commissions/components/commission-panel";
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

/** Its own query after the app's: streams into the results heading without holding the rest back. */
async function CreatorsJoined({ appId }: { appId: string }) {
  const count = (await listCompanyCreators(appId)).length;
  return (
    <Link href="/company/creators" className="text-sm font-medium underline-offset-4 hover:underline">
      <span className="tabular">{count}</span> {count === 1 ? "creator joined" : "creators joined"}
    </Link>
  );
}

/** Clicks, registrations, payments and commission from the tracking backend; the panels load their own data. */
function Results({ appId }: { appId: string | null }) {
  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-3">
      <div className="flex min-h-5 flex-wrap items-center justify-between gap-2">
        <h2 id="results-heading" className="text-lg font-bold tracking-[-0.02em]">
          Referral & subscription results
        </h2>
        {appId ? (
          <Suspense fallback={<Skeleton className="h-4 w-28" />}>
            <CreatorsJoined appId={appId} />
          </Suspense>
        ) : null}
      </div>
      {appId ? (
        <Suspense fallback={<Skeleton aria-busy className="h-72 w-full rounded-[20px]" />}>
          <AttributionPanel company appId={appId} />
          <CommissionPanel company appId={appId} summary />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">Create an app to see referral results.</p>
      )}
    </section>
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
        <Results appId={null} />
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
      <Results appId={app.id} />
    </>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <StatusTimelineSkeleton />
      <OverviewGrid checklist={<SetupChecklistSkeleton />} preview={<OfferPreviewSkeleton />} />
      <section aria-labelledby="results-heading-loading" aria-busy className="flex flex-col gap-3">
        <h2 id="results-heading-loading" className="text-lg font-bold tracking-[-0.02em]">
          Referral & subscription results
        </h2>
        <Skeleton className="h-72 w-full rounded-[20px]" />
      </section>
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
