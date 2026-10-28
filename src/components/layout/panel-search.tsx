"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DISCOVER = "/creator/discover";

/**
 * Creator header search: submits `q` to Discover, which reads it like the catalog search box.
 * Hidden on Discover itself, where the catalog has its own search field.
 */
export function PanelSearch({ pathname }: { pathname: string | null }) {
  if (pathname === DISCOVER) return null;
  return (
    <search className="hidden sm:block">
      <Form action={DISCOVER} className="relative">
        <Label htmlFor="panel-search" className="sr-only">
          Search apps
        </Label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="panel-search"
          name="q"
          type="search"
          enterKeyHint="search"
          placeholder="Search apps…"
          className="h-9 w-44 pl-9 lg:w-60"
        />
      </Form>
    </search>
  );
}

export function ActivePanelSearch() {
  return <PanelSearch pathname={usePathname()} />;
}
