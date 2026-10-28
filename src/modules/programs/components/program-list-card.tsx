import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CreatorProgramSummary } from "../queries";
import { CopyValueButton } from "./copy-value-button";
import { ProgramCover } from "./program-cover";

const CARD = "flex min-w-0 flex-col overflow-hidden rounded-[20px] border bg-card";
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const dayFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const fullDateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/** "May 4" this year, "May 4, 2025" before. */
function joinedLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  return (date.getUTCFullYear() === now.getUTCFullYear() ? dayFormat : fullDateFormat).format(date);
}

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : `${word}s`}`;

export type ProgramListStats = {
  /** Paying customers through this program. */
  customers: React.ReactNode;
  /** Commission from this program this month. */
  thisMonth: React.ReactNode;
  clicks: React.ReactNode;
};

/** One number in a card's mini results; "—" (muted) when there's nothing to show or the query failed. */
export function MiniStatValue({ value, muted = false }: { value: string; muted?: boolean }) {
  return (
    <span className={cn("tabular block truncate text-[17px] leading-6 font-extrabold", muted && "text-muted-foreground")}>
      {value}
    </span>
  );
}

export function MiniStatSkeleton() {
  return (
    <span className="flex h-6 items-center">
      <Skeleton className="h-4 w-10" />
    </span>
  );
}

function MiniStats({ stats }: { stats: ProgramListStats }) {
  const cells = [
    { label: "Customers", value: stats.customers },
    { label: "This month", value: stats.thisMonth },
    { label: "Clicks", value: stats.clicks },
  ];
  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[14px] border bg-border">
      {cells.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5 bg-background px-3 py-2.5">
          <dt className="truncate text-[11px] leading-4 text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A joined program on the Programs list: cover, terms, this program's results
 * (streamed in by the page), the referral code and the primary link.
 */
export function ProgramListCard({
  program,
  stats,
  now,
}: {
  program: CreatorProgramSummary;
  stats: ProgramListStats;
  now: Date;
}) {
  const isNew = now.getTime() - new Date(program.joinedAt).getTime() < NEW_FOR_MS;
  const link = program.defaultLink?.shareUrl;
  return (
    <article className={CARD}>
      <ProgramCover program={program}>
        {isNew ? (
          <Badge variant="secondary" className="absolute top-3.5 left-3.5">
            New
          </Badge>
        ) : null}
      </ProgramCover>
      <div className="flex flex-1 flex-col gap-3.5 px-4 pt-8 pb-4 sm:px-[18px] sm:pb-[18px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="truncate text-[17px] leading-6">
              <Link
                href={`/creator/programs/${program.slug}`}
                className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {program.appName}
              </Link>
            </h3>
            <span className="truncate text-[13px] leading-5 text-muted-foreground">{program.organizationName}</span>
          </div>
          <span className="inline-flex h-6.5 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap">
            {formatCommissionRange(program.minCommissionBps, program.maxCommissionBps)}
          </span>
        </div>

        <MiniStats stats={stats} />

        <div className="flex h-11 min-w-0 items-center gap-2 rounded-xl border bg-background pr-1.5 pl-3">
          <span className="text-[11px] text-muted-foreground">Code</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{program.referralCode}</span>
          <CopyValueButton
            value={program.referralCode}
            label="Copy"
            variant="secondary"
            ariaLabel={`Copy ${program.appName} code`}
            toastMessage="Referral code copied."
            className="rounded-lg"
          />
        </div>

        <span className="text-xs text-muted-foreground">
          Joined {joinedLabel(program.joinedAt, now)} · {plural(program.links.length, "link")} ·{" "}
          {program.attributionWindowDays}-day window
        </span>

        <div className="mt-auto flex gap-2">
          <Button asChild variant="outline" className="h-10 flex-1">
            <Link href={`/creator/programs/${program.slug}`}>Open program</Link>
          </Button>
          {link ? (
            <CopyValueButton
              value={link}
              label="Copy link"
              copiedLabel="Copied"
              variant="secondary"
              size="default"
              ariaLabel={`Copy ${program.appName} link`}
              toastMessage="Referral link copied."
              className="h-10 rounded-full"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProgramListCardSkeleton() {
  return (
    <div aria-hidden className={CARD}>
      <Skeleton className="h-[110px] shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-3.5 px-4 pt-8 pb-4 sm:px-[18px] sm:pb-[18px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="flex h-6 items-center">
              <Skeleton className="h-4 w-28" />
            </span>
            <span className="flex h-5 items-center">
              <Skeleton className="h-3 w-20" />
            </span>
          </div>
          <Skeleton className="h-6.5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-[66px] rounded-[14px]" />
        <Skeleton className="h-11 rounded-xl" />
        <span className="flex h-4 items-center">
          <Skeleton className="h-3 w-48 max-w-full" />
        </span>
        <div className="mt-auto flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
