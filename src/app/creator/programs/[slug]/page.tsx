import { ArrowLeft, CircleCheck, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  formatCommissionPercent,
  formatCommissionRange,
  formatMinorCurrency,
} from "@/lib/money";
import { SOCIAL_PLATFORM_LABELS } from "@/modules/accounts/social";
import { requireViewer } from "@/modules/accounts/viewer";
import {
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVAL_SUFFIX,
} from "@/modules/catalog/constants";
import {
  CopyableField,
  CopyValueButton,
} from "@/modules/programs/components/copy-value-button";
import { CreateReferralLinkForm } from "@/modules/programs/components/create-referral-link-form";
import { HowToPromoteGuide } from "@/modules/programs/components/how-to-promote-guide";
import { getCreatorProgramDetailBySlug } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Program details" };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default async function CreatorProgramDetailPage({
  params,
  searchParams,
}: PageProps<"/creator/programs/[slug]">) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const viewer = await requireViewer(`/creator/programs/${encodeURIComponent(slug)}`);
  const program = await getCreatorProgramDetailBySlug(viewer.userId, slug);

  if (!program) notFound();

  const justJoined = rawSearch.joined === "1";

  return (
    <>
      <div className="mb-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2.5 text-muted-foreground">
          <Link href="/creator/programs">
            <ArrowLeft data-icon="inline-start" />
            My programs
          </Link>
        </Button>
      </div>

      <PageHeader
        title={program.appName}
        description={`${program.organizationName} · ${formatCommissionRange(
          program.minCommissionBps,
          program.maxCommissionBps,
        )}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/apps/${program.slug}`}>
              Public listing
              <ExternalLink data-icon="inline-end" />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-8">
        {justJoined ? (
          <Alert>
            <CircleCheck className="text-primary-ink" />
            <AlertTitle>You’ve joined the {program.appName} program</AlertTitle>
            <AlertDescription>
              Your referral code and primary referral link are ready to copy below. Review the quick guide and create named links for each channel you post on.
            </AlertDescription>
          </Alert>
        ) : null}

        <HowToPromoteGuide
          appName={program.appName}
          attributionWindowDays={program.attributionWindowDays}
          highlighted={justJoined}
        />

        <Card>
          <CardHeader>
            <CardTitle>Your referral code & primary link</CardTitle>
            <CardDescription>
              Use your link for web sign-ups and your code when viewers install {program.appName} on mobile or enter a code at registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <CopyableField
              label="Referral code (tied to your account & this app)"
              value={program.referralCode}
              copyLabel="Copy code"
              toastMessage="Referral code copied."
              hint="Customers can enter this code during registration without clicking a link."
            />

            {program.defaultLink ? (
              <CopyableField
                label={`Primary referral link (${program.defaultLink.destinationLabel})`}
                value={program.defaultLink.shareUrl}
                copyLabel="Copy link"
                toastMessage="Referral link copied."
                hint={`Redirects to ${program.defaultLink.targetUrl}`}
              />
            ) : null}
          </CardContent>
        </Card>

        <section aria-labelledby="named-links-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="named-links-heading" className="text-lg font-semibold">
              Named links for {program.appName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a separate link for each placement (for example “Instagram bio”, “TikTok”, or “Video 1”) so you can compare their performance.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create a named link</CardTitle>
              <CardDescription>
                Choose a label, channel, and one of {program.appName}’s verified destinations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateReferralLinkForm
                programs={[
                  {
                    membershipId: program.membershipId,
                    appName: program.appName,
                    availableDestinations: program.availableDestinations,
                  },
                ]}
                fixedMembershipId={program.membershipId}
                defaultChannel={program.defaultLink?.channel ?? "instagram"}
              />
            </CardContent>
          </Card>

          {/* Phones: one tile per link with the full URL, so it stays readable and copyable. */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {program.links.map((link) => (
              <li key={link.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{link.label}</span>
                  {link.isDefault ? <Badge variant="secondary">Primary</Badge> : null}
                  <Badge variant="outline">{SOCIAL_PLATFORM_LABELS[link.channel]}</Badge>
                </div>
                <span className="font-mono text-xs break-all select-all">{link.shareUrl}</span>
                <a
                  href={link.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Opens {link.destinationLabel}
                  <ExternalLink aria-hidden className="size-3 shrink-0" />
                </a>
                <CopyValueButton
                  value={link.shareUrl}
                  label="Copy link"
                  toastMessage={`Copied “${link.label}” link.`}
                  ariaLabel={`Copy link for ${link.label}`}
                  className="w-full"
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>App destination</TableHead>
                  <TableHead>Referral URL</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {program.links.map((link) => (
                  <TableRow key={link.id}>
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
                        ariaLabel={`Copy link for ${link.label}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section aria-labelledby="terms-snapshot-heading" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 id="terms-snapshot-heading" className="text-lg font-semibold">
                Accepted commission terms & plan rates
              </h2>
              <p className="text-sm text-muted-foreground">
                Joined on {dateFormat.format(new Date(program.joinedAt))} ·{" "}
                {program.attributionWindowDays}-day attribution window.
              </p>
            </div>
            <Badge variant="secondary" className="tabular">
              Accepted Terms v{program.acceptedTermsVersionNumber}
            </Badge>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="hidden sm:table-cell">Billing cycle</TableHead>
                  <TableHead className="text-right">
                    <span className="sm:hidden">Price</span>
                    <span className="hidden sm:inline">Subscription price</span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="sm:hidden">Yours</span>
                    <span className="hidden sm:inline">Your commission</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {program.plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.planName}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {BILLING_INTERVAL_LABELS[plan.billingInterval]}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatMinorCurrency(plan.priceMinor, plan.currency)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="tabular inline-flex rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                        {formatCommissionPercent(plan.commissionBps)}
                        <span className="hidden sm:inline">&nbsp;recurring</span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program rules</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {program.termsText}
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
