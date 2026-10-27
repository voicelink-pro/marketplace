import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StartCreatorForm } from "@/modules/accounts/components/forms";
import { ONBOARDING_CARD, OnboardingIntro } from "@/modules/accounts/components/onboarding";
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
    // Forms read best narrower than the 880px onboarding column.
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <OnboardingIntro
        step={2}
        backHref="/onboarding"
        title="Where do you post?"
        description="Companies see where their app is being promoted. Add at least one profile before you start promoting."
      />
      <div className={ONBOARDING_CARD}>
        <Suspense fallback={<Skeleton className="h-56 w-full" />}>
          <CreatorSetup searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
