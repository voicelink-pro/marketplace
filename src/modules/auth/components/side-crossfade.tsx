import { cn } from "@/lib/utils";
import type { HomeAudience } from "@/modules/catalog/audience";

const SIDES: HomeAudience[] = ["creators", "apps"];

/**
 * Both sides' text stacked in one grid cell: the slot always has the taller
 * one's size, so switching sides never moves what comes after it. The current
 * side fades in over 150ms (at once with reduced motion); the other is hidden
 * from assistive tech.
 */
export function SideCrossfade({
  side,
  render,
  className,
}: {
  side: HomeAudience;
  render: (side: HomeAudience) => React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("grid", className)}>
      {SIDES.map((option) => (
        <span
          key={option}
          aria-hidden={option !== side || undefined}
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-150 ease-out motion-reduce:transition-none",
            option === side ? "opacity-100" : "opacity-0",
          )}
        >
          {render(option)}
        </span>
      ))}
    </span>
  );
}
