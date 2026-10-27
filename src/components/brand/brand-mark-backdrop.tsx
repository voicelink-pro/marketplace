import { useId } from "react";
import { cn } from "@/lib/utils";
import { LOGO_RING, LOGO_STEM, LogoMark } from "./logo";

/** Line width of the outline, in units of the 24×24 mark (~2px at 32rem). */
const OUTLINE_WIDTH = 0.1;

/**
 * The "b" as a large decorative shape behind a page. `filled` is the solid
 * brand mark; `outline` traces the outer edge of stem and ring as one shape
 * (no seam where they meet): a widened copy minus the solid mark, used as a mask.
 * Position, size and crop come from `className`; the colour is `currentColor`.
 */
export function BrandMarkBackdrop({
  variant = "filled",
  className,
}: {
  variant?: "filled" | "outline";
  className?: string;
}) {
  const maskId = useId();
  if (variant === "filled") return <LogoMark className={cn("pointer-events-none", className)} />;

  return (
    <svg
      viewBox="-0.5 -0.5 25 25"
      aria-hidden
      className={cn("pointer-events-none shrink-0 text-primary-ink", className)}
    >
      <mask id={maskId}>
        <g fill="white" stroke="white" strokeWidth={OUTLINE_WIDTH * 2}>
          <rect {...LOGO_STEM} />
          <path fillRule="evenodd" d={LOGO_RING} />
        </g>
        <g fill="black">
          <rect {...LOGO_STEM} />
          <path fillRule="evenodd" d={LOGO_RING} />
        </g>
      </mask>
      <rect x="-0.5" y="-0.5" width="25" height="25" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
