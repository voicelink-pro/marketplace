"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { LinkPendingIcon } from "@/components/ui/link-pending-icon";
import { cn } from "@/lib/utils";
import { HERO_CONTENT } from "@/modules/catalog/components/home-hero-content";

/** Signed-out sign-up targets, the same as each hero's primary button. */
const HREF = {
  creators: HERO_CONTENT.creators.primary.href,
  apps: HERO_CONTENT.apps.primary.signedOutHref ?? HERO_CONTENT.apps.primary.href,
};

function StartLink({ href, className }: { href: string; className: string }) {
  return (
    <Button size="lg" asChild className={cn("group", className)}>
      <Link href={href}>
        {/* Below 440px the full label doesn't fit next to the logo and "Log in" (it overflows up to ~430px). */}
        <span className="min-[440px]:hidden">Start free</span>
        <span className="max-[440px]:hidden">Start here for free</span>
        <LinkPendingIcon
          aria-hidden
          data-icon="inline-end"
          className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
        />
      </Link>
    </Button>
  );
}

function PathnameStartLink({ className }: { className: string }) {
  return <StartLink href={usePathname() === "/for-apps" ? HREF.apps : HREF.creators} className={className} />;
}

/**
 * The header's sign-up button for visitors without a session, the same label
 * everywhere. On `/for-apps` it signs up a company. The pathname suspends on
 * routes with unresolved params, which are never `/for-apps`.
 */
export function HeaderStartButton({ className }: { className?: string }) {
  const classes = cn("bg-foreground text-background hover:bg-foreground/85", className);
  return (
    <Suspense fallback={<StartLink href={HREF.creators} className={classes} />}>
      <PathnameStartLink className={classes} />
    </Suspense>
  );
}
