import { Suspense } from "react";
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
import { AccountMenu } from "./account-menu";
import { ActiveMobileTabBar, MobileTabBar } from "./mobile-tab-bar";
import { PANEL_NAV, type PanelArea } from "./nav-config";
import { ActivePanelBreadcrumb, PanelBreadcrumb } from "./panel-breadcrumb";
import {
  ActivePanelNavGroups,
  ActivePanelNavSecondary,
  PanelNavGroups,
  PanelNavSecondary,
} from "./panel-nav";
import { ActivePanelSearch, PanelSearch } from "./panel-search";
import { ThemeToggle } from "./theme-toggle";
import { type Workspace, WorkspaceMenu, WorkspaceMenuSkeleton } from "./workspace-menu";

/** The workspaces the viewer can switch between; one entry (no switcher) for single-role accounts and admin. */
async function WorkspaceSwitcher({ area }: { area: PanelArea }) {
  const viewer = await getViewer();
  if (!viewer) return <WorkspaceMenuSkeleton area={area} />;
  const organization = primaryOrganization(viewer);
  const workspaces: Workspace[] = [];
  if (area === "admin") {
    workspaces.push({ area, name: viewer.displayName });
  } else {
    if (viewer.creator || area === "creator") workspaces.push({ area: "creator", name: viewer.displayName });
    if (organization) workspaces.push({ area: "company", name: organization.name });
  }
  return <WorkspaceMenu area={area} workspaces={workspaces} />;
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

function SiteHeader({ area, hasTabs }: { area: PanelArea; hasTabs: boolean }) {
  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) w-full shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-4">
      {/* With a tab bar, phones open the menu from "More". */}
      <SidebarTrigger size="icon-lg" aria-label="Toggle sidebar" className={cn(hasTabs && "hidden md:inline-flex")} />
      <Logo href={PANEL_NAV[area].home} />
      <Separator orientation="vertical" className="mx-1 hidden h-5 self-center! sm:block" />
      <Suspense fallback={<PanelBreadcrumb area={area} pathname={null} />}>
        <ActivePanelBreadcrumb area={area} />
      </Suspense>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {area === "creator" ? (
          <Suspense fallback={<PanelSearch pathname={null} />}>
            <ActivePanelSearch />
          </Suspense>
        ) : null}
        <ThemeToggle />
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <PanelAccount />
        </Suspense>
      </div>
    </header>
  );
}

function AppSidebar({ area }: { area: PanelArea }) {
  return (
    <Sidebar collapsible="icon" className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
      <SidebarHeader>
        <Suspense fallback={<WorkspaceMenuSkeleton area={area} />}>
          <WorkspaceSwitcher area={area} />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
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
      <SiteHeader area={area} hasTabs={hasTabs} />
      <div className="flex flex-1">
        <AppSidebar area={area} />
        <SidebarInset
          className={cn(
            "min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
            // Room for the fixed tab bar on phones.
            hasTabs && "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 lg:pb-8",
          )}
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </SidebarInset>
      </div>
      {hasTabs ? (
        <Suspense fallback={<MobileTabBar area={area} pathname={null} />}>
          <ActiveMobileTabBar area={area} />
        </Suspense>
      ) : null}
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
