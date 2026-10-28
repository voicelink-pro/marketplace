import {
  AppWindow,
  Banknote,
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
  Users,
  Wallet,
} from "lucide-react";

export type PanelArea = "creator" | "company" | "admin";

/** `soon` marks modules of later stages: the page exists, but only as an empty state. */
export type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };

export const PANEL_LABELS: Record<PanelArea, string> = {
  creator: "Creator",
  company: "Company",
  admin: "Admin",
};

export const PANEL_NAV: Record<PanelArea, NavItem[]> = {
  creator: [
    { href: "/creator", label: "Overview", icon: LayoutDashboard },
    { href: "/", label: "Browse apps", icon: Search },
    { href: "/creator/programs", label: "My programs", icon: Layers },
    { href: "/creator/links", label: "Links", icon: Link2 },
    { href: "/creator/referrals", label: "Referrals", icon: Users },
    { href: "/creator/earnings", label: "Earnings", icon: HandCoins },
    { href: "/creator/payouts", label: "Payouts", icon: Banknote },
    { href: "/creator/settings", label: "Settings", icon: Settings },
  ],
  company: [
    { href: "/company", label: "Overview", icon: LayoutDashboard },
    { href: "/company/app", label: "App profile", icon: AppWindow },
    { href: "/company/plans", label: "Plans & commissions", icon: Receipt },
    { href: "/company/creators", label: "Creators", icon: Users },
    { href: "/company/referrals", label: "Referrals", icon: ChartNoAxesColumn },
    { href: "/company/integrations", label: "Integrations", icon: Plug },
    { href: "/company/funding", label: "Funding & statements", icon: Wallet },
    { href: "/company/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Applications review", icon: ClipboardCheck },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/integrations", label: "Integrations", icon: Plug, soon: true },
    { href: "/admin/finance", label: "Finance", icon: Landmark, soon: true },
    { href: "/admin/payouts", label: "Payouts", icon: Banknote, soon: true },
    { href: "/admin/issues", label: "Issues", icon: LifeBuoy, soon: true },
  ],
};

export function isActive(pathname: string, href: string, areaRoot: string): boolean {
  if (href === areaRoot) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
