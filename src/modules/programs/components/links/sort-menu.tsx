"use client";

import { ArrowDownWideNarrow, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type LinkSort, linksHref } from "./link-data";

const SORT_LABELS: Record<LinkSort, string> = { clicks: "Most clicks", signups: "Most sign-ups" };

/** Sort order as a menu of links, so the choice lives in the URL. */
export function SortMenu({ program, sort }: { program: string | null; sort: LinkSort }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-[10px] px-3 text-[13px]">
          <span className="sr-only">Sort: </span>
          {SORT_LABELS[sort]}
          <ArrowDownWideNarrow data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {(Object.keys(SORT_LABELS) as LinkSort[]).map((option) => (
          <DropdownMenuItem key={option} asChild>
            <Link href={linksHref(program, option)} aria-current={option === sort ? "true" : undefined}>
              <Check aria-hidden className={cn(option === sort ? "opacity-100" : "opacity-0")} />
              {SORT_LABELS[option]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
