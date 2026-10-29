"use client";

import { usePathname } from "next/navigation";
import { SegmentedNav } from "./segmented-nav";

export const EARNINGS_TABS = [
  { href: "/creator/earnings", label: "Earnings" },
  { href: "/creator/payouts", label: "Payouts" },
] as const;

/**
 * One section in the sidebar ("Earnings"), two pages: plain links, active by
 * pathname. Sits in the page header's actions (right on desktop, under the
 * title on phones).
 */
export function EarningsTabs() {
  const pathname = usePathname();
  return (
    <SegmentedNav
      label="Earnings and payouts"
      items={EARNINGS_TABS.map((tab) => ({
        key: tab.href,
        href: tab.href,
        label: tab.label,
        active: pathname === tab.href,
      }))}
    />
  );
}
