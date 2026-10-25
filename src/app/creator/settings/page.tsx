import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLinksManager } from "@/modules/accounts/components/social-links-manager";
import { getOwnSocialLinks } from "@/modules/accounts/queries";
import { requireViewer } from "@/modules/accounts/viewer";

export const metadata: Metadata = { title: "Creator settings" };

export default async function CreatorSettingsPage() {
  const viewer = await requireViewer("/creator/settings");
  const links = await getOwnSocialLinks(viewer.userId);

  return (
    <>
      <PageHeader title="Settings" description="Profiles companies see when you promote their app." />
      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Social profiles</CardTitle>
            <CardDescription>
              Keep at least one profile here. Without one you can’t join new programs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SocialLinksManager links={links} />
          </CardContent>
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
