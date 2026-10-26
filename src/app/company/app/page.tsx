import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateAppForm } from "@/modules/accounts/components/forms";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";
import {
  AppDraftEditorForm,
  AppSubmissionStatusCard,
} from "@/modules/company-app/components/app-draft-editor";
import { MediaUploadForm } from "@/modules/company-app/components/media-upload-form";
import { getCompanyWorkspaceApp } from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "App profile" };

export default async function CompanyAppPage() {
  const viewer = await requireViewer("/company/app");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");

  const app = await getCompanyWorkspaceApp(organization.id, organization.name);
  const isOwner = organization.role === "owner";

  return (
    <>
      <PageHeader
        title="App profile"
        description="Prepare your app's marketplace profile, visuals, store links and program terms."
      />
      <div className="flex max-w-4xl flex-col gap-6">
        {app ? (
          <>
            <AppSubmissionStatusCard app={app} isOwner={isOwner} />
            {isOwner ? <MediaUploadForm appId={app.id} /> : null}
            <AppDraftEditorForm app={app} isOwner={isOwner} />
          </>
        ) : isOwner ? (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Create your app</CardTitle>
              <CardDescription>
                A company account can list one app in the MVP. Start with your app’s name — you’ll fill in its profile, visuals, and subscription plans next.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateAppForm />
            </CardContent>
          </Card>
        ) : (
          <p className="text-muted-foreground">Only the company owner can create the app.</p>
        )}
      </div>
    </>
  );
}
