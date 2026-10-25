import { ArrowRight, Check, Megaphone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange } from "@/lib/money";
import { getViewer } from "@/modules/accounts/viewer";
import { CopyableField } from "@/modules/programs/components/copy-value-button";
import { JoinProgramForm } from "@/modules/programs/components/join-program-form";
import { getCreatorMembershipForApp } from "@/modules/programs/queries";
import type { PublishedAppDetail } from "../queries";

async function PromoteCtaActions({ app }: { app: PublishedAppDetail }) {
  const targetPath = `/apps/${app.slug}`;
  const encodedNext = encodeURIComponent(targetPath);

  const viewer = await getViewer();

  if (!viewer) {
    return (
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full">
          <Link href={`/login?next=${encodedNext}`}>
            <Megaphone data-icon="inline-start" />
            Promote this app
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href={`/signup?next=${encodedNext}`}>Create a creator account</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Log in or create an account to join this program and get your referral link and code.
        </p>
      </div>
    );
  }

  const hasSocialProfile = (viewer.creator?.socialLinkCount ?? 0) > 0;
  if (!hasSocialProfile) {
    return (
      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full">
          <Link href={`/onboarding/creator?next=${encodedNext}`}>
            <Megaphone data-icon="inline-start" />
            Add your social profile to promote
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Add at least one social profile link before joining a program.
        </p>
      </div>
    );
  }

  const existingMembership = await getCreatorMembershipForApp(viewer.userId, app.appId);
  if (existingMembership) {
    return (
      <div className="flex flex-col gap-4 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Your program status</span>
          <Badge variant="secondary">Joined</Badge>
        </div>

        <CopyableField
          label="Your referral code"
          value={existingMembership.referralCode}
          copyLabel="Copy code"
          toastMessage="Referral code copied."
        />

        {existingMembership.defaultLink ? (
          <CopyableField
            label="Primary referral link"
            value={existingMembership.defaultLink.shareUrl}
            copyLabel="Copy link"
            toastMessage="Referral link copied."
          />
        ) : null}

        <Button asChild size="lg" className="w-full">
          <Link href={`/creator/programs/${app.slug}`}>
            Open program & named links
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <JoinProgramForm
      appId={app.appId}
      appSlug={app.slug}
      appName={app.name}
      termsVersionId={app.termsVersionId}
      termsVersionNumber={app.termsVersionNumber}
    />
  );
}

export function PromoteCtaCard({ app }: { app: PublishedAppDetail }) {
  const commissionLabel = formatCommissionRange(app.minCommissionBps, app.maxCommissionBps);
  const variesByPlan = app.minCommissionBps !== app.maxCommissionBps;

  return (
    <Card className="border-primary/25">
      <CardHeader className="gap-2">
        <div className="text-xs font-medium text-muted-foreground">Creator commission</div>
        <CardTitle className="tabular text-2xl font-semibold text-primary sm:text-3xl">
          {commissionLabel}
        </CardTitle>
        <CardDescription>
          {variesByPlan
            ? "Rate depends on the subscription plan the customer chooses. See the full plan table below."
            : "Same commission rate across all listed subscription plans."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <ul className="flex flex-col gap-2.5 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Recurring commission for as long as the referred customer keeps paying</span>
          </li>
          <li className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{app.attributionWindowDays}-day attribution window from link click to sign-up</span>
          </li>
          <li className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Instant program access — no manual approval from the company</span>
          </li>
        </ul>

        <Suspense fallback={<Skeleton className="h-28 w-full rounded-lg" />}>
          <PromoteCtaActions app={app} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
