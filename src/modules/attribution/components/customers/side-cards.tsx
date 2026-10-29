import { CreditCard, type LucideIcon, MousePointerClick, UserPlus } from "lucide-react";
import { StatusChip } from "@/components/layout/status-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeading, CardTitle, HomeCard } from "@/modules/programs/components/home/card";
import { percentOf } from "@/modules/programs/components/home/home-data";

const count = new Intl.NumberFormat("en");

/** Null values could not be loaded and show "—". */
export type Funnel = { clicks: number | null; signups: number | null; paying: number | null };

function Step({
  icon: Icon,
  label,
  value,
  share,
}: {
  icon: LucideIcon;
  label: React.ReactNode;
  value: React.ReactNode;
  share?: string | null;
}) {
  return (
    <li className="flex items-center gap-3 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex text-[13px] text-muted-foreground">{label}</span>
        <span className="tabular text-xl leading-tight font-extrabold tracking-[-0.03em]">{value}</span>
      </div>
      {share ? <StatusChip className="tabular">{share}</StatusChip> : null}
    </li>
  );
}

const show = (value: number | null) => (value === null ? "—" : count.format(value));
const share = (part: number | null, whole: number | null, of: string) => {
  const rate = part !== null && whole !== null ? percentOf(part, whole) : null;
  return rate ? `${rate} of ${of}` : null;
};

function FunnelFrame({ note, children }: { note: string; children: React.ReactNode }) {
  return (
    <HomeCard titleId="funnel-heading" className="gap-3">
      <CardHeading id="funnel-heading" title="From click to customer" note={note} />
      {children}
    </HomeCard>
  );
}

/** Clicks, sign-ups and paying customers, each with its share of the step before. */
export function FunnelCard({ funnel, note }: { funnel: Funnel; note: string }) {
  return (
    <FunnelFrame note={note}>
      <ol className="flex flex-col">
        <Step icon={MousePointerClick} label="Clicks" value={show(funnel.clicks)} />
        <Step
          icon={UserPlus}
          label="Sign-ups"
          value={show(funnel.signups)}
          share={share(funnel.signups, funnel.clicks, "clicks")}
        />
        <Step
          icon={CreditCard}
          label="Paying customers"
          value={show(funnel.paying)}
          share={share(funnel.paying, funnel.signups, "sign-ups")}
        />
      </ol>
      {Object.values(funnel).includes(null) ? (
        <p className="text-[13px] text-muted-foreground">Some results are unavailable right now.</p>
      ) : null}
    </FunnelFrame>
  );
}

export function FunnelCardSkeleton({ note }: { note: string }) {
  return (
    <FunnelFrame note={note}>
      <ol aria-hidden className="flex flex-col">
        {[MousePointerClick, UserPlus, CreditCard].map((Icon, index) => (
          <Step
            key={index}
            icon={Icon}
            label={<Skeleton className="my-1 h-3 w-14" />}
            value={<Skeleton className="my-1 h-5 w-16" />}
          />
        ))}
      </ol>
    </FunnelFrame>
  );
}

const RULES = [
  "A customer is someone who signed up through your link or code.",
  "You earn when they pay. Trials and €0 payments don't count.",
  "Full refunds and lost disputes are taken off your earnings.",
  "You see an ID, never names or emails.",
];

export function WhatCounts() {
  return (
    <HomeCard titleId="what-counts-heading" className="gap-3">
      <CardTitle id="what-counts-heading">What counts</CardTitle>
      <ul className="flex flex-col gap-2.5 text-[13px] leading-normal text-muted-foreground">
        {RULES.map((rule) => (
          <li key={rule} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
            {rule}
          </li>
        ))}
      </ul>
    </HomeCard>
  );
}
