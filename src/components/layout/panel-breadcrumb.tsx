"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EARNINGS_TABS } from "./earnings-tabs";
import { findActiveItem, PANEL_LABELS, PANEL_NAV, type PanelArea } from "./nav-config";

/** Labels of pages reached through a nav item's `match`, taken from the tabs that link them. */
const SUB_PAGE_LABELS = new Map<string, string>(EARNINGS_TABS.map((tab) => [tab.href, tab.label]));

/**
 * Area › section, plus the page itself when it is a tab under the section
 * (Earnings › Payouts). On a sub-page the section links back to its own page.
 */
export function PanelBreadcrumb({ area, pathname }: { area: PanelArea; pathname: string | null }) {
  const item = pathname === null ? undefined : findActiveItem(area, pathname);
  const subPage = pathname !== null && pathname !== item?.href ? SUB_PAGE_LABELS.get(pathname) : undefined;
  return (
    <Breadcrumb className="hidden min-w-0 sm:block">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={PANEL_NAV[area].home}>{PANEL_LABELS[area]}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {item ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              {pathname === item.href ? (
                <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="truncate">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {subPage ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate">{subPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function ActivePanelBreadcrumb({ area }: { area: PanelArea }) {
  return <PanelBreadcrumb area={area} pathname={usePathname()} />;
}
