import Link from "next/link";
import { cn } from "@/lib/utils";

export type SegmentedNavItem = { key: string; href: string; label: string; active: boolean };

/**
 * Pill track of links, one active (bg-muted, bold): page tabs and filters.
 * Scrolls sideways instead of wrapping when it doesn't fit.
 */
export function SegmentedNav({
  label,
  items,
  className,
}: {
  label: string;
  items: SegmentedNavItem[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("max-w-full min-w-0", className)}>
      <ul className="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border bg-background p-[3px] text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.key} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex h-[30px] items-center rounded-full px-3.5 whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                item.active
                  ? "bg-muted font-bold text-foreground"
                  : "font-semibold text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
