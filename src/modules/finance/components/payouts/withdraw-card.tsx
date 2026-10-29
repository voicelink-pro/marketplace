import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { StatusChip } from "@/components/layout/status-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CardHeading, CardTitle, HOME_CARD, HomeCard } from "@/modules/programs/components/home/card";
import { OnboardingButton, WithdrawForm } from "../finance-forms";
import { type PayoutAccount, withdrawState } from "./payout-data";

const eur = (minor: bigint | string) => formatMinorCurrency(minor, "EUR");
const TITLE_ID = "withdraw-heading";

function WithdrawFrame({ children, busy }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <section
      aria-labelledby={TITLE_ID}
      aria-busy={busy || undefined}
      className={cn(HOME_CARD, "flex min-w-0 flex-col gap-4 p-5 sm:gap-[18px] sm:p-7 lg:col-span-2")}
    >
      <h2 id={TITLE_ID} className="text-[13px] font-semibold tracking-normal text-muted-foreground">
        Available to withdraw
      </h2>
      {children}
    </section>
  );
}

/**
 * The test provider pays out EUR only; other currencies are listed but not
 * withdrawable. The form stays visible but disabled, with the reason.
 */
export function WithdrawCard({
  available,
  account,
  requestKey,
}: {
  available: { currency: string; available_minor: string }[];
  account: PayoutAccount;
  requestKey: string;
}) {
  const amount = available.find((row) => row.currency === "EUR")?.available_minor ?? "0";
  const fee = account?.fee_minor ?? "0";
  const state = withdrawState(amount, account);
  const minimum = account ? eur(account.minimum_minor) : null;
  let helper = `Only funded earnings from closed months.${minimum ? ` Minimum ${minimum}.` : ""}`;
  if (!state.eligible) {
    helper = {
      no_account: "Set up your payout account first.",
      nothing_available: "Nothing to withdraw yet. Earnings become available once their month closes and the app funds them.",
      below_minimum: `After the provider fee this is below the ${minimum} minimum.`,
    }[state.reason];
  }
  return (
    <WithdrawFrame>
      <span className="tabular text-[2.5rem] leading-none font-extrabold tracking-[-0.045em] sm:text-5xl">{eur(amount)}</span>
      {available
        .filter((row) => row.currency !== "EUR")
        .map((row) => (
          <span key={row.currency} className="tabular text-[13px] text-muted-foreground">
            {formatMinorCurrency(row.available_minor, row.currency)} in {row.currency} is not supported by the test provider.
          </span>
        ))}
      <dl className="tabular flex flex-col rounded-[14px] border bg-background px-4 py-1 text-sm">
        <div className="flex justify-between gap-3 py-2.5">
          <dt className="text-muted-foreground">Provider fee</dt>
          <dd className="font-bold text-muted-foreground">−{eur(fee)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t py-2.5">
          <dt className="text-muted-foreground">To your bank</dt>
          <dd className="text-lg font-extrabold">{eur(state.bank)}</dd>
        </div>
      </dl>
      <WithdrawForm amount={amount} fee={fee} requestKey={requestKey} enabled={state.eligible} helper={helper} />
    </WithdrawFrame>
  );
}

export function WithdrawUnavailable() {
  return (
    <WithdrawFrame>
      <span className="text-[2.5rem] leading-none font-extrabold text-muted-foreground sm:text-5xl">—</span>
      <span className="text-[13px] text-muted-foreground">Payouts are unavailable right now.</span>
    </WithdrawFrame>
  );
}

export function WithdrawSkeleton() {
  return (
    <WithdrawFrame busy>
      <Skeleton className="h-10 w-40 sm:h-12" />
      <Skeleton className="h-[94px] rounded-[14px]" />
      <Skeleton className="h-5 w-full max-w-md" />
      <div className="flex justify-end">
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>
    </WithdrawFrame>
  );
}

/** Account state and the provider's terms; bank details stay with the provider. */
export function PayoutAccountCard({
  account,
  sessions,
}: {
  account: PayoutAccount;
  sessions: { id: string }[];
}) {
  const active = !!account?.enabled;
  return (
    <HomeCard titleId="account-heading" className="gap-3">
      <CardHeading
        id="account-heading"
        title="Payout account"
        action={
          active ? (
            <StatusChip tone="neutral" dot>
              Active
            </StatusChip>
          ) : (
            <StatusChip tone="muted">Not set up</StatusChip>
          )
        }
      />
      {account ? (
        <dl className="tabular flex flex-col text-sm">
          {[
            ["Currency", account.currency],
            ["Minimum payout", formatMinorCurrency(account.minimum_minor, account.currency)],
            ["Provider fee", formatMinorCurrency(account.fee_minor, account.currency)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-t py-2.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="text-[13px] text-muted-foreground">
        Bank and identity details live with the payment provider, not on BoostLink.
      </p>
      {active ? null : <OnboardingButton kind="payout" />}
      {sessions.map((session) => (
        <Link
          key={session.id}
          href={`/sandbox/finance/${session.id}`}
          className="inline-flex items-center gap-1.5 self-start rounded-md text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Continue setup
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      ))}
    </HomeCard>
  );
}

export function PayoutAccountSkeleton() {
  return (
    <HomeCard titleId="account-heading" busy className="gap-3">
      <CardTitle id="account-heading">Payout account</CardTitle>
      <Skeleton className="h-28 rounded-[14px]" />
    </HomeCard>
  );
}

const STEPS = [
  "We send it to the provider (platform transfer).",
  "The provider pays your bank (bank payout).",
  "If the bank step fails, the money waits and you can retry up to 3 times.",
];

export function HowPayoutWorks() {
  return (
    <HomeCard titleId="how-payout-heading" className="gap-3">
      <CardTitle id="how-payout-heading">How a payout works</CardTitle>
      <ul className="flex flex-col gap-2.5 text-[13px] leading-normal text-muted-foreground">
        {STEPS.map((step) => (
          <li key={step} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
            {step}
          </li>
        ))}
      </ul>
    </HomeCard>
  );
}
