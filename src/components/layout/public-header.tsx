import { UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getViewer } from "@/modules/accounts/viewer";
import { AccountMenu } from "./account-menu";
import { HeaderSearchButton } from "./header-search-button";
import { ThemeToggle } from "./theme-toggle";

/** Black pill (white in dark mode) for the account action, as on the home design. */
const inverted = "bg-foreground text-background hover:bg-foreground/85";

const NAV = [
  { href: "/#offers", label: "Discover offers" },
  { href: "/#how-it-works", label: "How it works" },
];

async function HeaderAccount() {
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
      <Button size="lg" asChild className={cn(inverted, "hidden sm:inline-flex")}>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
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

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <HeaderSearchButton />
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="h-9 w-40 rounded-lg" />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
