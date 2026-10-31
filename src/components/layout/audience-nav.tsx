"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { useAudienceNavClick, usePendingAudienceHref } from "./audience-nav-provider";

const OPTIONS = [
  { href: "/", label: "For creators" },
  { href: "/for-apps", label: "For apps" },
] as const;

/** Calm slide between the two pages; no overshoot. */
const SLIDE = { duration: 0.3, ease: "easeOut" } as const;

function Option({
  option,
  active,
  page,
  row,
  variant,
  reducedMotion,
}: {
  option: (typeof OPTIONS)[number];
  /** Pill position: the page being opened, or the current one. */
  active: boolean;
  /** The page actually shown, for `aria-current`. */
  page: boolean;
  row: boolean;
  variant: "bar" | "row";
  reducedMotion: boolean | null;
}) {
  const onClick = useAudienceNavClick(option.href);
  return (
    <Link
      href={option.href}
      onClick={onClick}
      aria-current={page ? "page" : undefined}
      className={cn(
        "relative inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
        row && "flex-1",
        active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active ? (
        // One per placement; the header stays mounted across `/` ↔ `/for-apps`, so it slides.
        <motion.span
          layoutId={`audience-pill-${variant}`}
          transition={reducedMotion ? { duration: 0 } : SLIDE}
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary"
        />
      ) : null}
      <span className="relative">{option.label}</span>
    </Link>
  );
}

function Pill({ variant }: { variant: "bar" | "row" }) {
  const pathname = usePathname();
  const pendingHref = usePendingAudienceHref();
  const reducedMotion = useReducedMotion();
  if (!OPTIONS.some((option) => option.href === pathname)) return null;
  // The clicked page right away, before it has loaded.
  const current = pendingHref ?? pathname;

  const row = variant === "row";
  const nav = (
    <nav
      aria-label="Audience"
      // The header switches to its centered three-column layout while this is in the DOM.
      data-audience-nav={row ? undefined : ""}
      className={cn("flex items-center rounded-full border bg-muted p-1", row && "w-full")}
    >
      {OPTIONS.map((option) => (
        <Option
          key={option.href}
          option={option}
          active={option.href === current}
          page={option.href === pathname}
          row={row}
          variant={variant}
          reducedMotion={reducedMotion}
        />
      ))}
    </nav>
  );

  return row ? <div className="border-t px-4 py-2 sm:px-6 lg:hidden">{nav}</div> : nav;
}

/**
 * "For creators | For apps" on the two home pages only. "bar": centered in the
 * header row from lg. "row": full width under the header below lg.
 * The pathname suspends on routes with unresolved params, which are never home pages.
 */
export function AudienceNav({ variant }: { variant: "bar" | "row" }) {
  return (
    <Suspense fallback={null}>
      <Pill variant={variant} />
    </Suspense>
  );
}
