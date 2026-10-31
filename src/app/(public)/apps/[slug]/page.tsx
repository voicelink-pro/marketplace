import { ArrowLeft, ExternalLink, Film, Globe, Images } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyModule } from "@/components/states/empty-module";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkPendingSpinner } from "@/components/ui/link-pending-icon";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PromoteCtaCard } from "@/modules/catalog/components/promote-cta-card";
import { PerCustomerAmount, PerCustomerNote, PlanRateCards } from "@/modules/catalog/components/plan-rates";
import { StickyJoinBar } from "@/modules/catalog/components/sticky-join-bar";
import {
  APP_CATEGORY_LABELS,
  APP_PLATFORM_LABELS,
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_SUFFIX,
  formatLanguageLabel,
} from "@/modules/catalog/constants";
import {
  type RawSearchParams,
  resolveBackToCatalogHref,
} from "@/modules/catalog/filters";
import { getPublishedAppBySlug } from "@/modules/catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/apps/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const app = await getPublishedAppBySlug(slug);
  if (!app) {
    return { title: "App not found" };
  }
  const commission = formatCommissionRange(app.minCommissionBps, app.maxCommissionBps);
  return {
    title: `${app.name} (${commission})`,
    description: app.tagline,
  };
}

function AppDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function AppDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const app = await getPublishedAppBySlug(slug);
  if (!app) notFound();

  const backHref = resolveBackToCatalogHref(rawSearch.from);
  const hasSavedFilters = backHref !== "/";
  const paragraphs = app.description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-8 pb-20 lg:pb-0">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2.5 text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft data-icon="inline-start" />
            {hasSavedFilters ? "Back to filtered results" : "All apps"}
            <LinkPendingSpinner />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          {/* App Identity Header */}
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
                <span
                  aria-hidden
                  className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground"
                >
                  {app.name.slice(0, 1).toUpperCase()}
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{app.organizationName}</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{app.name}</h1>
                <p className="text-base text-muted-foreground">{app.tagline}</p>
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

          {/* Main Cover Visual */}
          {app.coverImageUrl ? (
            <div className="overflow-hidden rounded-xl border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.coverImageUrl}
                alt={`${app.name} overview`}
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>
          ) : null}

          {/* Mobile CTA placement so mobile visitors don't have to scroll past everything */}
          <div id="join-offer" className="scroll-mt-20 lg:hidden">
            <PromoteCtaCard app={app} />
          </div>
          <StickyJoinBar
            targetId="join-offer"
            commissionLabel={formatCommissionRange(app.minCommissionBps, app.maxCommissionBps)}
          />

          {/* Subscription Plans & Commission Rates Table */}
          <section id="plans" aria-labelledby="plans-heading" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="plans-heading" className="text-xl font-semibold tracking-tight">
                Subscription plans & commission rates
              </h2>
              <p className="text-sm text-muted-foreground">
                Exact commission percentage for each subscription plan offered by {app.name}.
              </p>
            </div>

            <PlanRateCards plans={app.plans} className="sm:hidden" />
            <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="hidden sm:table-cell">Billing cycle</TableHead>
                    <TableHead className="text-right">
                      <span className="sm:hidden">Price</span>
                      <span className="hidden sm:inline">Subscription price</span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="sm:hidden">Commission</span>
                      <span className="hidden sm:inline">Creator commission</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {app.plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.planName}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
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
                          {formatCommissionPercent(plan.commissionBps)}
                          <span className="hidden sm:inline">&nbsp;recurring</span>
                        </span>
                        <PerCustomerAmount plan={plan} className="mt-1 block" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PerCustomerNote />
          </section>

          {/* Full Product Description */}
          <section id="about" aria-labelledby="about-heading" className="flex flex-col gap-3">
            <h2 id="about-heading" className="text-xl font-semibold tracking-tight">
              About {app.name}
            </h2>
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6 text-sm leading-relaxed text-foreground sm:text-base">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Screenshots Gallery */}
          <section
            id="screenshots"
            aria-labelledby="screenshots-heading"
            className="flex flex-col gap-3"
          >
            <h2 id="screenshots-heading" className="text-xl font-semibold tracking-tight">
              Screenshots
            </h2>
            {app.screenshots.length === 0 ? (
              <EmptyModule
                icon={Images}
                title="No screenshots attached"
                description="The company hasn’t added additional product screenshots for this listing."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {app.screenshots.map((shot, index) => (
                  <figure
                    key={`${shot.url}-${index}`}
                    className="flex flex-col overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden border-b bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shot.url}
                        alt={shot.alt}
                        loading="lazy"
                        className="aspect-[16/10] size-full object-cover object-top"
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

          {/* Product Video */}
          <section id="video" aria-labelledby="video-heading" className="flex flex-col gap-3">
            <h2 id="video-heading" className="text-xl font-semibold tracking-tight">
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
                <CardHeader className="flex-row items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="text-sm font-medium">{app.name} walkthrough</CardTitle>
                    <CardDescription className="text-xs">
                      Product demonstration provided by {app.organizationName}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={app.videoUrl} target="_blank" rel="noopener noreferrer">
                      Open video
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                </CardHeader>
              </Card>
            ) : (
              <EmptyModule
                icon={Film}
                title="No product video attached"
                description="This listing uses screenshots and product links instead of a video walkthrough."
              />
            )}
          </section>

          {/* Program Terms */}
          <section
            id="program-terms"
            aria-labelledby="terms-heading"
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="terms-heading" className="text-xl font-semibold tracking-tight">
                Program terms & attribution rules
              </h2>
              <Badge variant="secondary" className="tabular">
                Terms v{app.termsVersionNumber}
              </Badge>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-4 pt-6 text-sm leading-relaxed">
                <p>{app.termsText}</p>
                <dl className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">Attribution window</dt>
                    <dd className="tabular font-medium">
                      {app.attributionWindowDays} days from link click to sign-up
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">Commission duration</dt>
                    <dd className="font-medium">
                      Recurring for as long as the referred customer keeps paying
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">Rate history protection</dt>
                    <dd className="font-medium">
                      Already-referred customers keep their rate snapshot if plans change later
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted-foreground">Earnings availability</dt>
                    <dd className="font-medium">
                      Available after each calendar month closes, once funded by the company
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sticky Desktop CTA */}
        <aside aria-label="Join this program" className="hidden lg:col-span-4 lg:block lg:sticky lg:top-24">
          <PromoteCtaCard app={app} />
        </aside>
      </div>
    </div>
  );
}

export default function AppDetailPage({
  params,
  searchParams,
}: PageProps<"/apps/[slug]">) {
  return (
    <Suspense fallback={<AppDetailSkeleton />}>
      <AppDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
