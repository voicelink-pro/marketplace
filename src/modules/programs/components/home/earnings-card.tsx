import { HandCoins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CardLink, HomeCard, Unavailable } from "./card";
import { type ChartPoint, EarningsChart } from "./earnings-chart";

const TITLE_ID = "earnings-heading";

function Frame({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return (
    <HomeCard titleId={TITLE_ID} busy={busy} className="gap-5 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <h2 id={TITLE_ID} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="grid size-6.5 place-items-center rounded-lg bg-primary/15 text-primary-ink">
            <HandCoins className="size-3.5" />
          </span>
          <span className="font-semibold tracking-normal">Earned this month</span>
        </h2>
        <CardLink href="/creator/earnings">Earnings</CardLink>
      </div>
      {children}
    </HomeCard>
  );
}

/**
 * Axis labels inside. At lg the minimum keeps this card at least as tall as
 * the Balance card beside it in every state, so the row never grows when
 * the cards stream in; it grows with the row otherwise.
 */
const CHART_BOX = "relative min-h-[150px] flex-1 sm:min-h-[200px] lg:min-h-[240px]";

/** Empty state: phones need no room for a chart, just the baseline, the sentence and the months. */
const EMPTY_BOX = "relative flex h-24 flex-col md:h-auto md:min-h-[200px] md:flex-1 lg:min-h-[240px]";

function MonthAxis({ months }: { months: string[] }) {
  return (
    <div className="grid grid-cols-6 pt-2 text-[11px] text-muted-foreground sm:text-xs md:pt-2.5">
      {months.map((month) => (
        <span key={month}>{month}</span>
      ))}
    </div>
  );
}

/**
 * `amounts`: this month's commission, one formatted line per currency.
 * `chart`: six months in the main currency, null while there is nothing to plot.
 */
export function EarningsCard({
  amounts,
  change,
  months,
  chart,
}: {
  amounts: string[];
  /** E.g. "+€41.80 vs Sep", when it can be computed. */
  change: string | null;
  months: string[];
  chart: { points: ChartPoint[]; callout: string } | null;
}) {
  const [first, ...others] = amounts;
  return (
    <Frame>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="tabular text-[2.125rem] leading-none font-extrabold tracking-[-0.04em] sm:text-[2.5rem]">
            {first}
          </span>
          {change ? (
            <span className="inline-flex h-6.5 items-center rounded-full bg-muted px-2.5 text-[13px] font-bold">{change}</span>
          ) : null}
        </div>
        {others.length > 0 ? (
          <span className="tabular text-lg font-bold">{others.join(" · ")}</span>
        ) : null}
        <span className="text-[13px] leading-5 text-muted-foreground">Commission on every renewal, for as long as customers pay</span>
      </div>
      {chart ? (
        <div className={CHART_BOX}>
          <div className="absolute inset-0">
            <EarningsChart points={chart.points} />
          </div>
          <span className="tabular absolute top-0 right-0 inline-flex h-7 items-center rounded-[10px] bg-foreground px-2.5 text-xs font-bold text-background">
            {chart.callout}
          </span>
        </div>
      ) : (
        <div className={EMPTY_BOX}>
          <div className="flex flex-1 items-center justify-center border-b-2 border-dashed">
            <span className="px-4 text-center text-[13px] text-muted-foreground sm:text-sm">
              Your chart starts with your first paying customer.
            </span>
          </div>
          <MonthAxis months={months} />
        </div>
      )}
    </Frame>
  );
}

export function EarningsUnavailable() {
  return (
    <Frame>
      <Unavailable />
    </Frame>
  );
}

/** One amount line, the caption and the chart box. */
export function EarningsSkeleton() {
  return (
    <Frame busy>
      <div className="flex flex-col gap-2">
        <span className="flex h-[2.125rem] items-center sm:h-10">
          <Skeleton className="h-8 w-36 sm:h-9" />
        </span>
        <span className="flex h-5 items-center">
          <Skeleton className="h-3 w-72 max-w-full" />
        </span>
      </div>
      <Skeleton className={cn(CHART_BOX, "rounded-xl")} />
    </Frame>
  );
}
