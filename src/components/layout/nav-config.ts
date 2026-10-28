import {
  AppWindow,
  Banknote,
  Bell,
  ChartNoAxesColumn,
  ClipboardCheck,
  HandCoins,
  Landmark,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  type LucideIcon,
  Plug,
  Receipt,
  Search,
  Settings,
  Store,
  Users,
  Wallet,
} from "lucide-react";

export type PanelArea = "creator" | "company" | "admin";

/**
 * `soon` marks modules of later stages: the page exists, but only as an empty state.
 * `match` lists other routes that highlight this item, e.g. a sub-page that has no nav entry of its own.
 * `shortLabel` is used where space is tight (the phone tab bar).
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
  match?: string[];
  shortLabel?: string;
};

export type NavGroup = { label?: string; items: NavItem[] };

export type PanelNavConfig = {
  home: string;
  groups: NavGroup[];
  /** Pinned to the sidebar footer. */
  secondary: NavItem[];
  /** Hrefs of the items shown in the phone tab bar; empty means no tab bar. */
  mobileTabs: string[];
};

export const PANEL_LABELS: Record<PanelArea, string> = {
  creator: "Creator",
  company: "Company",
  admin: "Admin",
};

const notifications: NavItem = { href: "/notifications", label: "Notifications", icon: Bell };
const support: NavItem = { href: "/support", label: "Support", icon: LifeBuoy };

export const PANEL_NAV: Record<PanelArea, PanelNavConfig> = {
  creator: {
    home: "/creator",
    groups: [
      {
        items: [
          { href: "/creator", label: "Overview", icon: LayoutDashboard },
          { href: "/creator/discover", label: "Discover", icon: Search },
        ],
      },
      {
        label: "Promote",
        items: [
          { href: "/creator/programs", label: "Programs", icon: Layers },
          { href: "/creator/links", label: "Links", icon: Link2 },
        ],
      },
      {
        label: "Results",
        items: [
          { href: "/creator/referrals", label: "Customers", icon: Users },
          { href: "/creator/earnings", label: "Earnings", icon: HandCoins, match: ["/creator/payouts"] },
        ],
      },
    ],
    secondary: [{ href: "/creator/settings", label: "Settings", icon: Settings }, notifications, support],
    mobileTabs: ["/creator", "/creator/discover", "/creator/programs", "/creator/earnings"],
  },
  company: {
    home: "/company",
    groups: [
      { items: [{ href: "/company", label: "Overview", icon: LayoutDashboard }] },
      {
        label: "Your offer",
        items: [
          { href: "/company/app", label: "App profile", icon: AppWindow, shortLabel: "App" },
          { href: "/company/plans", label: "Plans & commissions", icon: Receipt, shortLabel: "Plans" },
        ],
      },
      {
        label: "Results",
        items: [
          { href: "/company/creators", label: "Creators", icon: Users },
          { href: "/company/referrals", label: "Customers", icon: ChartNoAxesColumn },
        ],
      },
      {
        label: "Payments",
        items: [
          { href: "/company/integrations", label: "Integrations", icon: Plug },
          { href: "/company/funding", label: "Funding & statements", icon: Wallet, shortLabel: "Funding" },
        ],
      },
    ],
    secondary: [
      { href: "/company/settings", label: "Settings", icon: Settings },
      notifications,
      support,
      { href: "/", label: "Marketplace", icon: Store },
    ],
    mobileTabs: ["/company", "/company/app", "/company/referrals", "/company/funding"],
  },
  admin: {
    home: "/admin",
    groups: [
      {
        items: [
          { href: "/admin", label: "Applications review", icon: ClipboardCheck },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/integrations", label: "Integrations", icon: Plug, soon: true },
          { href: "/admin/finance", label: "Finance", icon: Landmark, soon: true },
          { href: "/admin/payouts", label: "Payouts", icon: Banknote, soon: true },
          { href: "/admin/issues", label: "Issues", icon: LifeBuoy, soon: true },
        ],
      },
    ],
    secondary: [support],
    mobileTabs: [],
  },
};

function matchesRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The area home matches only itself; other items also match their sub-routes and `match` routes. */
export function isActive(pathname: string, item: NavItem, home: string): boolean {
  if (item.href === home) return pathname === home;
  return matchesRoute(pathname, item.href) || (item.match ?? []).some((route) => matchesRoute(pathname, route));
}

/** Every item of an area, groups first, then the secondary ones. */
export function navItems(area: PanelArea): NavItem[] {
  const config = PANEL_NAV[area];
  return [...config.groups.flatMap((group) => group.items), ...config.secondary];
}

export function findActiveItem(area: PanelArea, pathname: string): NavItem | undefined {
  const { home } = PANEL_NAV[area];
  return navItems(area).find((item) => isActive(pathname, item, home));
}
