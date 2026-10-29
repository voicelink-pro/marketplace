import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeading, CardLink, HomeCard, Unavailable } from "./card";

const TITLE_ID = "balance-heading";

function Frame({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return (
    <HomeCard titleId={TITLE_ID} busy={busy} className="gap-3.5">
      <CardHeading id={TITLE_ID} title="Balance" action={<CardLink href="/creator/payouts">Payouts</CardLink>} />
      {children}
    </HomeCard>
  );
}

function Row({ label, note, values }: { label: string; note?: string; values: string[] }) {
  return (
    <div className="flex justify-between gap-3 border-t py-2.5 text-sm">
      <dt className="flex flex-col">
        <span className="text-muted-foreground">{label}</span>
        {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
      </dt>
      <dd className="tabular flex flex-col items-end font-bold">
        {values.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </dd>
    </div>
  );
}

/** Replaces the old "How you get paid" card while there is no money yet; Earnings shows it before the first one. */
export function HowPayoutsWork() {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border bg-background p-3 text-[13px] leading-5 text-muted-foreground">
      <span className="font-bold text-foreground">How payouts work</span>
      <span>1 · You earn on every renewal.</span>
      <span>2 · It unlocks when the month closes.</span>
      <span>3 · Withdraw it on the Payouts page.</span>
    </div>
  );
}

/**
 * Amounts are formatted per currency, never summed across currencies.
 * `withdraw` is the available amount when it is above zero.
 */
export function BalanceCard({
  available,
  otherAvailable,
  pending,
  unlockMonth,
  paid,
  withdraw,
  empty,
}: {
  available: string;
  otherAvailable: string[];
  pending: string[];
  unlockMonth: string;
  paid: string[];
  withdraw: string | null;
  /** Nothing available, pending or paid yet. */
  empty: boolean;
}) {
  return (
    <Frame>
      <div className="flex flex-col gap-0.5">
        <span className="tabular text-[1.75rem] leading-tight font-extrabold tracking-[-0.04em] sm:text-[2rem]">
          {available}
        </span>
        <span className="text-[13px] leading-5 text-muted-foreground">
          Available to withdraw{otherAvailable.length > 0 ? ` · also ${otherAvailable.join(" · ")}` : ""}
        </span>
      </div>
      <dl className="flex flex-col">
        <Row label="Pending this month" note={`Unlocks after ${unlockMonth} closes`} values={pending} />
        <Row label="Paid out so far" values={paid} />
      </dl>
      <div className="flex-1" />
      {withdraw ? (
        <Button asChild variant="outline" className="h-10.5 rounded-full font-bold">
          <Link href="/creator/payouts">Withdraw {withdraw}</Link>
        </Button>
      ) : null}
      {empty ? <HowPayoutsWork /> : null}
    </Frame>
  );
}

export function BalanceUnavailable() {
  return (
    <Frame>
      <Unavailable />
    </Frame>
  );
}

/** Amount, caption and the two rows: the parts every state has. */
export function BalanceSkeleton() {
  return (
    <Frame busy>
      <div className="flex flex-col gap-0.5">
        <span className="flex h-[2.1875rem] items-center sm:h-10">
          <Skeleton className="h-7 w-28" />
        </span>
        <span className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-36" />
        </span>
      </div>
      {/* The rows' line boxes: "Pending this month" has its note line. */}
      <div className="flex flex-col">
        <div className="flex justify-between gap-3 border-t py-2.5">
          <span className="flex flex-col">
            <span className="flex h-5 items-center">
              <Skeleton className="h-4 w-32" />
            </span>
            <span className="flex h-4 items-center">
              <Skeleton className="h-3 w-40" />
            </span>
          </span>
          <span className="flex h-5 items-center">
            <Skeleton className="h-4 w-14" />
          </span>
        </div>
        <div className="flex justify-between gap-3 border-t py-2.5">
          <span className="flex h-5 items-center">
            <Skeleton className="h-4 w-28" />
          </span>
          <span className="flex h-5 items-center">
            <Skeleton className="h-4 w-14" />
          </span>
        </div>
      </div>
    </Frame>
  );
}
