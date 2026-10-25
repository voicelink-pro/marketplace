import { AppWindow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";
import { PlansManager } from "@/modules/company-app/components/plans-manager";
import { getCompanyWorkspaceApp } from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "Plans & commissions" };

export default async function CompanyPlansPage() {
  const viewer = await requireViewer("/company/plans");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");

  const app = await getCompanyWorkspaceApp(organization.id, organization.name);

  return (
    <>
      <PageHeader
        title="Plans & commissions"
        description="Your app’s subscription plans, their payment-system identifiers, and the recurring commission creators earn on each."
        actions={
          app ? (
            <Button variant="outline" asChild>
              <Link href="/company/app">Back to app profile</Link>
            </Button>
          ) : null
        }
      />

      {!app ? (
        <EmptyModule
          icon={AppWindow}
          title="Create your app first"
          description="Set up your app draft in App profile, then add its subscription plans and commission rates here."
        >
          <Button asChild>
            <Link href="/company/app">Go to App profile</Link>
          </Button>
        </EmptyModule>
      ) : (
        <PlansManager
          appId={app.id}
          appName={app.name}
          plans={app.plans}
          termsVersions={app.termsVersions}
          isOwner={organization.role === "owner"}
        />
      )}
    </>
  );
}
