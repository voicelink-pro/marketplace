import { UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getViewer } from "@/modules/accounts/viewer";
import { getDefaultHomeAudience } from "@/modules/catalog/audience-server";
import { HeaderAudienceToggle } from "@/modules/catalog/components/home-audience";
import { AccountMenu } from "./account-menu";
import { AudienceSectionLink } from "./audience-section-link";
import { HeaderSearchButton } from "./header-search-button";
import { ThemeToggle } from "./theme-toggle";

/** Black pill (white in dark mode) for the account action, as on the home design. */
const inverted = "bg-foreground text-background hover:bg-foreground/85";

const NAV = [
  { section: "offers", label: "Discover apps" },
  { section: "how-it-works", label: "How it works" },
] as const;

async function HeaderAccount({ showDashboard }: { showDashboard: boolean }) {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="lg" asChild className="hidden sm:inline-flex">
          <Link href="/signup">Sign up</Link>
        </Button>
        <Button size="lg" asChild className={inverted}>
          <Link href="/login">
            <UserRound data-icon="inline-start" />
            Log in
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {showDashboard ? (
        <Button size="lg" asChild className={cn(inverted, "hidden sm:inline-flex")}>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      ) : null}
      <AccountMenu
        account={{
          displayName: viewer.displayName,
          email: viewer.email,
          isAdmin: viewer.isAdmin,
          isCreator: viewer.creator !== null,
          hasCompany: viewer.organizations.length > 0,
        }}
      />
    </div>
  );
}

async function HeaderAudience({ variant }: { variant: "bar" | "row" }) {
  return <HeaderAudienceToggle defaultAudience={await getDefaultHomeAudience()} variant={variant} />;
}

/** Home page audience toggle: renders nothing on other pages. */
function HomeAudienceSlot({ variant }: { variant: "bar" | "row" }) {
  return (
    <Suspense fallback={<HeaderAudienceToggle defaultAudience={null} variant={variant} />}>
      <HeaderAudience variant={variant} />
    </Suspense>
  );
}

/** `showDashboard={false}` drops the Dashboard button, e.g. during onboarding, where there is no workspace yet. */
export function PublicHeader({ showDashboard = true }: { showDashboard?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      {/* lg+: three columns so the home toggle sits centered between the brand and the account actions. */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center">
          <Logo />
          <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <AudienceSectionLink
                key={item.section}
                section={item.section}
                className="rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {item.label}
              </AudienceSectionLink>
            ))}
          </nav>
        </div>
        {/* Always present so the account actions keep the third column on every page. */}
        <div className="hidden justify-self-center lg:block">
          <HomeAudienceSlot variant="bar" />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:justify-self-end">
          <HeaderSearchButton />
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="h-9 w-40 rounded-lg" />}>
            <HeaderAccount showDashboard={showDashboard} />
          </Suspense>
        </div>
      </div>
      <HomeAudienceSlot variant="row" />
    </header>
  );
}
