import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LinkPendingSpinner } from "@/components/ui/link-pending-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getViewer, primaryOrganization } from "@/modules/accounts/viewer";
import { HomeSectionLink } from "@/modules/catalog/components/home-section-link";
import { AccountMenu } from "./account-menu";
import { AudienceNav } from "./audience-nav";
import { AudienceNavStatus } from "./audience-nav-provider";
import { HeaderStartButton } from "./header-start-button";
import { MobileNav } from "./mobile-nav";

/** White pill for the main header action, as on the home design. */
const inverted = "bg-foreground text-background hover:bg-foreground/85";

const NAV_LINK =
  "rounded-full px-2.5 py-2 text-sm font-medium whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

// Below 1180px the home pages' centered audience pill leaves too little room (<24px) for all three; Pricing
// then lives in the footer only.
const NAV = [
  { section: "offers", label: "Discover apps" },
  { section: "how-it-works", label: "How it works" },
  { section: "pricing", label: "Pricing", className: "hidden min-[1180px]:inline" },
] as const;

async function HeaderAccount({ showDashboard }: { showDashboard: boolean }) {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Below md it lives in the menu sheet: logo, "Start free" and the menu button fill a phone header. */}
        <Button variant="ghost" size="lg" asChild className="max-md:hidden">
          <Link href="/login">
            Log in
            <LinkPendingSpinner />
          </Link>
        </Button>
        <HeaderStartButton />
        <MobileNav account="login" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {showDashboard ? (
        <Button size="lg" asChild className={cn(inverted, "hidden sm:inline-flex")}>
          <Link href="/dashboard">
            Dashboard
            <LinkPendingSpinner />
          </Link>
        </Button>
      ) : null}
      <AccountMenu
        account={{
          displayName: viewer.displayName,
          email: viewer.email,
          isAdmin: viewer.isAdmin,
          isCreator: viewer.creator !== null,
          companyName: primaryOrganization(viewer)?.name ?? null,
        }}
      />
      <MobileNav account={showDashboard ? "dashboard" : null} />
    </div>
  );
}

/** `showDashboard={false}` drops the Dashboard button, e.g. during onboarding, where there is no workspace yet. */
export function PublicHeader({ showDashboard = true }: { showDashboard?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      {/* lg+ on the home pages: three columns so the audience pill sits centered between the brand and the account actions. */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:has-[[data-audience-nav]]:grid lg:has-[[data-audience-nav]]:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center">
          <Logo />
          <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => (
              <HomeSectionLink
                key={item.section}
                section={item.section}
                className={cn(NAV_LINK, "className" in item && item.className)}
              >
                {item.label}
              </HomeSectionLink>
            ))}
          </nav>
        </div>
        <div className="hidden justify-self-center lg:block">
          <AudienceNav variant="bar" />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:justify-self-end">
          <Suspense fallback={<Skeleton className="h-9 w-40 rounded-lg" />}>
            <HeaderAccount showDashboard={showDashboard} />
          </Suspense>
        </div>
      </div>
      <AudienceNav variant="row" />
      <AudienceNavStatus />
    </header>
  );
}
