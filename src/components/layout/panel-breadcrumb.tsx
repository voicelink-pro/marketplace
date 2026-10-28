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
import { findActiveItem, findSubPage, PANEL_LABELS, PANEL_NAV, type PanelArea } from "./nav-config";

/**
 * Area › section, plus the page itself when it is a tab under the section
 * (Earnings › Payouts). On a sub-page the section links back to its own page.
 */
export function PanelBreadcrumb({ area, pathname }: { area: PanelArea; pathname: string | null }) {
  const item = pathname === null ? undefined : findActiveItem(area, pathname);
  const subPage = pathname !== null && pathname !== item?.href ? findSubPage(area, pathname)?.label : undefined;
  return (
    <Breadcrumb className="hidden min-w-0 lg:block">
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
