import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type Metric = {
  label: string;
  /** Detail page: the whole tile becomes a link to it. */
  href?: string;
  /** The figure: a <MetricValue>, or an async component returning one inside <Suspense fallback={<MetricValueSkeleton />}>. */
  value: React.ReactNode;
};

/**
 * A metric's number and the line under it. Without a value it shows a dash
 * and the caption says why (e.g. "No commission yet"): never sample numbers.
 * A value may be several lines, e.g. one per currency.
 */
export function MetricValue({
  value,
  caption,
  busy,
}: {
  value?: React.ReactNode;
  caption?: React.ReactNode;
  busy?: boolean;
}) {
  return (
    // Phones: the value and its caption stay on one line; only the label wraps.
    <dd aria-busy={busy || undefined} className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0.5">
      <span className="tabular flex flex-col items-end gap-1 text-2xl leading-none font-extrabold tracking-[-0.04em] sm:items-start sm:text-3xl">
        {value ?? <span aria-hidden>—</span>}
      </span>
      <span className="text-xs whitespace-nowrap text-muted-foreground">{caption}</span>
    </dd>
  );
}

/**
 * Box-for-box with a one-line <MetricValue>, so tiles don't shift while they
 * stream in: same markup, and a no-break space gives each bar the line's
 * height and baseline (phones align value and caption by baseline).
 */
export function MetricValueSkeleton() {
  return (
    <MetricValue
      busy
      value={<Skeleton className="w-14">{" "}</Skeleton>}
      caption={<Skeleton className="inline-block w-20">{" "}</Skeleton>}
    />
  );
}

/**
 * Compact results row of a panel overview. Phones: one row per metric.
 * sm+: tiles side by side (four go two by two until lg). Hairlines between
 * tiles are the border color showing through a 1px gap.
 */
export function MetricsRow({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <section aria-labelledby="results-heading" className={className}>
      <h2 id="results-heading" className="sr-only">
        Results
      </h2>
      <dl
        className={cn(
          "grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border bg-border",
          // Every row stays full: an empty cell would show the border color.
          metrics.length === 3 ? "sm:grid-cols-3" : metrics.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2",
        )}
      >
        {metrics.map(({ label, href, value }) => (
          <div
            key={label}
            className={cn(
              "relative flex min-w-0 items-center justify-between gap-3 bg-card px-5 py-3.5 sm:flex-col sm:items-start sm:gap-1 sm:py-5",
              // The link's ::after covers the tile; ring-inset keeps the focus ring inside the rounded clip.
              href &&
                "transition-colors hover:bg-muted/60 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50 has-[a:focus-visible]:ring-inset",
            )}
          >
            <dt className="text-sm font-medium text-muted-foreground">
              {href ? (
                <Link href={href} className="outline-none after:absolute after:inset-0">
                  {label}
                </Link>
              ) : (
                label
              )}
            </dt>
            {value}
          </div>
        ))}
      </dl>
    </section>
  );
}
