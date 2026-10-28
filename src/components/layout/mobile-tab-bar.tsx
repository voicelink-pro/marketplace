"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isActive, navItems, PANEL_NAV, type PanelArea } from "./nav-config";

const tabClassName =
  "relative flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] leading-none font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset";

/** Phones only: four main sections plus "More", which opens the sidebar sheet. */
export function MobileTabBar({ area, pathname }: { area: PanelArea; pathname: string | null }) {
  const { openMobile, setOpenMobile } = useSidebar();
  const { home, mobileTabs } = PANEL_NAV[area];
  const items = navItems(area);
  const tabs = mobileTabs.flatMap((href) => items.filter((item) => item.href === href));

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {tabs.map((tab) => {
          const { href, label, shortLabel, icon: Icon } = tab;
          const active = pathname !== null && isActive(pathname, tab, home);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  tabClassName,
                  active &&
                    "text-primary-ink before:absolute before:inset-x-5 before:top-0 before:h-0.75 before:rounded-b-full before:bg-primary",
                )}
              >
                <Icon aria-hidden className="size-5" />
                <span className="max-w-full truncate px-1">{shortLabel ?? label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(true)}
            className={tabClassName}
          >
            <Menu aria-hidden className="size-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function ActiveMobileTabBar({ area }: { area: PanelArea }) {
  return <MobileTabBar area={area} pathname={usePathname()} />;
}
