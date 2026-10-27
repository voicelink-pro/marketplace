import { CommissionPanel } from '@/modules/commissions/components/commission-panel';
import { AttributionPanel } from '@/modules/attribution/components/attribution-panel';
import { ArrowRight, Layers, Sparkles, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { requireViewer } from "@/modules/accounts/viewer";
import { APP_CATEGORY_LABELS, APP_PLATFORM_LABELS } from "@/modules/catalog/constants";
import { CopyableField } from "@/modules/programs/components/copy-value-button";
import {
  listCreatorProgramMemberships,
  listSimilarAppsForCreator,
} from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Overview" };

export default async function CreatorOverviewPage() {
  const viewer = await requireViewer("/creator");
  const ready = (viewer.creator?.socialLinkCount ?? 0) > 0;
  const [programs, similarApps] = await Promise.all([
    listCreatorProgramMemberships(viewer.userId),
    listSimilarAppsForCreator(viewer.userId, 3),
  ]);

  return (
    <>
      <PageHeader
        title={`Hi, ${viewer.displayName}`}
        description="Your earnings, results and programs in one place."
        actions={
          <Button asChild size="lg">
            <Link href="/">Browse apps</Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-8">
        {!ready ? (
          <Alert>
            <TriangleAlert />
            <AlertTitle>Add a social profile to start promoting</AlertTitle>
            <AlertDescription>
              Companies need to see where you post before you can join a program.
            </AlertDescription>
            <AlertAction>
              <Button asChild size="sm" variant="outline">
                <Link href="/creator/settings">Add profile</Link>
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        <section aria-labelledby="earnings-heading" className="flex flex-col gap-3">
          <h2 id="earnings-heading" className="text-lg font-semibold">
            Earnings and results
          </h2>
          <AttributionPanel /><CommissionPanel summary />
        </section>

        <section aria-labelledby="programs-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="programs-heading" className="text-lg font-semibold">
              Your programs
            </h2>
            {programs.length > 0 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/creator/programs">
                  View all ({programs.length})
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : null}
          </div>

          {programs.length === 0 ? (
            <EmptyModule
              icon={Layers}
              title="You haven’t joined a program yet"
              description="Join an app’s program in the marketplace to get your referral link and code immediately."
            >
              <Button asChild variant="outline">
                <Link href="/">Find an app</Link>
              </Button>
            </EmptyModule>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {programs.slice(0, 4).map((program) => (
                <Card key={program.membershipId} className="flex flex-col justify-between">
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {program.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={program.logoUrl}
                            alt=""
                            className="size-10 shrink-0 rounded-lg border bg-background object-contain"
                          />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                            {program.appName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{program.appName}</CardTitle>
                          <CardDescription className="truncate text-xs">
                            {program.organizationName}
                          </CardDescription>
                        </div>
                      </div>
                      <CardAction>
                        <span className="tabular rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {formatCommissionRange(
                            program.minCommissionBps,
                            program.maxCommissionBps,
                          )}
                        </span>
                      </CardAction>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4">
                    <CopyableField
                      label="Referral code"
                      value={program.referralCode}
                      copyLabel="Copy code"
                      toastMessage="Referral code copied."
                    />

                    {program.defaultLink ? (
                      <CopyableField
                        label={`Referral link (${program.defaultLink.label})`}
                        value={program.defaultLink.shareUrl}
                        copyLabel="Copy link"
                        toastMessage="Referral link copied."
                      />
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                      <span className="tabular text-xs text-muted-foreground">
                        {program.links.length}{" "}
                        {program.links.length === 1 ? "named link" : "named links"}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/creator/programs/${program.slug}`}>
                          Program & links
                          <ArrowRight data-icon="inline-end" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="suggestions-heading" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="suggestions-heading" className="text-lg font-semibold">
              Similar apps to promote
            </h2>
            <p className="text-xs text-muted-foreground">
              Matched from the categories of your active programs.
            </p>
          </div>

          {programs.length === 0 ? (
            <EmptyModule
              icon={Sparkles}
              title="No suggestions yet"
              description="After you join your first program, we suggest other published apps from the same categories."
            />
          ) : similarApps.length === 0 ? (
            <EmptyModule
              icon={Sparkles}
              title="No more apps in your active categories"
              description="You’ve already joined every published app in the categories you promote. Browse the catalog to explore other categories."
            >
              <Button asChild variant="outline">
                <Link href="/">Browse all categories</Link>
              </Button>
            </EmptyModule>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {similarApps.map((app) => (
                <Card key={app.appId} className="flex flex-col justify-between">
                  <CardHeader className="gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {app.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.logoUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-lg border bg-background object-contain"
                          />
                        ) : (
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                            {app.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{app.name}</CardTitle>
                          <CardDescription className="truncate text-xs">
                            {app.organizationName}
                          </CardDescription>
                        </div>
                      </div>
                      <span className="tabular shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {formatCommissionRange(app.minCommissionBps, app.maxCommissionBps)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{app.tagline}</p>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {app.sharedCategories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-[11px]">
                          {APP_CATEGORY_LABELS[category]}
                        </Badge>
                      ))}
                      {app.platforms.map((platform) => (
                        <Badge key={platform} variant="outline" className="text-[11px]">
                          {APP_PLATFORM_LABELS[platform]}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/apps/${app.slug}`}>
                        View program
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
