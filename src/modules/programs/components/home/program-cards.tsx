import { Plus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange } from "@/lib/money";
import type { CreatorProgramSummary } from "../../queries";
import { CopyValueButton } from "../copy-value-button";
import { ProgramCover } from "../program-cover";
import { CardLink, Unavailable } from "./card";

const TITLE_ID = "programs-heading";
const CARD = "flex min-h-[236px] flex-col overflow-hidden rounded-[20px] border bg-card";

export type ProgramCardData = {
  program: CreatorProgramSummary;
  /** Paying customers through this program; null when the query failed. */
  paying: number | null;
  /** This month's commission from this program, when above zero. */
  thisMonth: string | null;
};

function Frame({ total, busy, children }: { total?: number; busy?: boolean; children: React.ReactNode }) {
  return (
    <section aria-labelledby={TITLE_ID} aria-busy={busy || undefined} className="flex min-w-0 flex-col gap-3 lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <h2 id={TITLE_ID} className="text-base">
          Your programs
        </h2>
        {total ? <CardLink href="/creator/programs">View all ({total})</CardLink> : null}
      </div>
      {children}
    </section>
  );
}

function customersLine(paying: number | null): string {
  if (paying === null) return "Customers unavailable";
  if (paying === 0) return "No customers yet";
  return `${paying} paying ${paying === 1 ? "customer" : "customers"}`;
}

function ProgramCard({ program, paying, thisMonth }: ProgramCardData) {
  const link = program.defaultLink?.shareUrl;
  return (
    <article className={CARD}>
      <ProgramCover program={program} />
      <div className="flex flex-1 flex-col gap-2.5 px-4 pt-7 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <h3 className="truncate text-[15px] leading-[1.375rem]">
              <Link href={`/creator/programs/${program.slug}`} className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                {program.appName}
              </Link>
            </h3>
            <span className="truncate text-[13px] leading-5 text-muted-foreground">{customersLine(paying)}</span>
          </div>
          {thisMonth ? <span className="tabular shrink-0 text-lg font-extrabold">{thisMonth}</span> : null}
        </div>
        <div className="mt-auto flex items-center gap-2">
          <span className="inline-flex h-6.5 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap">
            {formatCommissionRange(program.minCommissionBps, program.maxCommissionBps)}
          </span>
          <span className="flex-1" />
          {link ? (
            <CopyValueButton
              value={link}
              label="Copy link"
              copiedLabel="Copied"
              ariaLabel={`Copy ${program.appName} link`}
              toastMessage="Referral link copied."
              className="rounded-full"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AddAppCard({ first = false }: { first?: boolean }) {
  return (
    <Link
      href="/creator/discover"
      className="flex min-h-36 flex-col items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed sm:min-h-[236px] bg-background px-4 text-center outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span aria-hidden className="grid size-11 place-items-center rounded-full bg-muted">
        <Plus className="size-5" />
      </span>
      <span className="text-sm font-bold">{first ? "Join your first program" : "Add another app"}</span>
      <span className="text-[13px] text-muted-foreground">
        {first ? "Pick an app and get your link and code" : "More programs, more ways to earn"}
      </span>
    </Link>
  );
}

const SHOWN = 2;

/** Up to two programs as cover cards; a dashed card to add one fills the row. */
export function ProgramCards({ programs, total }: { programs: ProgramCardData[]; total: number }) {
  const shown = programs.slice(0, SHOWN);
  return (
    <Frame total={total}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {shown.map((data) => (
          <ProgramCard key={data.program.membershipId} {...data} />
        ))}
        {shown.length < SHOWN ? <AddAppCard first={shown.length === 0} /> : null}
      </div>
    </Frame>
  );
}

export function ProgramCardsUnavailable() {
  return (
    <Frame>
      <Unavailable />
    </Frame>
  );
}

export function ProgramCardsSkeleton() {
  return (
    <Frame busy>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className={CARD}>
            <Skeleton className="h-[110px] shrink-0 rounded-none" />
            <div className="flex flex-1 flex-col gap-2.5 px-4 pt-7 pb-4">
              <div className="flex flex-col">
                <span className="flex h-[1.375rem] items-center">
                  <Skeleton className="h-4 w-28" />
                </span>
                <span className="flex h-5 items-center">
                  <Skeleton className="h-3 w-24" />
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <Skeleton className="h-6.5 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}
