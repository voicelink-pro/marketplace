import { ExternalLink, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SOCIAL_PLATFORM_LABELS } from "@/modules/accounts/social";
import { primaryOrganization, requireViewer } from "@/modules/accounts/viewer";
import {
  getCompanyWorkspaceApp,
  listCompanyCreators,
} from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "Creators" };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default async function CompanyCreatorsPage() {
  const viewer = await requireViewer("/company/creators");
  const organization = primaryOrganization(viewer);
  if (!organization) redirect("/onboarding/company");

  const app = await getCompanyWorkspaceApp(organization.id, organization.name);
  const creators = app ? await listCompanyCreators(app.id) : [];

  return (
    <>
      <PageHeader
        title="Creators"
        description="Creators who joined your program, their social profiles, and their referral codes."
      />

      {creators.length === 0 ? (
        <EmptyModule
          icon={Users}
          title="No creators have joined yet"
          description="Creators join your program on their own once your app is published in the marketplace. They appear here immediately with their social profiles and referral code."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Social profiles</TableHead>
                <TableHead>Referral code</TableHead>
                <TableHead>Accepted terms</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((creator) => (
                <TableRow key={creator.membershipId}>
                  <TableCell className="font-medium">{creator.displayName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {creator.socialLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-muted"
                        >
                          <span>{SOCIAL_PLATFORM_LABELS[link.platform]}</span>
                          <ExternalLink aria-hidden className="size-3 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {creator.referralCode}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="tabular">
                      Terms v{creator.acceptedTermsVersionNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">
                    {dateFormat.format(new Date(creator.joinedAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
