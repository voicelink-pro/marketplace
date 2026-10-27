import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrganizationForm } from "@/modules/accounts/components/forms";
import { ONBOARDING_CARD, OnboardingIntro } from "@/modules/accounts/components/onboarding";
import { requireViewer } from "@/modules/accounts/viewer";

export const metadata: Metadata = { title: "Set up your company account" };

async function CompanySetup() {
  const viewer = await requireViewer("/onboarding/company");
  if (viewer.organizations.length > 0) redirect("/company");
  return <CreateOrganizationForm />;
}

export default function CompanyOnboardingPage() {
  return (
    // Forms read best narrower than the 880px onboarding column.
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <OnboardingIntro
        step={2}
        backHref="/onboarding"
        title="Set up your company"
        description="Your company account holds your app, its commission program and its funding."
      />
      <div className={ONBOARDING_CARD}>
        <Suspense fallback={<Skeleton className="h-36 w-full" />}>
          <CompanySetup />
        </Suspense>
      </div>
    </div>
  );
}
