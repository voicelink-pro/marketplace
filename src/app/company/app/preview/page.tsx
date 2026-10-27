import { ArrowLeft, ExternalLink, Film, Globe, Images } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyModule } from "@/components/states/empty-module";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCommissionPercent,
  formatCommissionRange,
  formatMinorCurrency,
} from "@/lib/money";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";
import {
  APP_CATEGORY_LABELS,
  APP_PLATFORM_LABELS,
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_SUFFIX,
  formatLanguageLabel,
} from "@/modules/catalog/constants";
import { getCompanyWorkspaceApp } from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "Draft preview" };

export default async function CompanyAppPreviewPage() {
  const viewer = await requireViewer("/company/app/preview");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");

  const app = await getCompanyWorkspaceApp(organization.id, organization.name);
  if (!app) redirect("/company/app");

  const activePlans = app.plans.filter((p) => p.isActive);
  const minBps =
    activePlans.length > 0 ? Math.min(...activePlans.map((p) => p.commissionBps)) : null;
  const maxBps =
    activePlans.length > 0 ? Math.max(...activePlans.map((p) => p.commissionBps)) : null;

  const paragraphs = app.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2.5 text-muted-foreground">
          <Link href="/company/app">
            <ArrowLeft data-icon="inline-start" />
            Back to editor
          </Link>
        </Button>

        <Button variant="outline" size="sm" asChild>
          <Link href="/company/plans">Manage plans & rates</Link>
        </Button>
      </div>

      <Alert>
        <AlertTitle>Private draft preview — visible only to {organization.name}</AlertTitle>
        <AlertDescription>
          This preview shows how `/apps/{app.slug}` will look once your current working draft and subscription plans are approved by an administrator.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <header className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {app.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.logoUrl}
                  alt={`${app.name} logo`}
                  className="size-16 shrink-0 rounded-2xl border bg-background object-contain"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
                  {app.name.slice(0, 1).toUpperCase()}
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{organization.name}</span>
                  <Badge variant="secondary">Draft preview</Badge>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{app.name}</h1>
                <p className="text-base text-muted-foreground">
                  {app.tagline || "No short tagline set yet."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t pt-4 text-xs">
              {app.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {APP_CATEGORY_LABELS[category]}
                </Badge>
              ))}
              {app.platforms.map((platform) => (
                <Badge key={platform} variant="outline">
                  {APP_PLATFORM_LABELS[platform]}
                </Badge>
              ))}
              {app.languages.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 pl-1 text-muted-foreground">
                  <Globe aria-hidden className="size-3.5" />
                  <span>{app.languages.map(formatLanguageLabel).join(", ")}</span>
                </span>
              ) : null}
            </div>

            {app.websiteUrl || app.iosStoreUrl || app.androidStoreUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                {app.websiteUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.websiteUrl} target="_blank" rel="noopener noreferrer">
                      Product website
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                ) : null}
                {app.iosStoreUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.iosStoreUrl} target="_blank" rel="noopener noreferrer">
                      App Store
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                ) : null}
                {app.androidStoreUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.androidStoreUrl} target="_blank" rel="noopener noreferrer">
                      Google Play
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </header>

          {app.coverImageUrl ? (
            <div className="overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.coverImageUrl}
                alt={`${app.name} overview`}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          ) : null}

          <section aria-labelledby="preview-plans-heading" className="flex flex-col gap-3">
            <h2 id="preview-plans-heading" className="text-xl font-semibold tracking-tight">
              Subscription plans & commission rates
            </h2>
            {activePlans.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No subscription plans added yet. Add plans in{" "}
                  <Link href="/company/plans" className="font-medium text-foreground underline">
                    Plans & commissions
                  </Link>
                  .
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing cycle</TableHead>
                      <TableHead className="text-right">Subscription price</TableHead>
                      <TableHead className="text-right">Creator commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {BILLING_INTERVAL_LABELS[plan.billingInterval]}
                        </TableCell>
                        <TableCell className="tabular text-right">
                          {formatMinorCurrency(plan.priceMinor, plan.currency)}{" "}
                          <span className="text-xs text-muted-foreground">
                            {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="tabular inline-flex rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                            {formatCommissionPercent(plan.commissionBps)} recurring
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section aria-labelledby="preview-about-heading" className="flex flex-col gap-3">
            <h2 id="preview-about-heading" className="text-xl font-semibold tracking-tight">
              About {app.name}
            </h2>
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6 text-sm leading-relaxed">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
                ) : (
                  <p className="text-muted-foreground">No full description written yet.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="preview-screenshots-heading" className="flex flex-col gap-3">
            <h2 id="preview-screenshots-heading" className="text-xl font-semibold tracking-tight">
              Screenshots
            </h2>
            {app.screenshots.length === 0 ? (
              <EmptyModule
                icon={Images}
                title="No screenshots attached"
                description="Add screenshot URLs in the editor to display them here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {app.screenshots.map((shot, idx) => (
                  <figure
                    key={`${shot.url}-${idx}`}
                    className="flex flex-col overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden border-b bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.url}
                        alt={shot.alt}
                        className="aspect-[16/10] size-full object-cover"
                      />
                    </div>
                    <figcaption className="px-4 py-2.5 text-xs text-muted-foreground">
                      {shot.alt}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="preview-video-heading" className="flex flex-col gap-3">
            <h2 id="preview-video-heading" className="text-xl font-semibold tracking-tight">
              Product video
            </h2>
            {app.videoUrl ? (
              <Card className="overflow-hidden">
                <div className="aspect-video w-full border-b bg-muted">
                  <video
                    controls
                    preload="metadata"
                    poster={app.coverImageUrl ?? undefined}
                    src={app.videoUrl}
                    className="aspect-video size-full object-cover"
                  >
                    <track kind="captions" />
                  </video>
                </div>
              </Card>
            ) : (
              <EmptyModule
                icon={Film}
                title="No product video attached"
                description="Optional: add a video URL in the editor."
              />
            )}
          </section>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <Card className="border-primary/25">
            <CardHeader className="gap-2">
              <div className="text-xs font-medium text-muted-foreground">Creator commission</div>
              <CardTitle className="tabular text-2xl font-semibold text-foreground">
                {minBps !== null && maxBps !== null
                  ? formatCommissionRange(minBps, maxBps)
                  : "Add a plan to preview rate"}
              </CardTitle>
              <CardDescription>
                {app.attributionWindowDays}-day attribution window · Recurring for as long as the referred customer keeps paying.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {app.termsText || "Program terms will appear here once added."}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
