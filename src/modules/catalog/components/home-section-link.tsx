"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { usePrefersReducedMotion } from "./use-media-query";

export type HomeSection = "offers" | "how-it-works" | "pricing";

/** Both home pages: `/` for creators and `/for-apps`. Section links scroll within either. */
const LANDING_PATHS = new Set(["/", "/for-apps"]);

type Props = { section: HomeSection; className?: string; children: React.ReactNode };

function SectionLink({ section, className, children }: Props) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();

  if (!LANDING_PATHS.has(pathname)) {
    return (
      <Link href={`/#${section}`} className={className}>
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

/**
 * Link to a home page section. On a home page it is an in-page anchor: smooth
 * scroll, no navigation. Elsewhere it opens the creators home page at that
 * section. The pathname suspends on routes with unresolved params, so until
 * then it is that plain link.
 */
export function HomeSectionLink(props: Props) {
  return (
    <Suspense
      fallback={
        <Link href={`/#${props.section}`} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <SectionLink {...props} />
    </Suspense>
  );
}
