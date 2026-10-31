"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { HomeSection } from "@/modules/catalog/components/home-section-link";
import { usePrefersReducedMotion } from "@/modules/catalog/components/use-media-query";

const SECTIONS: { section: HomeSection; label: string }[] = [
  { section: "offers", label: "Discover apps" },
  { section: "how-it-works", label: "How it works" },
  { section: "pricing", label: "Pricing" },
];

const PAGES = [
  { href: "/", label: "For creators" },
  { href: "/for-apps", label: "For apps" },
] as const;

/** Both home pages: section links scroll within either, as `HomeSectionLink` does. */
const LANDING_PATHS = new Set(["/", "/for-apps"]);

const ITEM =
  "flex h-11 items-center rounded-lg px-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:text-primary-ink";

/**
 * The header's menu below md: a sheet with the section links, both home pages
 * and "Log in" (or "Dashboard" with a session). Every link closes it. On a home
 * page the section links scroll only after the sheet has closed: while it is
 * open the page can't scroll.
 */
export function MobileNav({ account }: { account: "login" | "dashboard" | null }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const scrollTo = useRef<HomeSection | null>(null);
  const landing = LANDING_PATHS.has(pathname);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu" className="size-10 md:hidden">
          <Menu aria-hidden className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-72 gap-2 px-3 pt-4"
        onCloseAutoFocus={(event) => {
          const section = scrollTo.current;
          if (!section) return;
          scrollTo.current = null;
          // Focus would go back to the menu button and pull the page up again.
          event.preventDefault();
          const target = document.getElementById(section);
          target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
          window.history.replaceState(window.history.state, "", `#${section}`);
        }}
      >
        <SheetHeader className="px-3 pb-2">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Sections of the home page, both home pages and your account.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {SECTIONS.map(({ section, label }) =>
            landing ? (
              <a
                key={section}
                href={`#${section}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollTo.current = section;
                  setOpen(false);
                }}
                className={ITEM}
              >
                {label}
              </a>
            ) : (
              <Link key={section} href={`/#${section}`} onClick={() => setOpen(false)} className={ITEM}>
                {label}
              </Link>
            ),
          )}
          <span aria-hidden className="my-2 h-px bg-border" />
          {PAGES.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={ITEM}
            >
              {label}
            </Link>
          ))}
          {account ? (
            <>
              <span aria-hidden className="my-2 h-px bg-border" />
              <Link
                href={account === "login" ? "/login" : "/dashboard"}
                onClick={() => setOpen(false)}
                className={cn(ITEM, "font-semibold")}
              >
                {account === "login" ? "Log in" : "Dashboard"}
              </Link>
            </>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
