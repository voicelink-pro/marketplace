import {
  ArrowRight,
  ChartNoAxesColumn,
  CircleAlert,
  Eye,
  ExternalLink,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCommissionRange } from "@/lib/money";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";
import {
  getCompanyWorkspaceApp,
  listCompanyCreators,
} from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "Company overview" };

export default async function CompanyOverviewPage() {
  const viewer = await requireViewer("/company");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");

  const app = await getCompanyWorkspaceApp(organization.id, organization.name);
  const creators = app ? await listCompanyCreators(app.id) : [];
  const activePlans = app ? app.plans.filter((p) => p.isActive) : [];
  const minBps =
    activePlans.length > 0 ? Math.min(...activePlans.map((p) => p.commissionBps)) : null;
  const maxBps =
    activePlans.length > 0 ? Math.max(...activePlans.map((p) => p.commissionBps)) : null;

  return (
    <>
      <PageHeader title={organization.name} description="Your app, its program and its results." />
      <div className="flex flex-col gap-6">
        {app?.status === "rejected" && app.rejectionReason ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Administrator requested changes on {app.name}</AlertTitle>
            <AlertDescription>{app.rejectionReason}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{app ? app.name : "Add your app"}</CardTitle>
              {app ? (
                <Badge
                  variant={
                    app.status === "published"
                      ? "default"
                      : app.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {app.status === "published"
                    ? "Published (Demo)"
                    : app.status === "submitted"
                      ? "Submitted for review"
                      : app.status === "rejected"
                        ? "Changes requested"
                        : "Draft"}
                </Badge>
              ) : null}
              {minBps !== null && maxBps !== null ? (
                <span className="tabular rounded-md bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  {formatCommissionRange(minBps, maxBps)}
                </span>
              ) : null}
            </div>
            <CardDescription>
              {app
                ? app.tagline || "Complete your app profile, subscription plans, and program terms to submit for review."
                : "Start with your app’s name. You’ll add its profile, visuals, and commission terms next."}
            </CardDescription>
            <CardAction className="flex flex-wrap items-center gap-2">
              {app ? (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/company/app/preview">
                      <Eye data-icon="inline-start" />
                      Preview
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/company/app">
                      Edit app
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/company/app">Add app</Link>
                </Button>
              )}
            </CardAction>
          </CardHeader>

          {app ? (
            <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/company/plans" className="hover:text-foreground hover:underline">
                  <span className="tabular font-medium text-foreground">{activePlans.length}</span>{" "}
                  {activePlans.length === 1 ? "subscription plan" : "subscription plans"}
                </Link>
                <Link href="/company/creators" className="hover:text-foreground hover:underline">
                  <span className="tabular font-medium text-foreground">{creators.length}</span>{" "}
                  {creators.length === 1 ? "creator joined" : "creators joined"}
                </Link>
              </div>
              {app.hasLivePublishedRelease ? (
                <Link
                  href={`/apps/${app.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary-ink hover:underline"
                >
                  <span>View in marketplace</span>
                  <ExternalLink aria-hidden className="size-3" />
                </Link>
              ) : null}
            </CardContent>
          ) : null}
        </Card>

        <section aria-labelledby="results-heading" className="flex flex-col gap-3">
          <h2 id="results-heading" className="text-lg font-semibold">
            Referral & subscription results
          </h2>
          <EmptyModule
            icon={ChartNoAxesColumn}
            title="No referred customer activity yet"
            description="Clicks, registered customers, paying subscribers, and commission statements appear here once your app reports referral events."
          />
        </section>
      </div>
    </>
  );
}
