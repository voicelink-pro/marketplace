import { ArrowRight, ExternalLink, Layers, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCommissionRange } from "@/lib/money";
import { requireViewer } from "@/modules/accounts/viewer";
import { APP_CATEGORY_LABELS, APP_PLATFORM_LABELS } from "@/modules/catalog/constants";
import { CopyableField } from "@/modules/programs/components/copy-value-button";
import { listCreatorProgramMemberships } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "My programs" };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default async function CreatorProgramsPage() {
  const viewer = await requireViewer("/creator/programs");
  const programs = await listCreatorProgramMemberships(viewer.userId);

  return (
    <>
      <PageHeader
        title="My programs"
        description="Apps you promote, with your referral codes, links and accepted commission terms."
        actions={
          <Button asChild>
            <Link href="/">
              <Plus data-icon="inline-start" />
              Find another app
            </Link>
          </Button>
        }
      />

      {programs.length === 0 ? (
        <EmptyModule
          icon={Layers}
          title="You haven’t joined a program yet"
          description="Programs you join appear here immediately with your referral link, referral code, and commission terms."
        >
          <Button asChild variant="outline">
            <Link href="/">Browse apps</Link>
          </Button>
        </EmptyModule>
      ) : (
        <div className="flex flex-col gap-5">
          {programs.map((program) => (
            <Card key={program.membershipId}>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5">
                    {program.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={program.logoUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-xl border bg-background object-contain"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
                        {program.appName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-lg">
                        <Link
                          href={`/creator/programs/${program.slug}`}
                          className="hover:text-primary hover:underline underline-offset-4"
                        >
                          {program.appName}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {program.organizationName} · Joined{" "}
                        {dateFormat.format(new Date(program.joinedAt))}
                      </CardDescription>
                    </div>
                  </div>

                  <CardAction className="flex flex-wrap items-center gap-2">
                    <span className="tabular rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {formatCommissionRange(
                        program.minCommissionBps,
                        program.maxCommissionBps,
                      )}
                    </span>
                    <Badge variant="secondary" className="tabular">
                      Terms v{program.acceptedTermsVersionNumber}
                    </Badge>
                  </CardAction>
                </div>

                <p className="text-sm text-muted-foreground">{program.tagline}</p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {program.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {APP_CATEGORY_LABELS[category]}
                    </Badge>
                  ))}
                  {program.platforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {APP_PLATFORM_LABELS[platform]}
                    </Badge>
                  ))}
                  <span className="tabular pl-1 text-xs text-muted-foreground">
                    · {program.attributionWindowDays}-day attribution window
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 border-t pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <CopyableField
                    label="Your referral code"
                    value={program.referralCode}
                    copyLabel="Copy code"
                    toastMessage="Referral code copied."
                  />

                  {program.defaultLink ? (
                    <CopyableField
                      label={`Primary link (${program.defaultLink.label})`}
                      value={program.defaultLink.shareUrl}
                      copyLabel="Copy link"
                      toastMessage="Referral link copied."
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <span className="tabular text-xs text-muted-foreground">
                    {program.links.length}{" "}
                    {program.links.length === 1 ? "named link" : "named links"} created
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/apps/${program.slug}`}>
                        Public listing
                        <ExternalLink data-icon="inline-end" />
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/creator/programs/${program.slug}`}>
                        Program details & links
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
