import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Surface of every Home card: chunky radius, hairline border, flat fill. */
export const HOME_CARD = "rounded-[20px] border bg-card";

/**
 * Card frame shared by a card and its skeleton, so only the body swaps in.
 * `busy` marks the skeleton for assistive tech.
 */
export function HomeCard({
  titleId,
  busy = false,
  className,
  children,
}: {
  titleId: string;
  busy?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      className={cn(HOME_CARD, "flex min-w-0 flex-col gap-4 p-5 sm:p-6", className)}
    >
      {children}
    </section>
  );
}

export function CardTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-base">
      {children}
    </h2>
  );
}

/** Title with an optional muted line under it and a link on the right. */
export function CardHeading({
  id,
  title,
  note,
  action,
}: {
  id: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <CardTitle id={id}>{title}</CardTitle>
        {note ? <span className="text-[13px] text-muted-foreground">{note}</span> : null}
      </div>
      {action}
    </div>
  );
}

/** Quiet text link with an arrow, e.g. "Earnings →". */
export function CardLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  );
}

/** A card whose query failed: the frame stays, the body says so. */
export function Unavailable({ className }: { className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>Unavailable</p>;
}
