import { Wallet } from "lucide-react";
import Link from "next/link";
import { cache, Suspense } from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getViewer, primaryOrganization } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getCompanyWorkspaceApp } from "@/modules/company-app/queries";
import { getFinanceWorkspace } from "@/modules/finance/queries";

type Amount = { minor: string; currency: string };
type Load = () => Promise<Amount[]>;

/*
 * Loaders are cached per request: each amount renders twice, in the card
 * and in the collapsed sidebar's tooltip. Same sources as the Payouts and
 * Funding pages.
 */

const creatorAvailable = cache(async (): Promise<Amount[]> => {
  const { available } = await getFinanceWorkspace();
  return available.map((row) => ({ minor: row.available_minor, currency: row.currency }));
});

const creatorPending = cache(async (): Promise<Amount[]> => {
  const { totals } = await getCommissionWorkspace();
  return totals.map((row) => ({ minor: row.accrued_this_month, currency: row.currency }));
});

const companyAccounts = cache(async () => {
  const viewer = await getViewer();
  const organization = viewer ? primaryOrganization(viewer) : null;
  const app = organization ? await getCompanyWorkspaceApp(organization.id, organization.name) : null;
  return app ? (await getFinanceWorkspace(app.id)).accounts : [];
});

const companyAvailable: Load = async () =>
  (await companyAccounts()).map((row) => ({ minor: row.available_minor, currency: row.currency }));

const companyReserved: Load = async () =>
  (await companyAccounts()).map((row) => ({ minor: row.reserved_minor, currency: row.currency }));

const format = ({ minor, currency }: Amount) => formatMinorCurrency(minor, currency);

/**
 * The largest amount (EUR 0 when there is none yet, as on Payouts); other
 * currencies go in a tooltip. A dash when the query fails.
 */
async function AmountValue({ load, suffix = "" }: { load: Load; suffix?: string }) {
  // Signed-out visitors are left to the area's gate: the finance query would redirect them itself.
  if (!(await getViewer())) return null;
  const amounts = await settled(load);
  if (!amounts) return `—${suffix}`;
  const [primary = { minor: "0", currency: "EUR" }, ...others] = amounts.toSorted((a, b) =>
    BigInt(b.minor) > BigInt(a.minor) ? 1 : BigInt(b.minor) < BigInt(a.minor) ? -1 : 0,
  );
  const text = `${format(primary)}${suffix}`;
  if (others.length === 0) return text;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Focusable so keyboard users reach the other currencies too. */}
        <span tabIndex={0} className="cursor-default rounded-sm underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>Also {others.map(format).join(" · ")}</TooltipContent>
    </Tooltip>
  );
}

/** Top-aligned skeletons no taller than the line, so streaming in the amount doesn't move anything. */
function BalanceAmount({ load, suffix, skeleton }: { load: Load; suffix?: string; skeleton: string }) {
  return (
    <Suspense fallback={<Skeleton className={cn("inline-block align-top", skeleton)} />}>
      <AmountValue load={load} suffix={suffix} />
    </Suspense>
  );
}

type BalanceConfig = { label: string; href: string; main: Load; secondary: Load; secondarySuffix: string };

const CONFIG: Record<"creator" | "company", BalanceConfig> = {
  creator: {
    label: "Balance",
    href: "/creator/payouts",
    main: creatorAvailable,
    secondary: creatorPending,
    secondarySuffix: " pending",
  },
  company: {
    label: "Funding",
    href: "/company/funding",
    main: companyAvailable,
    secondary: companyReserved,
    secondarySuffix: " reserved",
  },
};

/**
 * Compact balance at the top of the sidebar, read-only: withdrawing and
 * funding stay on their pages. Each amount streams on its own into a
 * placeholder of the same size. Collapsed, a wallet icon carries the amounts
 * in its tooltip.
 */
export function SidebarBalance({ area }: { area: "creator" | "company" }) {
  const { label, href, main, secondary, secondarySuffix } = CONFIG[area];
  return (
    <>
      <section
        aria-label={label}
        className="flex flex-col gap-0.5 rounded-xl border bg-card px-3 py-2.5 group-data-[collapsible=icon]:hidden"
      >
        <div className="flex items-center justify-between gap-2 text-xs leading-4 text-muted-foreground">
          <span className="font-semibold">{label}</span>
          <div className="min-w-0 truncate tabular-nums">
            <BalanceAmount load={secondary} suffix={secondarySuffix} skeleton="mt-px h-3.5 w-20" />
          </div>
        </div>
        {/* Containers are divs: the skeleton is a div, which a <p> can't hold. */}
        <div className="text-xl leading-7 font-extrabold tracking-tight tabular-nums">
          <BalanceAmount load={main} skeleton="mt-0.5 h-6 w-24" />
        </div>
      </section>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={{
              children: (
                <div className="flex flex-col tabular-nums">
                  <div className="font-semibold">
                    {label} <BalanceAmount load={main} skeleton="h-3 w-12" />
                  </div>
                  <div>
                    <BalanceAmount load={secondary} suffix={secondarySuffix} skeleton="h-3 w-16" />
                  </div>
                </div>
              ),
            }}
          >
            <Link href={href}>
              <Wallet aria-hidden />
              <span>{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
