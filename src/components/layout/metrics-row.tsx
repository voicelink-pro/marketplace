import { cn } from "@/lib/utils";

export type Metric = {
  label: string;
  /** A real value, possibly streamed. Leave it out while the number isn't tracked yet: never sample numbers. */
  value?: React.ReactNode;
  /** Line under a real value, e.g. a link to the full list. */
  caption?: React.ReactNode;
};

/**
 * Compact results row of a panel overview. Phones: one row per metric.
 * sm+: tiles side by side. Untracked metrics show a dash and "Tracking starts soon".
 */
export function MetricsRow({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <section aria-labelledby="results-heading" className={className}>
      <h2 id="results-heading" className="sr-only">
        Results
      </h2>
      <dl
        className={cn(
          "grid divide-y rounded-[20px] border bg-card sm:divide-x sm:divide-y-0",
          metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {metrics.map(({ label, value, caption }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 px-5 py-3.5 sm:flex-col sm:items-start sm:gap-1 sm:py-5"
          >
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            {/* Phones: the value and its caption stay on one line; only the label wraps. */}
            <dd className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0.5">
              <span className="tabular text-2xl leading-none font-extrabold tracking-[-0.04em] sm:text-3xl">
                {value ?? (
                  <>
                    —<span className="sr-only">no data yet</span>
                  </>
                )}
              </span>
              <span className="text-xs whitespace-nowrap text-muted-foreground">{value === undefined ? "Tracking starts soon" : caption}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
