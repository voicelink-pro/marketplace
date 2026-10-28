"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isActive, type NavItem, PANEL_NAV, type PanelArea } from "./nav-config";

/** Active item: yellow accent on the left edge, foreground text; idle items stay muted. */
const itemClassName =
  "relative h-10 font-medium text-muted-foreground md:h-9 data-active:text-foreground data-active:[&>svg]:text-primary-ink data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:left-0 data-active:before:w-0.75 data-active:before:rounded-full data-active:before:bg-primary";

/** `pathname` is null while the route is still resolving: the menu renders with nothing highlighted. */
type PathnameProps = { area: PanelArea; pathname: string | null };

function NavMenu({ items, area, pathname }: PathnameProps & { items: NavItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { home } = PANEL_NAV[area];
  return (
    <SidebarMenu className="gap-0.5">
      {items.map((item) => {
        const { href, label, icon: Icon, soon } = item;
        const active = pathname !== null && isActive(pathname, item, home);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={active} tooltip={label} className={itemClassName}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Icon aria-hidden />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
            {soon ? (
              <SidebarMenuBadge className="top-2.5! rounded-full border px-2 text-[11px] font-medium text-muted-foreground md:top-2!">
                Soon
              </SidebarMenuBadge>
            ) : null}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function PanelNavGroups({ area, pathname }: PathnameProps) {
  return PANEL_NAV[area].groups.map((group, index) => (
    <SidebarGroup key={group.label ?? index}>
      {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <NavMenu items={group.items} area={area} pathname={pathname} />
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

export function PanelNavSecondary({ area, pathname }: PathnameProps) {
  return <NavMenu items={PANEL_NAV[area].secondary} area={area} pathname={pathname} />;
}

/** Read the pathname here, not in the shell: it suspends on routes with unresolved params, e.g. a program page. */
export function ActivePanelNavGroups({ area }: { area: PanelArea }) {
  return <PanelNavGroups area={area} pathname={usePathname()} />;
}

export function ActivePanelNavSecondary({ area }: { area: PanelArea }) {
  return <PanelNavSecondary area={area} pathname={usePathname()} />;
}
