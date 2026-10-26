import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getViewer } from "@/modules/accounts/viewer";
import { AccountMenu } from "./account-menu";
import { DarkPortalScope } from "./dark-portal-scope";
import { MobileNav } from "./mobile-nav";
import { PANEL_LABELS, type PanelArea } from "./nav-config";
import { PanelNav } from "./panel-nav";

async function ContextSwitch({ area }: { area: PanelArea }) {
  const viewer = await getViewer();
  if (!viewer || area === "admin") return null;
  const hasCompany = viewer.organizations.length > 0;
  if (!viewer.creator || !hasCompany) return null;

  const options: { area: "creator" | "company"; href: string }[] = [
    { area: "creator", href: "/creator" },
    { area: "company", href: "/company" },
  ];
  return (
    <nav aria-label="Switch workspace" className="flex rounded-lg bg-muted p-0.5 text-sm">
      {options.map((option) => (
        <Link
          key={option.area}
          href={option.href}
          aria-current={option.area === area ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            option.area === area && "bg-card text-foreground shadow-xs",
          )}
        >
          {PANEL_LABELS[option.area]}
        </Link>
      ))}
    </nav>
  );
}

async function PanelAccount() {
  const viewer = await getViewer();
  if (!viewer) return null;
  return (
    <AccountMenu
      account={{
        displayName: viewer.displayName,
        email: viewer.email,
        isAdmin: viewer.isAdmin,
        isCreator: viewer.creator !== null,
        hasCompany: viewer.organizations.length > 0,
      }}
    />
  );
}

/**
 * Desktop: sticky sidebar + topbar. Mobile: topbar with a sheet menu.
 * Everything that reads the session streams in behind Suspense.
 */
export function PanelShell({ area, children }: { area: PanelArea; children: React.ReactNode }) {
  const home = area === "admin" ? "/admin" : `/${area}`;
  // Brand themes by role: creators work on dark, companies and admins on light.
  const dark = area === "creator";
  return (
    <div
      className={cn(
        "min-h-dvh w-full bg-background text-foreground lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]",
        dark && "dark",
      )}
    >
      {dark ? <DarkPortalScope /> : null}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar px-3 py-4 lg:flex">
        <div className="flex flex-col gap-1 px-2">
          <Logo href={home} />
          <span className="pl-[2.125rem] text-xs text-muted-foreground">{PANEL_LABELS[area]} workspace</span>
        </div>
        <Suspense fallback={null}>
          <PanelNav area={area} />
        </Suspense>
        <div className="mt-auto px-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Browse the marketplace
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-4 lg:px-8">
          <MobileNav
            area={area}
            contextSwitch={
              <Suspense fallback={null}>
                <ContextSwitch area={area} />
              </Suspense>
            }
          />
          <Logo href={home} className="lg:hidden" />
          <div className="ml-auto flex items-center gap-3">
            <Suspense fallback={null}>
              <div className="hidden sm:block">
                <ContextSwitch area={area} />
              </div>
            </Suspense>
            <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
              <PanelAccount />
            </Suspense>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
