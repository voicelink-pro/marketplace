import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page heading with the Discover button. `title` and `subtitle` stream in
 * behind one <Suspense>; the button is static.
 */
export function GreetingFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
      <Button asChild size="lg" className="h-12 shrink-0 px-6 text-[15px] font-bold">
        <Link href="/creator/discover">
          Discover apps
          <LinkPendingIcon data-icon="inline-end" />
        </Link>
      </Button>
    </section>
  );
}

export function GreetingText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="text-[1.7rem] leading-tight tracking-[-0.035em] sm:text-[2rem]">{title}</h1>
      <p className="text-[15px] leading-6 text-muted-foreground sm:text-base">{subtitle}</p>
    </>
  );
}

/** Same line boxes as the text: a 2rem heading line and a body line. */
export function GreetingSkeleton() {
  return (
    <>
      <span className="flex h-[2.125rem] items-center sm:h-10">
        <Skeleton className="h-7 w-64 max-w-full sm:h-8" />
      </span>
      <span className="flex h-6 items-center">
        <Skeleton className="h-4 w-72 max-w-full" />
      </span>
    </>
  );
}

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four"];

export function stepsLeftLine(open: number): string {
  const count = COUNT_WORDS[open] ?? String(open);
  return `${count} ${open === 1 ? "step" : "steps"} left before your first referral.`;
}

export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || displayName;
}
