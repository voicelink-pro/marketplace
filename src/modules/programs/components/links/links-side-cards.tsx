import Link from "next/link";
import { Suspense } from "react";
import { AppLogo } from "@/modules/catalog/components/app-card";
import type { CreatorProgramSummary } from "../../queries";
import { CopyValueButton } from "../copy-value-button";
import { CardHeading, CardTitle, HomeCard } from "../home/card";
import { plural, windowPhrase } from "./link-data";
import { loadAttribution } from "./load-attribution";

/** "{app} · {n} sign-ups" from this app's code sign-ups; just the app while loading or without tracking. */
async function CodeSignups({ appId, appName }: { appId: string; appName: string }) {
  const summary = await loadAttribution(appId);
  if (!summary) return appName;
  return `${appName} · ${plural(summary.code_registrations, "sign-up")}`;
}

/** One code per program, for viewers who install from an app store. */
export function ReferralCodes({
  programs,
}: {
  programs: Pick<CreatorProgramSummary, "appId" | "appName" | "logoUrl" | "referralCode" | "membershipId">[];
}) {
  return (
    <HomeCard titleId="codes-heading" className="gap-3">
      <CardHeading id="codes-heading" title="Your referral codes" note="For viewers who install from an app store" />
      <ul className="flex flex-col gap-2.5">
        {programs.map((program) => (
          <li
            key={program.membershipId}
            className="flex min-w-0 items-center gap-3 rounded-[14px] border bg-background p-3"
          >
            <AppLogo app={{ name: program.appName, logoUrl: program.logoUrl }} className="size-8 rounded-[9px] text-sm" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-mono text-sm font-bold">{program.referralCode}</span>
              <span className="tabular truncate text-xs text-muted-foreground">
                <Suspense fallback={program.appName}>
                  <CodeSignups appId={program.appId} appName={program.appName} />
                </Suspense>
              </span>
            </div>
            <CopyValueButton
              value={program.referralCode}
              size="icon"
              variant="secondary"
              ariaLabel={`Copy ${program.appName} code`}
              toastMessage="Referral code copied."
              className="size-8 shrink-0"
            />
          </li>
        ))}
      </ul>
    </HomeCard>
  );
}

const LINK = "font-semibold text-foreground underline-offset-4 hover:underline";

/** The attribution rules in three lines; the window comes from the programs' terms. */
export function CountingRules({ windowDays }: { windowDays: number[] }) {
  const rules = [
    `The last link clicked within ${windowPhrase(windowDays)} gets the sign-up.`,
    "A code typed at sign-up wins over a click.",
    "Clicks count visits, not unique people.",
  ];
  return (
    <HomeCard titleId="counting-heading" className="gap-3">
      <CardTitle id="counting-heading">How sign-ups are counted</CardTitle>
      <ul className="flex flex-col gap-2.5 text-[13px] leading-normal text-muted-foreground">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
            {rule}
          </li>
        ))}
      </ul>
      <p className="text-[13px] leading-normal text-muted-foreground">
        Paying customers and earnings are on{" "}
        <Link href="/creator/referrals" className={LINK}>
          Customers
        </Link>{" "}
        and{" "}
        <Link href="/creator/earnings" className={LINK}>
          Earnings
        </Link>
        .
      </p>
    </HomeCard>
  );
}
