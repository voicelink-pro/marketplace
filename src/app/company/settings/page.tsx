import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RenameOrganizationForm } from "@/modules/accounts/components/forms";
import { getOrganizationDetails } from "@/modules/accounts/queries";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";

export const metadata: Metadata = { title: "Company settings" };

export default async function CompanySettingsPage() {
  const viewer = await requireViewer("/company/settings");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");
  const details = await getOrganizationDetails(organization.id);
  const isOwner = organization.role === "owner";

  return (
    <>
      <PageHeader title="Settings" description="Your company account." />
      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
            <CardDescription>
              {isOwner ? "Shown to creators next to your app." : "Only the owner can change this."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOwner ? (
              <RenameOrganizationForm currentName={details.name} />
            ) : (
              <p className="font-medium">{details.name}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
            <CardDescription>
              {details.memberCount === 1
                ? "You're the only member."
                : `${details.memberCount} members.`}{" "}
              Your role: {organization.role === "owner" ? "Owner" : "Member"}.
            </CardDescription>
          </CardHeader>
        </Card>
        <p className="text-sm text-muted-foreground">
          Your name, email and password are in{" "}
          <Link href="/account" className="font-medium text-foreground underline-offset-4 hover:underline">
            account settings
          </Link>
          .
        </p>
      </div>
    </>
  );
}
