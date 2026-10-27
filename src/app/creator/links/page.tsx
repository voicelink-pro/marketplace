import { ExternalLink, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SOCIAL_PLATFORM_LABELS } from "@/modules/accounts/social";
import { requireViewer } from "@/modules/accounts/viewer";
import {
  CopyValueButton,
} from "@/modules/programs/components/copy-value-button";
import { CreateReferralLinkForm } from "@/modules/programs/components/create-referral-link-form";
import { listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Links" };

export default async function CreatorLinksPage({
  searchParams,
}: PageProps<"/creator/links">) {
  const [viewer, rawSearch] = await Promise.all([
    requireViewer("/creator/links"),
    searchParams,
  ]);
  const programs = await listCreatorProgramMemberships(viewer.userId);
  const selectedSlug =
    typeof rawSearch.program === "string" ? rawSearch.program.trim().toLowerCase() : "";

  if (programs.length === 0) {
    return (
      <>
        <PageHeader
          title="Links"
          description="Named links for each place you post, so you can compare what works."
        />
        <EmptyModule
          icon={Link2}
          title="No links yet"
          description="Join a program first. Then create named links such as “Instagram bio” or “TikTok video 1” for that app."
        >
          <Button asChild variant="outline">
            <Link href="/">Browse apps</Link>
          </Button>
        </EmptyModule>
      </>
    );
  }

  const visiblePrograms = selectedSlug
    ? programs.filter((program) => program.slug === selectedSlug)
    : programs;

  const allLinks = visiblePrograms.flatMap((program) =>
    program.links.map((link) => ({
      ...link,
      appName: program.appName,
      appSlug: program.slug,
      referralCode: program.referralCode,
    })),
  );

  return (
    <>
      <PageHeader
        title="Links"
        description="Create named referral links for each placement and copy URLs or referral codes."
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a named link</CardTitle>
            <CardDescription>
              Pick one of your active programs, name the placement, and select the channel and app destination.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateReferralLinkForm
              programs={programs.map((program) => ({
                membershipId: program.membershipId,
                appName: program.appName,
                availableDestinations: program.availableDestinations,
              }))}
            />
          </CardContent>
        </Card>

        {programs.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={selectedSlug === "" ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href="/creator/links">All programs ({programs.length})</Link>
            </Button>
            {programs.map((program) => (
              <Button
                key={program.membershipId}
                variant={selectedSlug === program.slug ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/creator/links?program=${encodeURIComponent(program.slug)}`}>
                  {program.appName} ({program.links.length})
                </Link>
              </Button>
            ))}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Link name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>App destination</TableHead>
                <TableHead>Referral URL</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/creator/programs/${link.appSlug}`}
                        className="hover:text-primary-ink hover:underline underline-offset-4"
                      >
                        {link.appName}
                      </Link>
                      <span className="font-mono text-xs text-muted-foreground">
                        Code: {link.referralCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{link.label}</span>
                      {link.isDefault ? <Badge variant="secondary">Primary</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{SOCIAL_PLATFORM_LABELS[link.channel]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-foreground hover:underline underline-offset-4"
                    >
                      <span>{link.destinationLabel}</span>
                      <ExternalLink aria-hidden className="size-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="max-w-xs font-mono text-xs">
                    <span className="block truncate select-all">{link.shareUrl}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <CopyValueButton
                      value={link.shareUrl}
                      label="Copy link"
                      toastMessage={`Copied “${link.label}” link.`}
                      ariaLabel={`Copy link for ${link.label} (${link.appName})`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
