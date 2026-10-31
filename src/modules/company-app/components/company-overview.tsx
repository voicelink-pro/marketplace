import { ArrowRight, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppCard, AppLogo } from "@/modules/catalog/components/app-card";
import { cardPlanInfo } from "@/modules/catalog/discover";
import type { CatalogAppCard } from "@/modules/catalog/queries";
import type { CompanyWorkspaceApp } from "../queries";
import type { Checklist } from "./app-readiness";
import { checklistItemHref, checklistItemLabel, checklistItemNext } from "./checklist-items";

/** Shared surface of the overview: chunky radius, hairline border. */
const PANEL_CARD = "rounded-[20px] border bg-card";

/** 52px yellow pill with the arrow, full width on phones. */
const PRIMARY_CTA = "h-13 gap-2 self-start px-7 text-base font-semibold max-sm:w-full max-sm:self-stretch";

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-lg font-bold tracking-[-0.02em]">
      {children}
    </h2>
  );
}

const STEPS = [
  { label: "Draft", caption: "Complete your app profile" },
  { label: "Submitted", caption: "Our team reviews it" },
  { label: "Approved", caption: "Listed in the catalog (demo)" },
  // Live publication needs a verified integration and funding, which don't exist yet.
  { label: "Live", caption: "Needs integration and funding" },
];

/** Where the working revision is: a rejected one is back in Draft, published is Approved (demo) or Live. */
function currentStep(app: CompanyWorkspaceApp): number {
  if (app.status === "submitted") return 1;
  if (app.status === "published") return app.publishEnvironment === "live" ? 3 : 2;
  return 0;
}

/** Draft -> Submitted -> Approved -> Live, with the current step in yellow. */
export function StatusTimeline({ app }: { app: CompanyWorkspaceApp }) {
  const current = currentStep(app);
  const captionFor = (index: number) =>
    index === 0 && app.status === "rejected" ? "Changes requested" : STEPS[index].caption;

  return (
    <section aria-labelledby="status-heading" className={cn(PANEL_CARD, "flex flex-col gap-5 p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo app={app} className="size-10 text-base" />
          <div className="flex min-w-0 flex-col">
            <h2 id="status-heading" className="truncate text-lg font-bold tracking-[-0.02em]">
              {app.name}
            </h2>
            <p className="text-sm text-muted-foreground">Publication status</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {app.hasLivePublishedRelease ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/apps/${app.slug}`}>
                View in marketplace
                <ExternalLink data-icon="inline-end" aria-hidden />
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href="/company/app">Edit app</Link>
          </Button>
        </div>
      </div>

      <ol aria-label="Publication steps" className="grid grid-cols-4">
        {STEPS.map((step, index) => {
          const state = index < current ? "done" : index === current ? "current" : "upcoming";
          return (
            <li key={step.label} aria-current={state === "current" ? "step" : undefined} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-center">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full",
                    state === "done" && "bg-foreground text-background",
                    state === "current" && "bg-primary ring-4 ring-primary/25",
                    state === "upcoming" && "border-2 border-foreground/20",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  {state === "current" ? <span className="size-2 rounded-full bg-primary-foreground" /> : null}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn("mx-2 h-0.5 flex-1 rounded-full", index < current ? "bg-foreground/60" : "bg-border")}
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "w-fit text-xs sm:text-sm",
                  // Marker style: black text on a yellow highlight, never yellow text.
                  state === "current" && "rounded-md bg-primary px-1.5 font-bold text-primary-foreground sm:px-2",
                  state === "done" && "font-semibold",
                  state === "upcoming" && "font-medium text-muted-foreground",
                )}
              >
                {step.label}
                {state === "done" ? <span className="sr-only"> (done)</span> : null}
              </span>
              <span className="hidden text-xs text-pretty text-muted-foreground sm:block">{captionFor(index)}</span>
            </li>
          );
        })}
      </ol>
      {/* Phones have no room for four captions: only the current one, under the steps. */}
      <p className="-mt-2 text-sm text-muted-foreground sm:hidden">{captionFor(current)}</p>
    </section>
  );
}

/**
 * Progress, every item linked to the place it's fixed, and one primary
 * button for the first open item (or for submitting once all are done).
 */
export function SetupChecklist({ checklist, app }: { checklist: Checklist; app: CompanyWorkspaceApp }) {
  const total = checklist.items.length;
  const done = checklist.items.filter((item) => item.complete).length;
  const firstOpen = checklist.items.find((item) => !item.complete);
  const canSubmit = app.status === "draft" || app.status === "rejected";

  let next: React.ReactNode;
  if (firstOpen) {
    next = (
      <Button asChild className={PRIMARY_CTA}>
        <Link href={checklistItemHref(firstOpen.id, "/company/app")}>
          {checklistItemNext(firstOpen.id)}
          <ArrowRight aria-hidden className="size-4.5" />
        </Link>
      </Button>
    );
  } else if (canSubmit) {
    next = (
      <Button asChild className={PRIMARY_CTA}>
        {/* Submitting happens in the editor's action bar. */}
        <Link href="/company/app">
          Next: submit for review
          <ArrowRight aria-hidden className="size-4.5" />
        </Link>
      </Button>
    );
  } else {
    next = (
      <p className="text-sm text-muted-foreground">
        {app.status === "submitted"
          ? "Submitted for review. Nothing else to do for now."
          : "Everything is set. Changes you make go through review again."}
      </p>
    );
  }

  return (
    <section aria-labelledby="setup-heading" className={cn(PANEL_CARD, "flex flex-col gap-5 p-5 sm:p-6")}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading id="setup-heading">Setup checklist</SectionHeading>
          <span className="tabular text-sm font-semibold">
            {done} of {total} done
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Setup checklist"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>

      {/* One column: in a half-width column the longest label wraps or not depending on width and weight. */}
      <ul className="grid grid-cols-1 gap-2">
        {checklist.items.map((item) => (
          <li key={item.id} className="flex">
            <Link
              href={checklistItemHref(item.id, "/company/app")}
              className="flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors duration-200 ease-out hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.complete ? (
                <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <span aria-hidden className="size-5 shrink-0 rounded-full border-2 border-foreground/20" />
              )}
              <span className={cn("min-w-0 flex-1", item.complete ? "text-muted-foreground" : "font-semibold")}>
                {checklistItemLabel(item.id, item.label)}
                <span className="sr-only">{item.complete ? " (done)" : " (to do)"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {next}
    </section>
  );
}

/**
 * The catalog card as creators will see it, built from the saved draft. The
 * card's own fallbacks cover missing visuals (logo letter, no cover) and a
 * missing plan ("—", "commission not set"). The card opens the full preview.
 */
export function OfferPreview({ app }: { app: CompanyWorkspaceApp }) {
  const activePlans = app.plans.filter((plan) => plan.isActive);
  const rates = activePlans.map((plan) => plan.commissionBps);
  const card: CatalogAppCard = {
    appId: app.id,
    slug: app.slug,
    name: app.name,
    organizationName: app.organizationName,
    tagline: app.tagline,
    categories: app.categories,
    platforms: app.platforms,
    languages: app.languages,
    logoUrl: app.logoUrl,
    coverImageUrl: app.coverImageUrl,
    minCommissionBps: rates.length > 0 ? Math.min(...rates) : 0,
    maxCommissionBps: rates.length > 0 ? Math.max(...rates) : 0,
    publishedAt: app.publishedAt ?? app.createdAt,
  };
  const planInfo =
    activePlans.length > 0
      ? cardPlanInfo(
          activePlans.map((plan) => ({
            id: plan.id,
            planName: plan.name,
            billingInterval: plan.billingInterval,
            priceMinor: plan.priceMinor,
            currency: plan.currency,
            commissionBps: plan.commissionBps,
            sortOrder: plan.sortOrder,
          })),
        )
      : undefined;

  return (
    <section aria-labelledby="preview-heading" className="flex flex-col gap-3">
      <SectionHeading id="preview-heading">This is how creators see your program</SectionHeading>
      <AppCard app={card} href="/company/app/preview" planInfo={planInfo} />
    </section>
  );
}

/** Before the company has an app: one card, one action. */
export function AddAppCard() {
  return (
    <section aria-labelledby="add-app-heading" className={cn(PANEL_CARD, "flex flex-col items-start gap-4 p-5 sm:p-6")}>
      <div className="flex flex-col gap-1.5">
        <SectionHeading id="add-app-heading">Add your app</SectionHeading>
        <p className="max-w-xl text-sm text-pretty text-muted-foreground">
          Start with your app’s name. You’ll add its profile, visuals, plans and commission terms next.
        </p>
      </div>
      <Button asChild className={PRIMARY_CTA}>
        <Link href="/company/app">
          Add your app
          <ArrowRight aria-hidden className="size-4.5" />
        </Link>
      </Button>
    </section>
  );
}

/** Status card while the app loads: header row, four steps with captions. */
export function StatusTimelineSkeleton() {
  return (
    <div aria-busy className={cn(PANEL_CARD, "flex flex-col gap-5 p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-[10px]" />
          <div className="flex flex-col">
            <Skeleton className="my-1 h-5 w-32" />
            <Skeleton className="my-0.5 h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-8 w-[74px] rounded-full" />
      </div>
      <div className="grid grid-cols-4">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex flex-col gap-2">
            <div className="flex items-center">
              <Skeleton className="size-6 shrink-0 rounded-full" />
              {index < STEPS.length - 1 ? <Skeleton className="mx-2 h-0.5 flex-1" /> : null}
            </div>
            <Skeleton className="my-0.5 h-3 w-14 sm:h-4" />
            <Skeleton className="my-0.5 hidden h-3 w-24 sm:block" />
          </div>
        ))}
      </div>
      {/* The real caption line is 20px pulled up 8px: a 16px bar, 6px up and 2px below. */}
      <Skeleton className="-mt-1.5 mb-0.5 h-4 w-44 sm:hidden" />
    </div>
  );
}

/** Checklist while the app loads: heading, bar, six item rows, the button. */
export function SetupChecklistSkeleton() {
  return (
    <div aria-busy className={cn(PANEL_CARD, "flex flex-col gap-5 p-5 sm:p-6")}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="my-1 h-5 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[42px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-13 w-full rounded-full sm:w-72" />
    </div>
  );
}

/** Offer preview while the app loads: its heading and a catalog-card-sized block. */
export function OfferPreviewSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <SectionHeading id="preview-heading-loading">This is how creators see your program</SectionHeading>
      <div className="flex flex-col overflow-hidden rounded-[20px] border bg-card">
        <Skeleton className="aspect-[16/9] w-full rounded-none" />
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-[10px]" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
          <Skeleton className="h-[26px] w-32" />
          <div className="flex items-center justify-between gap-3 pt-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
