import Link from "next/link";
import { cn } from "@/lib/utils";
import { type LinkSort, linksHref } from "./link-data";

export type ProgramFilterOption = { slug: string; appName: string };

/** "All programs" and one segment per program, as links that keep the sort. */
export function ProgramFilter({
  programs,
  selected,
  sort,
}: {
  programs: ProgramFilterOption[];
  selected: string | null;
  sort: LinkSort;
}) {
  const options = [{ slug: null, appName: "All programs" }, ...programs];
  return (
    <nav aria-label="Filter by program" className="max-w-full min-w-0">
      <ul className="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border bg-background p-[3px] text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const active = option.slug === selected;
          return (
            <li key={option.slug ?? "all"} className="shrink-0">
              <Link
                href={linksHref(option.slug, sort)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-[30px] items-center rounded-full px-3.5 whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "bg-muted font-bold text-foreground" : "font-semibold text-muted-foreground hover:text-foreground",
                )}
              >
                {option.appName}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
