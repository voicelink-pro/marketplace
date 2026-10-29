import { Skeleton } from "@/components/ui/skeleton";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { CardHeading, HomeCard } from "@/modules/programs/components/home/card";
import { type ChartPoint, EarningsChart } from "@/modules/programs/components/home/earnings-chart";

const CHART_BOX = "relative min-h-[180px] flex-1 sm:min-h-[220px]";

function MonthlyFrame({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <HomeCard titleId="monthly-heading" busy={busy} className="gap-4 lg:col-span-2">
      <CardHeading id="monthly-heading" title="Monthly earnings" note="After the platform fee" />
      {children}
    </HomeCard>
  );
}

/**
 * Six months of net commission in the main currency, as on Home. The area
 * chart has no bars to mark, so the open month is named under it.
 */
export function MonthlyEarnings({
  points,
  callout,
  months,
  notes,
}: {
  /** Null while there is nothing to plot. */
  points: ChartPoint[] | null;
  callout: string | null;
  months: string[];
  notes: string[];
}) {
  return (
    <MonthlyFrame>
      {points ? (
        <div className={CHART_BOX}>
          <div className="absolute inset-0">
            <EarningsChart points={points} />
          </div>
          {callout ? (
            <span className="tabular absolute top-0 right-0 inline-flex h-7 items-center rounded-[10px] bg-foreground px-2.5 text-xs font-bold text-background">
              {callout}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-[140px] flex-col">
          <div className="flex flex-1 items-center justify-center border-b-2 border-dashed">
            <span className="px-4 text-center text-[13px] text-muted-foreground sm:text-sm">
              Your chart starts with your first paying customer.
            </span>
          </div>
          <div className="grid grid-cols-6 pt-2 text-[11px] text-muted-foreground sm:text-xs">
            {months.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>
      )}
      {notes.map((note) => (
        <p key={note} className="text-[13px] text-muted-foreground">
          {note}
        </p>
      ))}
    </MonthlyFrame>
  );
}

export function MonthlyEarningsSkeleton() {
  return (
    <MonthlyFrame busy>
      <Skeleton className={`${CHART_BOX} rounded-xl`} />
    </MonthlyFrame>
  );
}

export type ProgramEarning = {
  appId: string;
  appName: string;
  logoUrl: string | null;
  /** This month's net commission, formatted; null without any. */
  amount: string | null;
  /** Bar width against the top program, 0–100; null when not comparable (another currency). */
  share: number | null;
  /** Null when the query failed. */
  paying: number | null;
};

const count = new Intl.NumberFormat("en");

function payingLine(paying: number | null): string {
  if (paying === null) return "Paying customers unavailable";
  if (paying === 0) return "No paying customers yet";
  return `${count.format(paying)} paying ${paying === 1 ? "customer" : "customers"}`;
}

function ByProgramFrame({ month, children, busy }: { month?: string; children: React.ReactNode; busy?: boolean }) {
  return (
    <HomeCard titleId="by-program-heading" busy={busy} className="gap-3">
      <CardHeading id="by-program-heading" title="By program" note={month} />
      {children}
    </HomeCard>
  );
}

/** One inset per program: this month's amount, a neutral bar against the top one, paying customers. */
export function ByProgram({ month, programs }: { month: string; programs: ProgramEarning[] }) {
  return (
    <ByProgramFrame month={month}>
      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Join a program to start earning.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {programs.map((program) => (
            <li key={program.appId} className="flex flex-col gap-2.5 rounded-[14px] border bg-background p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <AppLogo
                    app={{ name: program.appName, logoUrl: program.logoUrl }}
                    className="size-5 rounded-[6px] border-0 text-[11px]"
                  />
                  <span className="truncate">{program.appName}</span>
                </span>
                <b className={program.amount ? "tabular shrink-0" : "shrink-0 text-muted-foreground"}>
                  {program.amount ?? "—"}
                </b>
              </div>
              <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-muted">
                {program.share ? (
                  <span className="block h-full rounded-full bg-muted-foreground" style={{ width: `${program.share}%` }} />
                ) : null}
              </span>
              <span className="tabular text-[13px] text-muted-foreground">{payingLine(program.paying)}</span>
            </li>
          ))}
        </ul>
      )}
    </ByProgramFrame>
  );
}

/** `month` is left out in the prerendered shell, which can't read the clock. */
export function ByProgramSkeleton({ month }: { month?: string }) {
  return (
    <ByProgramFrame month={month} busy>
      <Skeleton className="h-[92px] rounded-[14px]" />
    </ByProgramFrame>
  );
}

export function ByProgramUnavailable({ month }: { month: string }) {
  return (
    <ByProgramFrame month={month}>
      <p className="text-sm text-muted-foreground">Unavailable</p>
    </ByProgramFrame>
  );
}
