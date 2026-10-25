import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayNameForm } from "@/modules/accounts/components/forms";
import { requireViewer } from "@/modules/accounts/viewer";
import { NewPasswordForm } from "@/modules/auth/components/password-forms";

export const metadata: Metadata = { title: "Account settings" };

async function ProfileCard() {
  const viewer = await requireViewer("/account");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Signed in as {viewer.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <DisplayNameForm currentName={viewer.displayName} />
      </CardContent>
    </Card>
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account settings" description="Settings shared by your creator and company use." />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-52 w-full rounded-xl" />}>
          <ProfileCard />
        </Suspense>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent className="max-w-sm">
            <NewPasswordForm submitLabel="Change password" stayOnPage />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
