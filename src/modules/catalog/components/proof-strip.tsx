import { NumberTicker } from "@/components/ui/number-ticker";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getCreatorCount } from "../creator-count";
import { getAverageCommissionPercent, PAID_OUT_USD } from "../proof-stats";

/** No padding or margin of its own: the testimonials section places it under its carousel. */
const STRIP = "mx-auto w-full max-w-6xl";

type Stat = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
};

const COLUMNS = "grid w-full divide-y divide-border sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0";
const ITEM = "flex flex-col-reverse items-center gap-2 px-6 py-6 text-center first:pt-0 last:pb-0 sm:py-0";
const NUMBER = "text-4xl leading-none font-extrabold tracking-[-0.045em] tabular-nums sm:text-[44px] lg:text-[52px]";

/**
 * The count-up: the final text, invisible, holds the width so nothing around it
 * moves; the counting number sits on top of it. With a prefix it's pinned left
 * (the "$" stays put), otherwise right (the "%" stays put).
 */
function StatNumber({ stat }: { stat: Stat }) {
  const final = `${stat.prefix ?? ""}${stat.value.toLocaleString("en-US")}${stat.suffix ?? ""}`;
  return (
    <dd className={cn(NUMBER, stat.highlight ? "text-primary" : "text-foreground")}>
      <span className="sr-only">{final}</span>
      <span aria-hidden className={cn("inline-grid", stat.prefix ? "justify-items-start" : "justify-items-end")}>
        <span className="invisible col-start-1 row-start-1">{final}</span>
        <span className="col-start-1 row-start-1">
          {stat.prefix}
          <NumberTicker value={stat.value} />
          {stat.suffix}
        </span>
      </span>
    </dd>
  );
}

/**
 * Proof strip on the creators home page, inside the testimonials section under
 * the video carousel: paid out to creators (showcase constant), verified creators and
 * the average recurring commission across the published catalog. Three columns
 * with dividers, stacked on phones; each number counts up once when the strip
 * scrolls into view.
 */
export async function ProofStrip() {
  const [creators, averageCommission] = await Promise.all([getCreatorCount(), getAverageCommissionPercent()]);
  const stats: Stat[] = [
    { value: PAID_OUT_USD, prefix: "$", label: "paid out to creators", highlight: true },
    { value: creators, label: "verified creators" },
    ...(averageCommission !== null
      ? [{ value: averageCommission, suffix: "%", label: "average recurring commission" }]
      : []),
  ];

  return (
    <section aria-label="boostlink in numbers" className={STRIP}>
      <dl className={COLUMNS}>
        {stats.map((stat) => (
          <div key={stat.label} className={ITEM}>
            <dt className="text-[15px] text-muted-foreground">{stat.label}</dt>
            <StatNumber stat={stat} />
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Same columns and height while the catalog loads. */
export function ProofStripSkeleton() {
  return (
    <div aria-hidden className={STRIP}>
      <div className={COLUMNS}>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={ITEM}>
            <Skeleton className="h-[22px] w-40" />
            <Skeleton className="h-9 w-32 sm:h-11 lg:h-[52px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
