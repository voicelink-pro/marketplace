"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const EARNINGS_TABS = [
  { href: "/creator/earnings", label: "Earnings" },
  { href: "/creator/payouts", label: "Payouts" },
] as const;

/** One section in the sidebar ("Earnings"), two pages: plain links, active by pathname. */
export function EarningsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Earnings and payouts" className="mb-6 flex w-fit rounded-lg bg-muted p-0.5 text-sm">
      {EARNINGS_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              active && "bg-card text-foreground shadow-xs",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
