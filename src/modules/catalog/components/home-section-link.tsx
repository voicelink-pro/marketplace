"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOME_AUDIENCE_PARAM, type HomeAudience } from "../audience";
import { usePrefersReducedMotion } from "./use-media-query";

export type HomeSection = "offers" | "how-it-works";

/**
 * Link to a home page section. On `/` it is an in-page anchor: smooth scroll,
 * no navigation, so `?for=` and the catalog filters stay as they are. Elsewhere
 * it opens the home page for `defaultAudience` (creators while unknown) at
 * that section.
 */
export function HomeSectionLink({
  section,
  defaultAudience,
  className,
  children,
}: {
  section: HomeSection;
  defaultAudience: HomeAudience | null;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  if (pathname !== "/") {
    return (
      <Link href={`/?${HOME_AUDIENCE_PARAM}=${defaultAudience ?? "creators"}#${section}`} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={`#${section}`}
      onClick={(event) => {
        const target = document.getElementById(section);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        // Keeps the router's history state; only the hash changes.
        window.history.replaceState(window.history.state, "", `#${section}`);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
