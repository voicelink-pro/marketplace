"use client";

import {
  ChevronsUpDown,
  LifeBuoy,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { signOut } from "@/modules/auth/actions";
import { PANEL_LABELS, PANEL_NAV, type PanelArea } from "./nav-config";

export type AccountSummary = {
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  isCreator: boolean;
  /** The organization the company panel works with; null without one. */
  companyName: string | null;
};

const AREA_ICONS = { creator: UserRound, company: Store, admin: ShieldCheck } as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function AccountAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback className="bg-primary font-extrabold text-primary-foreground">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

/** Same footprint as the trigger while the session loads. */
export function AccountMenuSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-full lg:w-44" />;
}

/** `name`: the viewer in the creator area, the organization in the company area. */
type Workspace = { area: PanelArea; name: string };

function workspacesOf(account: AccountSummary, area: PanelArea | undefined): Workspace[] {
  const workspaces: Workspace[] = [];
  if (account.isCreator || area === "creator") workspaces.push({ area: "creator", name: account.displayName });
  if (account.companyName) workspaces.push({ area: "company", name: account.companyName });
  if (account.isAdmin) workspaces.push({ area: "admin", name: "Applications review" });
  return workspaces;
}

const itemClassName = "h-10 gap-3 rounded-lg px-2.5 [&_svg]:text-muted-foreground";

/**
 * The account's only menu: who is signed in, the workspace switch, profile
 * and account links, theme and sign out. In a panel (`area` set) the trigger
 * is a pill with the name and current workspace; phones and public pages show
 * the avatar alone.
 */
export function AccountMenu({ account, area }: { account: AccountSummary; area?: PanelArea }) {
  const router = useRouter();
  const workspaces = workspacesOf(account, area);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account and workspace menu"
          className={cn(
            "flex h-10 shrink-0 items-center gap-2.5 rounded-full p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted",
            area && "lg:border lg:bg-card lg:pr-2.5",
          )}
        >
          <AccountAvatar name={account.displayName} className="text-xs" />
          {area ? (
            <>
              <span className="hidden min-w-0 flex-col text-left leading-tight lg:flex">
                <span className="max-w-36 truncate text-[13px] font-bold">{account.displayName}</span>
                <span className="text-[11px] text-muted-foreground">{PANEL_LABELS[area]}</span>
              </span>
              <ChevronsUpDown aria-hidden className="hidden size-4 text-muted-foreground lg:block" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl p-2">
        <div className="flex items-center gap-3 p-2.5">
          <AccountAvatar name={account.displayName} className="size-11 text-sm" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-bold">{account.displayName}</span>
            {account.email ? <span className="truncate text-xs text-muted-foreground">{account.email}</span> : null}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2.5 pt-2 pb-1 text-xs font-semibold text-muted-foreground">
          Workspace
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={area ?? ""}
          onValueChange={(next) => router.push(PANEL_NAV[next as PanelArea].home)}
        >
          {workspaces.map((workspace) => {
            const Icon = AREA_ICONS[workspace.area];
            return (
              <DropdownMenuRadioItem
                key={workspace.area}
                value={workspace.area}
                className="h-12 gap-3 rounded-lg pl-2.5 data-[state=checked]:bg-muted [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-3 [&_[data-slot=dropdown-menu-radio-item-indicator]_svg]:text-primary-ink"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground in-data-[state=checked]:bg-background in-data-[state=checked]:text-primary-ink"
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{PANEL_LABELS[workspace.area]}</span>
                  <span className="truncate text-xs text-muted-foreground">{workspace.name}</span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        {account.isCreator ? null : (
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/onboarding/creator">
              <Plus />
              Start promoting apps
            </Link>
          </DropdownMenuItem>
        )}
        {account.companyName ? null : (
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/onboarding/company">
              <Plus />
              Set up a company
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {account.isCreator ? (
            <DropdownMenuItem asChild className={itemClassName}>
              <Link href="/creator/settings">
                <UserRound />
                Profile and social links
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/account">
              <Settings />
              Account settings
            </Link>
          </DropdownMenuItem>
          {account.isCreator ? (
            <DropdownMenuItem asChild className={itemClassName}>
              <Link href="/creator/payouts">
                <Wallet />
                Payout account
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className={itemClassName}>
            <Link href="/support">
              <LifeBuoy />
              Support
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild className={itemClassName}>
            <button type="submit" className="w-full">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
