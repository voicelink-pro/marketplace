import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Short reassurances under a CTA ("Free to join" …), each after a check mark. */
export function TrustLine({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    // role="list": Safari drops list semantics from list-style: none.
    <ul
      role="list"
      className={cn(
        "flex list-none flex-wrap items-center gap-x-[18px] gap-y-2 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item} className="inline-flex items-center gap-[7px]">
          <span
            aria-hidden
            className="grid size-[18px] shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
          >
            <Check className="size-[11px]" strokeWidth={3.2} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
