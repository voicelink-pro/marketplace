"use client";

import { Check, ChevronsUpDown, ShieldCheck, Store, UserRound } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { PANEL_LABELS, PANEL_NAV, type PanelArea } from "./nav-config";

const AREA_ICONS = { creator: UserRound, company: Store, admin: ShieldCheck } as const;

/** `name`: the organization in the company area, the viewer's display name elsewhere. */
export type Workspace = { area: PanelArea; name: string };

function WorkspaceBadge({ area }: { area: PanelArea }) {
  const Icon = AREA_ICONS[area];
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Icon aria-hidden className="size-4" />
    </span>
  );
}

function WorkspaceText({ name, area }: Workspace) {
  return (
    <span className="grid min-w-0 flex-1 text-left leading-tight">
      <span className="truncate font-semibold">{name}</span>
      <span className="truncate text-xs text-muted-foreground">{PANEL_LABELS[area]}</span>
    </span>
  );
}

const staticClassName =
  "flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!";

/** Same box as the header while the session loads. */
export function WorkspaceMenuSkeleton({ area }: { area: PanelArea }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className={staticClassName}>
          <WorkspaceBadge area={area} />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-14" />
          </span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * Sidebar header. Accounts with both a creator profile and a company get a
 * switcher; everyone else sees the current workspace only.
 */
export function WorkspaceMenu({ area, workspaces }: { area: PanelArea; workspaces: Workspace[] }) {
  const { isMobile, state } = useSidebar();
  const current = workspaces.find((workspace) => workspace.area === area);
  if (!current) return <WorkspaceMenuSkeleton area={area} />;

  if (workspaces.length < 2) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className={staticClassName} title={current.name}>
            <WorkspaceBadge area={area} />
            <WorkspaceText {...current} />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={`Switch workspace, current: ${current.name}, ${PANEL_LABELS[area]}`}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <WorkspaceBadge area={area} />
              <WorkspaceText {...current} />
              <ChevronsUpDown aria-hidden className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side={isMobile || state === "expanded" ? "bottom" : "right"}
            sideOffset={4}
            className="w-(--radix-dropdown-menu-trigger-width) max-w-[calc(100vw-2rem)] min-w-56"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch workspace</DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem key={workspace.area} asChild>
                <Link
                  href={PANEL_NAV[workspace.area].home}
                  aria-current={workspace.area === area ? "page" : undefined}
                  title={workspace.name}
                >
                  <WorkspaceBadge area={workspace.area} />
                  <WorkspaceText {...workspace} />
                  {workspace.area === area ? <Check aria-hidden className="ml-auto" /> : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
