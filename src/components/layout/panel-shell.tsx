import { Suspense } from "react";
import { PageBrandMark } from "@/components/brand/brand-mark-backdrop";
import { Logo } from "@/components/brand/logo";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getViewer, primaryOrganization } from "@/modules/accounts/viewer";
import { AccountMenu, AccountMenuSkeleton } from "./account-menu";
import { ActiveMobileTabBar, MobileTabBar } from "./mobile-tab-bar";
import { PANEL_NAV, type PanelArea } from "./nav-config";
import { ActiveNotificationsBell, NotificationsBell } from "./notifications-bell";
import { ActivePanelBreadcrumb, PanelBreadcrumb } from "./panel-breadcrumb";
import {
  ActivePanelNavGroups,
  ActivePanelNavSecondary,
  PanelNavGroups,
  PanelNavSecondary,
} from "./panel-nav";
import { PanelSearchIconTrigger, PanelSearchProvider, PanelSearchTrigger } from "./panel-search";
import { PanelSearchSource } from "./panel-search-items";
import { SidebarBalance } from "./sidebar-balance";

async function PanelAccount({ area }: { area: PanelArea }) {
  const viewer = await getViewer();
  if (!viewer) return <AccountMenuSkeleton />;
  return (
    <AccountMenu
      area={area}
      account={{
        displayName: viewer.displayName,
        email: viewer.email,
        isAdmin: viewer.isAdmin,
        isCreator: viewer.creator !== null,
        companyName: primaryOrganization(viewer)?.name ?? null,
      }}
    />
  );
}

/**
 * Three zones: the side ones share the leftover width equally, so the search
 * trigger stays centered; it shrinks first when space runs out. Phones get the
 * logo on the left and search, bell and avatar on the right.
 */
function SiteHeader({ area, hasTabs }: { area: PanelArea; hasTabs: boolean }) {
  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) w-full shrink-0 items-center gap-3 border-b bg-background/85 px-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
        {/* With a tab bar, phones open the menu from "More". */}
        <SidebarTrigger
          size="icon-lg"
          aria-label="Toggle sidebar"
          className={cn("shrink-0", hasTabs && "hidden md:inline-flex")}
        />
        <Logo href={PANEL_NAV[area].home} className="shrink-0" />
        <Separator orientation="vertical" className="mx-1 hidden h-5 self-center! lg:block" />
        <Suspense fallback={<PanelBreadcrumb area={area} pathname={null} />}>
          <ActivePanelBreadcrumb area={area} />
        </Suspense>
      </div>
      <div className="hidden min-w-0 shrink md:block md:w-90 xl:w-140">
        <PanelSearchTrigger />
      </div>
      <div className="flex flex-1 basis-0 items-center justify-end gap-1">
        <PanelSearchIconTrigger className="md:hidden" />
        <Suspense fallback={<NotificationsBell />}>
          <ActiveNotificationsBell />
        </Suspense>
        <Suspense fallback={<AccountMenuSkeleton />}>
          <PanelAccount area={area} />
        </Suspense>
      </div>
    </header>
  );
}

function AppSidebar({ area }: { area: PanelArea }) {
  return (
    <Sidebar collapsible="icon" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
      {area === "admin" ? null : (
        <SidebarHeader className="pb-0">
          <SidebarBalance area={area} />
        </SidebarHeader>
      )}
      <SidebarContent className="py-2">
        <Suspense fallback={<PanelNavGroups area={area} pathname={null} />}>
          <ActivePanelNavGroups area={area} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <Suspense fallback={<PanelNavSecondary area={area} pathname={null} />}>
          <ActivePanelNavSecondary area={area} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Full-width sticky header with the sidebar below it (shadcn sidebar-16).
 * From md the sidebar collapses to icons; on phones it is a sheet opened from
 * the header or the tab bar. Everything that reads the session or the
 * pathname streams in behind Suspense, so the shell itself stays static.
 */
export function PanelShell({ area, children }: { area: PanelArea; children: React.ReactNode }) {
  const hasTabs = PANEL_NAV[area].mobileTabs.length > 0;
  return (
    <SidebarProvider className="flex-col [--header-height:calc(--spacing(14))]">
      <PanelSearchProvider area={area}>
        <Suspense fallback={null}>
          <PanelSearchSource area={area} />
        </Suspense>
        <SiteHeader area={area} hasTabs={hasTabs} />
        <div className="flex flex-1">
          <AppSidebar area={area} />
          <SidebarInset
            className={cn(
              "isolate min-w-0 overflow-clip px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
              // Room for the fixed tab bar on phones.
              hasTabs && "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 lg:pb-8",
            )}
          >
            <PageBrandMark />
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </SidebarInset>
        </div>
        {hasTabs ? (
          <Suspense fallback={<MobileTabBar area={area} pathname={null} />}>
            <ActiveMobileTabBar area={area} />
          </Suspense>
        ) : null}
      </PanelSearchProvider>
    </SidebarProvider>
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
