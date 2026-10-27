"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, PANEL_NAV, type PanelArea } from "./nav-config";

export function PanelNav({ area, onNavigate }: { area: PanelArea; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = PANEL_NAV[area];
  const root = items[0]!.href;

  return (
    <nav aria-label={`${area} navigation`} className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon, soon }) => {
        const active = isActive(pathname, href, root);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 lg:min-h-9",
              active && "bg-sidebar-accent text-foreground",
            )}
          >
            <Icon aria-hidden className={cn("size-4 shrink-0", active && "text-primary-ink")} />
            {label}
            {soon ? (
              <span className="ml-auto rounded-full border px-2 py-0.5 text-[11px] leading-none font-medium text-muted-foreground">
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
