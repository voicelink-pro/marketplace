import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrganizationForm } from "@/modules/accounts/components/forms";
import { requireViewer } from "@/modules/accounts/viewer";

export const metadata: Metadata = { title: "Set up your company account" };

async function CompanySetup() {
  const viewer = await requireViewer("/onboarding/company");
  if (viewer.organizations.length > 0) redirect("/company");
  return <CreateOrganizationForm />;
}

export default function CompanyOnboardingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set up your company</CardTitle>
        <CardDescription>
          Your company account holds your app, its commission program and its funding. You can
          rename it later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <CompanySetup />
        </Suspense>
      </CardContent>
    </Card>
  );
}
