import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The hero's static dots (1px every 20px, hero-dot-grid.tsx), faded out
 * from the bottom-right corner of each cell.
 */
const DOTS =
  "pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.14] [mask-image:radial-gradient(ellipse_80%_90%_at_100%_100%,black,transparent_75%)] dark:opacity-[0.2]";

export type StatCell = { icon: LucideIcon; label: string; value: React.ReactNode };

/**
 * Four numbers in one bordered strip with hairline dividers. Neutral on
 * purpose: no yellow here. Each value streams in on its own. Without a
 * title there is no heading, and `ariaLabel` names the list instead.
 */
export function StatStrip({
  cells,
  title,
  note,
  headingId = "stats-heading",
  ariaLabel,
}: {
  cells: StatCell[];
  title?: string;
  note?: string;
  headingId?: string;
  ariaLabel?: string;
}) {
  return (
    <section aria-labelledby={title ? headingId : undefined} className="flex flex-col gap-3">
      {title ? (
        <div className="flex items-baseline gap-2">
          <h2 id={headingId} className="text-base">
            {title}
          </h2>
          {note ? <span className="text-[13px] text-muted-foreground">{note}</span> : null}
        </div>
      ) : null}
      <dl
        aria-label={title ? undefined : (ariaLabel ?? "Summary")}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border bg-border lg:grid-cols-4"
      >
        {cells.map(({ icon: Icon, label, value }) => (
          <div key={label} className="relative flex min-w-0 flex-col gap-3 overflow-hidden bg-card p-4 sm:px-5 sm:pt-5">
            <div aria-hidden className={DOTS} />
            <dt className="relative flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
              <Icon aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </dt>
            <dd className="relative flex flex-col gap-3">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const NUMBER = "tabular text-[1.75rem] leading-none font-extrabold tracking-[-0.045em] sm:text-4xl";
const CAPTION = "truncate text-xs leading-4 text-muted-foreground";

export function StatValue({ value, caption, muted = false }: { value: string; caption: string; muted?: boolean }) {
  return (
    <>
      <span className={cn(NUMBER, muted && "text-muted-foreground")}>{value}</span>
      <span className={CAPTION} title={caption}>
        {caption}
      </span>
    </>
  );
}

/** The number's and the caption's line boxes. */
export function StatValueSkeleton() {
  return (
    <>
      <span className="flex h-7 items-center sm:h-9">
        <Skeleton className="h-6 w-16 sm:h-8" />
      </span>
      <span className="flex h-4 items-center">
        <Skeleton className="h-3 w-24 max-w-full" />
      </span>
    </>
  );
}
