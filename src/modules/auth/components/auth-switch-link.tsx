"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { safeRedirectPath } from "../redirect";

const linkClassName = "font-medium text-foreground underline underline-offset-4 hover:text-primary-ink";

function LinkWithNext({ href, children }: { href: "/login" | "/signup"; children: React.ReactNode }) {
  const next = safeRedirectPath(useSearchParams().get("next"), "");
  return (
    <Link href={next ? `${href}?next=${encodeURIComponent(next)}` : href} className={linkClassName}>
      {children}
    </Link>
  );
}

/** Switches between log in and sign up without losing the page the person came from. */
export function AuthSwitchLink({ href, children }: { href: "/login" | "/signup"; children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <Link href={href} className={linkClassName}>
          {children}
        </Link>
      }
    >
      <LinkWithNext href={href}>{children}</LinkWithNext>
    </Suspense>
  );
}
