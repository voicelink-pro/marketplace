import {
  AppWindow,
  Banknote,
  ChartNoAxesColumn,
  ClipboardCheck,
  HandCoins,
  House,
  Landmark,
  Layers,
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
 * `description` is the one-line subtitle in search.
 * `soon` marks modules of later stages: the page exists, but only as an empty state.
 * `match` lists pages without a nav entry of their own (e.g. a tab under this item): they highlight
 * the item, get their own breadcrumb step and are indexed in search right after it.
 * `shortLabel` is used where space is tight (the phone tab bar).
 */
export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  soon?: boolean;
  match?: SubPage[];
  shortLabel?: string;
};

export type SubPage = { href: string; label: string; description: string; icon: LucideIcon };

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

const support: NavItem = {
  href: "/support",
  label: "Support",
  description: "Report an issue and follow replies",
  icon: LifeBuoy,
};

export const PANEL_NAV: Record<PanelArea, PanelNavConfig> = {
  creator: {
    home: "/creator",
    groups: [
      {
        items: [
          { href: "/creator", label: "Home", description: "Your programs, links and results", icon: House },
          { href: "/creator/discover", label: "Discover", description: "Find apps to promote", icon: Search },
        ],
      },
      {
        label: "Promote",
        items: [
          { href: "/creator/programs", label: "Programs", description: "Apps you promote, codes and terms", icon: Layers },
          { href: "/creator/links", label: "Links", description: "Named links for each place you post", icon: Link2 },
        ],
      },
      {
        label: "Results",
        items: [
          { href: "/creator/referrals", label: "Customers", description: "Clicks and sign-ups you referred", icon: Users },
          {
            href: "/creator/earnings",
            label: "Earnings",
            description: "Commission, statements and payouts",
            icon: HandCoins,
            match: [
              { href: "/creator/payouts", label: "Payouts", description: "Withdraw your balance", icon: Banknote },
            ],
          },
        ],
      },
    ],
    secondary: [
      { href: "/creator/settings", label: "Settings", description: "Social profiles companies see", icon: Settings },
      support,
    ],
    mobileTabs: ["/creator", "/creator/discover", "/creator/programs", "/creator/earnings"],
  },
  company: {
    home: "/company",
    groups: [
      {
        items: [{ href: "/company", label: "Home", description: "Your app, its program and its results", icon: House }],
      },
      {
        label: "Your program",
        items: [
          {
            href: "/company/app",
            label: "App profile",
            description: "Marketplace profile, visuals, links and terms",
            icon: AppWindow,
            shortLabel: "App",
          },
          {
            href: "/company/plans",
            label: "Plans & commissions",
            description: "Subscription plans and creator commission",
            icon: Receipt,
            shortLabel: "Plans",
          },
        ],
      },
      {
        label: "Results",
        items: [
          { href: "/company/creators", label: "Creators", description: "Creators who joined your program", icon: Users },
          {
            href: "/company/referrals",
            label: "Customers",
            description: "Clicks and registrations from creators",
            icon: ChartNoAxesColumn,
          },
        ],
      },
      {
        label: "Payments",
        items: [
          { href: "/company/integrations", label: "Integrations", description: "Payment events and identities", icon: Plug },
          {
            href: "/company/funding",
            label: "Funding & statements",
            description: "Funding balance, top-ups and statements",
            icon: Wallet,
            shortLabel: "Funding",
          },
        ],
      },
    ],
    secondary: [
      { href: "/company/settings", label: "Settings", description: "Your company account", icon: Settings },
      support,
      { href: "/", label: "Marketplace", description: "The public app catalog", icon: Store },
    ],
    mobileTabs: ["/company", "/company/app", "/company/referrals", "/company/funding"],
  },
  admin: {
    home: "/admin",
    groups: [
      {
        items: [
          {
            href: "/admin",
            label: "Applications review",
            description: "Submitted app listings to approve",
            icon: ClipboardCheck,
          },
          { href: "/admin/users", label: "Users", description: "Accounts on the marketplace", icon: Users },
          {
            href: "/admin/integrations",
            label: "Integrations",
            description: "Provider health and payment queues",
            icon: Plug,
            soon: true,
          },
          {
            href: "/admin/finance",
            label: "Finance",
            description: "Funding, reservations and reconciliation",
            icon: Landmark,
            soon: true,
          },
          {
            href: "/admin/payouts",
            label: "Payouts",
            description: "Creator transfers and bank payouts",
            icon: Banknote,
            soon: true,
          },
          {
            href: "/admin/issues",
            label: "Issues",
            description: "Investigations and support requests",
            icon: LifeBuoy,
            soon: true,
          },
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
  return matchesRoute(pathname, item.href) || (item.match ?? []).some((page) => matchesRoute(pathname, page.href));
}

/** Every item of an area, groups first, then the secondary ones. */
export function navItems(area: PanelArea): NavItem[] {
  const config = PANEL_NAV[area];
  return [...config.groups.flatMap((group) => group.items), ...config.secondary];
}

/** The `match` page at exactly this pathname, if any. */
export function findSubPage(area: PanelArea, pathname: string): SubPage | undefined {
  return navItems(area)
    .flatMap((item) => item.match ?? [])
    .find((page) => page.href === pathname);
}

export function findActiveItem(area: PanelArea, pathname: string): NavItem | undefined {
  const { home } = PANEL_NAV[area];
  return navItems(area).find((item) => isActive(pathname, item, home));
}
