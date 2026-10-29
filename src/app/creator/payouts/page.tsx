import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EarningsTabs } from "@/components/layout/earnings-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { settled } from "@/modules/attribution/components/result-metrics";
import { CreatorPayoutHistory, PayoutHistorySkeleton } from "@/modules/finance/components/payouts/payout-history";
import { TestModeNote } from "@/modules/finance/components/payouts/test-mode-note";
import {
  HowPayoutWorks,
  PayoutAccountCard,
  PayoutAccountSkeleton,
  WithdrawCard,
  WithdrawSkeleton,
  WithdrawUnavailable,
} from "@/modules/finance/components/payouts/withdraw-card";
import { getFinanceWorkspace } from "@/modules/finance/queries";

export const metadata: Metadata = { title: "Payouts" };

const DESCRIPTION = "Withdraw what's available and follow it to your bank.";

type Finance = Awaited<ReturnType<typeof getFinanceWorkspace>>;

/** One workspace read feeds every card, so they arrive together. */
async function PayoutsBody({ finance }: { finance: Promise<Finance | undefined> }) {
  const data = await finance;
  if (!data) {
    return (
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <WithdrawUnavailable />
        <HowPayoutWorks />
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        {/* One request key per render: submitting the same form twice requests one payout. */}
        <WithdrawCard available={data.available} account={data.payout_account} requestKey={randomUUID()} />
        <div className="flex min-w-0 flex-col gap-4">
          <PayoutAccountCard
            account={data.payout_account}
            sessions={data.onboarding.filter((session) => session.kind === "payout")}
          />
          <HowPayoutWorks />
        </div>
      </div>
      <CreatorPayoutHistory payouts={data.payouts} events={data.events} />
    </>
  );
}

function PayoutsSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <WithdrawSkeleton />
        <div className="flex min-w-0 flex-col gap-4">
          <PayoutAccountSkeleton />
          <HowPayoutWorks />
        </div>
      </div>
      <PayoutHistorySkeleton />
    </>
  );
}

/** Synchronous: the workspace read starts here and is awaited inside <Suspense>. */
export default function CreatorPayoutsPage() {
  const finance = settled(() => getFinanceWorkspace());
  return (
    <>
      <PageHeader title="Payouts" description={DESCRIPTION} actions={<EarningsTabs />} />
      <div className="flex flex-col gap-6">
        <TestModeNote>Test mode. Payouts use the BoostLink test provider and no real money moves.</TestModeNote>
        <Suspense fallback={<PayoutsSkeleton />}>
          <PayoutsBody finance={finance} />
        </Suspense>
      </div>
    </>
  );
}
