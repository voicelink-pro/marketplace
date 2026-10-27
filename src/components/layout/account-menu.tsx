"use client";

import { LogOut, ShieldCheck, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/modules/auth/actions";
import { ThemeMenuItem } from "./theme-toggle";

export type AccountSummary = {
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  isCreator: boolean;
  hasCompany: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function AccountMenu({ account }: { account: AccountSummary }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-semibold">
              {initials(account.displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium text-foreground">{account.displayName}</span>
          {account.email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {account.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/creator">
              <UserRound />
              {account.isCreator ? "Creator workspace" : "Start promoting apps"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={account.hasCompany ? "/company" : "/onboarding/company"}>
              <Store />
              {account.hasCompany ? "Company workspace" : "List your app"}
            </Link>
          </DropdownMenuItem>
          {account.isAdmin ? (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldCheck />
                Admin
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserRound />
              Account settings
            </Link>
          </DropdownMenuItem>
          <ThemeMenuItem />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
