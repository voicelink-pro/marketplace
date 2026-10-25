import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getViewer } from "@/modules/accounts/viewer";
import { AccountMenu } from "./account-menu";

async function HeaderAccount() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="lg" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="lg" asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="lg" asChild>
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
        <div className="ml-auto">
          <Suspense fallback={<Skeleton className="h-9 w-40 rounded-lg" />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
