import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StartCreatorForm } from "@/modules/accounts/components/forms";
import { requireViewer } from "@/modules/accounts/viewer";
import { safeRedirectPath } from "@/modules/auth/redirect";

export const metadata: Metadata = { title: "Set up your creator account" };

async function CreatorSetup({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, params] = await Promise.all([
    requireViewer("/onboarding/creator"),
    searchParams,
  ]);
  const rawNext = typeof params.next === "string" ? params.next : "";
  const safeNext = rawNext ? safeRedirectPath(rawNext, "/creator") : "/creator";

  if (viewer.creator && viewer.creator.socialLinkCount > 0) redirect(safeNext);
  return <StartCreatorForm next={safeNext} />;
}

export default function CreatorOnboardingPage({
  searchParams,
}: PageProps<"/onboarding/creator">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Where do you post?</CardTitle>
        <CardDescription>
          Companies see where their app is being promoted. Add at least one profile before you start
          promoting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-36 w-full" />}>
          <CreatorSetup searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
