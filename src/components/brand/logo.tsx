import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/** Geometry of the "b" on a 24×24 box: a rounded stem joined to a ring. */
export const LOGO_STEM = { x: 2.5, y: 1, width: 6.5, height: 22, rx: 3.25 } as const;
export const LOGO_RING = "M14 7a8 8 0 1 1 0 16a8 8 0 1 1 0-16Zm0 4.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4Z";

/** The "b" mark from the brand board. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-7 shrink-0 fill-primary", className)}>
      <rect {...LOGO_STEM} />
      <path fillRule="evenodd" d={LOGO_RING} />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <LogoMark />
      <span className="text-[1.2rem] leading-none font-bold tracking-[-0.04em]">
        {siteConfig.name}
      </span>
    </Link>
  );
}
