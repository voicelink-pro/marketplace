"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LinkPendingSpinner } from "@/components/ui/link-pending-icon";
import { HOME_AUDIENCE_PARAM, parseHomeAudience } from "@/modules/catalog/audience";
import { safeRedirectPath } from "../redirect";

const linkClassName = "font-medium text-foreground underline underline-offset-4 hover:text-primary-ink";

function LinkWithParams({ href, children }: { href: "/login" | "/signup"; children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams();
  const audience = parseHomeAudience(searchParams.get(HOME_AUDIENCE_PARAM) ?? undefined);
  if (audience) params.set(HOME_AUDIENCE_PARAM, audience);
  const next = safeRedirectPath(searchParams.get("next"), "");
  if (next) params.set("next", next);
  const query = params.toString();
  return (
    <Link href={query ? `${href}?${query}` : href} className={linkClassName}>
      {children}
      <LinkPendingSpinner className="ml-1 align-[-2px]" />
    </Link>
  );
}

/** Switches between log in and sign up without losing the side (`?for=`) or the page the person came from. */
export function AuthSwitchLink({ href, children }: { href: "/login" | "/signup"; children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <Link href={href} className={linkClassName}>
          {children}
          <LinkPendingSpinner className="ml-1 align-[-2px]" />
        </Link>
      }
    >
      <LinkWithParams href={href}>{children}</LinkWithParams>
    </Suspense>
  );
}
