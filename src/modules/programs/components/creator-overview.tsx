import { ArrowRight, Check, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { CardGlow } from "@/modules/catalog/components/card-glow";
import type { CreatorProgramSummary, SimilarAppSuggestion } from "../queries";
import { CopyableField } from "./copy-value-button";

/** Shared surface of the overview: chunky radius, hairline border. */
const PANEL_CARD = "rounded-[20px] border bg-card";

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-lg font-bold tracking-[-0.02em]">
      {children}
    </h2>
  );
}

/** Commission chip: the key number, yellow with near-black text. */
function CommissionChip({ minBps, maxBps }: { minBps: number; maxBps: number }) {
  return (
    <span className="tabular shrink-0 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
      {formatCommissionRange(minBps, maxBps)}
    </span>
  );
}

export type GetStartedStep = { title: string; description: string; href: string; done: boolean };

/** First steps, ticked from the creator's own data. Render it only while a step is open. */
export function GetStartedChecklist({ steps }: { steps: GetStartedStep[] }) {
  const doneCount = steps.filter((step) => step.done).length;
  return (
    <section aria-labelledby="get-started-heading" className={cn(PANEL_CARD, "flex flex-col gap-4 p-5 sm:p-6")}>
      <div className="flex items-center justify-between gap-3">
        <SectionHeading id="get-started-heading">Get started</SectionHeading>
        <span className="tabular text-sm font-medium text-muted-foreground">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) =>
          step.done ? (
            // Done: one compact, muted line. Not a link: there's nothing left to do here.
            // The 32px icon slot, side padding and (transparent) border match the open rows, so titles line up.
            <li key={step.title} className="flex items-center gap-3 border border-transparent px-3 py-1 sm:px-4">
              <span className="grid w-8 shrink-0 place-items-center">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">{step.title}</span>
              <span className="sr-only">(done)</span>
            </li>
          ) : (
            <li key={step.title}>
              <Link
                href={step.href}
                className="group flex items-center gap-3 rounded-xl border bg-background p-3 outline-none transition-colors duration-200 ease-out hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-4"
              >
                <span className="tabular grid size-8 shrink-0 place-items-center rounded-full border-2 border-foreground/15 text-sm font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{step.title}</span>
                  <span className="text-sm text-pretty text-muted-foreground">{step.description}</span>
                </span>
                <span className="sr-only">(to do)</span>
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:text-foreground motion-safe:group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function ProgramCard({ program }: { program: CreatorProgramSummary }) {
  const namedLinks = program.links.filter((link) => !link.isDefault).length;
  return (
    // The wrapper carries the glow; the card clips nothing so the glow can sit on its border.
    <li className="relative flex rounded-[20px]">
      <CardGlow />
      <article className={cn(PANEL_CARD, "flex w-full flex-col gap-4 p-5")}>
        <div className="flex items-center gap-3">
          <AppLogo app={{ name: program.appName, logoUrl: program.logoUrl }} className="size-11 text-base" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="truncate font-bold">{program.appName}</h3>
            <p className="truncate text-sm text-muted-foreground">{program.organizationName}</p>
          </div>
          <CommissionChip minBps={program.minCommissionBps} maxBps={program.maxCommissionBps} />
        </div>
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
            {namedLinks} {namedLinks === 1 ? "named link" : "named links"}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/creator/programs/${program.slug}`}>
              Program & links
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </article>
    </li>
  );
}

const PROGRAMS_SHOWN = 4;

export function ProgramsSection({ programs }: { programs: CreatorProgramSummary[] }) {
  return (
    <section aria-labelledby="programs-heading" className="flex flex-col gap-3">
      {/* min-h-8: the "View all" button's height, so the row is the same with or without it. */}
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <SectionHeading id="programs-heading">Your programs</SectionHeading>
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
          description="Join an app’s program to get your referral link and code right away."
        >
          <Button asChild variant="outline">
            <Link href="/">Discover apps</Link>
          </Button>
        </EmptyModule>
      ) : (
        <ul className="flex flex-col gap-4">
          {programs.slice(0, PROGRAMS_SHOWN).map((program) => (
            <ProgramCard key={program.membershipId} program={program} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One program card's skeleton, box for box (code and link fields, footer row). */
function ProgramCardSkeleton() {
  const field = (valueClassName: string) => (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className={cn("w-full rounded-lg sm:flex-1", valueClassName)} />
        <Skeleton className="h-8 w-full rounded-full sm:w-28" />
      </div>
    </div>
  );
  return (
    <div className={cn(PANEL_CARD, "flex flex-col gap-4 p-5")}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-[10px]" />
        <span className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32 max-w-full" />
          <Skeleton className="h-3.5 w-40 max-w-full" />
        </span>
        <Skeleton className="h-6 w-24 shrink-0 rounded-md" />
      </div>
      {field("h-10")}
      {/* The link wraps to two lines on phones (2 × 20px text + padding and border). */}
      {field("h-[58px] sm:h-10")}
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
    </div>
  );
}

/** "Your programs" while memberships load: the real heading and one card. */
export function ProgramsSkeleton() {
  return (
    <section aria-labelledby="programs-heading" aria-busy className="flex flex-col gap-3">
      <div className="flex min-h-8 items-center">
        <SectionHeading id="programs-heading">Your programs</SectionHeading>
      </div>
      <ProgramCardSkeleton />
    </section>
  );
}

/** How earnings work, as the brief defines them. */
export function HowYouGetPaid() {
  const lines: React.ReactNode[] = [
    "Commission on every renewal, for as long as your customers stay subscribed.",
    "Earnings unlock after the month closes.",
    <>
      You request payouts from the{" "}
      <Link href="/creator/payouts" className="font-medium text-foreground underline underline-offset-4 hover:text-primary-ink">
        Payouts page
      </Link>
      .
    </>,
  ];
  return (
    <section aria-labelledby="get-paid-heading" className={cn(PANEL_CARD, "flex flex-col gap-4 p-5")}>
      <SectionHeading id="get-paid-heading">How you get paid</SectionHeading>
      <ol className="flex flex-col gap-3">
        {lines.map((line, index) => (
          <li key={index} className="flex gap-3 text-sm">
            <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold">
              {index + 1}
            </span>
            <span className="pt-0.5 text-pretty">{line}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Up to three apps from the categories the creator already promotes. */
export function SimilarAppsList({ apps, hasPrograms }: { apps: SimilarAppSuggestion[]; hasPrograms: boolean }) {
  let body: React.ReactNode;
  if (!hasPrograms) {
    body = <p className="text-sm text-pretty text-muted-foreground">Join your first program to see apps like it.</p>;
  } else if (apps.length === 0) {
    body = (
      <p className="text-sm text-muted-foreground">
        You’ve joined every app in your categories.{" "}
        <Link href="/" className="font-medium text-foreground underline underline-offset-4 hover:text-primary-ink">
          Discover apps
        </Link>{" "}
        in others.
      </p>
    );
  } else {
    body = (
      <ul className="-mx-2 flex flex-col">
        {apps.map((app) => (
          <li key={app.appId}>
            <Link
              href={`/apps/${app.slug}`}
              className="flex items-center gap-3 rounded-xl p-2 outline-none transition-colors duration-200 ease-out hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <AppLogo app={app} className="size-9 text-sm" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{app.name}</span>
                <span className="truncate text-xs text-muted-foreground">{app.organizationName}</span>
              </span>
              <CommissionChip minBps={app.minCommissionBps} maxBps={app.maxCommissionBps} />
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return <SimilarAppsCard>{body}</SimilarAppsCard>;
}

/** Card and heading shared by the list and its skeleton, so only the rows swap in. */
function SimilarAppsCard({ children, busy = false }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <section
      aria-labelledby="similar-heading"
      aria-busy={busy || undefined}
      className={cn(PANEL_CARD, "flex flex-col gap-3 p-5")}
    >
      <div className="flex items-center justify-between gap-2">
        <SectionHeading id="similar-heading">Similar apps</SectionHeading>
        <Sparkles aria-hidden className="size-4 text-muted-foreground" />
      </div>
      {children}
    </section>
  );
}

/**
 * Three placeholder rows with the list rows' exact box (8px padding, 36px
 * logo, two text lines, chip): the usual full list replaces it without a
 * shift. A shorter result only shrinks this card, the last in its column.
 */
export function SimilarAppsSkeleton() {
  return (
    <SimilarAppsCard busy>
      <ul className="-mx-2 flex flex-col">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 p-2">
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
              <Skeleton className="h-3.5 w-24 max-w-full" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </span>
            <Skeleton className="h-6 w-20 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    </SimilarAppsCard>
  );
}
