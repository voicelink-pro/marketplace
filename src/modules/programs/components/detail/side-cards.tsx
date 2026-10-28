import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCommissionRange, formatMinorCurrency } from "@/lib/money";
import { PerCustomerNote, perCustomerMinor } from "@/modules/catalog/components/plan-rates";
import { BILLING_INTERVAL_SUFFIX } from "@/modules/catalog/constants";
import type { CreatorProgramDetail } from "../../queries";
import { CardHeading, CardLink, CardTitle, HomeCard } from "../home/card";
import { plural } from "../links/link-data";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/** The accepted terms version: what each plan pays per customer, the window and the full rules. */
export function TermsCard({ program }: { program: CreatorProgramDetail }) {
  return (
    <HomeCard titleId="terms-heading" className="gap-3.5">
      <CardHeading
        id="terms-heading"
        title="Your terms"
        note={`Terms v${program.acceptedTermsVersionNumber} · accepted ${dateFormat.format(new Date(program.joinedAt))}`}
      />
      {program.plans.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {program.plans.map((plan) => (
            <li key={plan.id} className="flex flex-col gap-1 rounded-[14px] border bg-background p-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="min-w-0 font-bold">{plan.planName}</span>
                <span className="tabular text-muted-foreground">
                  {formatMinorCurrency(plan.priceMinor, plan.currency)} {BILLING_INTERVAL_SUFFIX[plan.billingInterval]}
                </span>
              </div>
              <span className="tabular text-[13px] text-muted-foreground">
                You earn{" "}
                <b className="text-foreground">{formatMinorCurrency(perCustomerMinor(plan), plan.currency)}</b> every{" "}
                {plan.billingInterval} per customer
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="flex flex-col text-sm">
        <div className="flex justify-between gap-3 border-t py-2.5">
          <dt className="text-muted-foreground">Commission</dt>
          <dd className="tabular text-right font-bold">
            {formatCommissionRange(program.minCommissionBps, program.maxCommissionBps)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t py-2.5">
          <dt className="text-muted-foreground">Attribution window</dt>
          <dd className="tabular font-bold">{plural(program.attributionWindowDays, "day")}</dd>
        </div>
      </dl>
      <PerCustomerNote className="leading-snug" />
      <Collapsible className="flex flex-col gap-2.5">
        <CollapsibleTrigger className="group/rules inline-flex items-center gap-1 self-start rounded-md text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
          Full program rules
          <ChevronDown aria-hidden className="size-3.5 transition-transform group-data-[state=open]/rules:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="text-[13px] leading-relaxed whitespace-pre-line text-muted-foreground">
          {program.termsText}
        </CollapsibleContent>
      </Collapsible>
    </HomeCard>
  );
}

const count = new Intl.NumberFormat("en");

function CustomersFrame({ appName, busy, children }: { appName: string; busy?: boolean; children: React.ReactNode }) {
  return (
    <HomeCard titleId="program-customers-heading" busy={busy} className="gap-2.5">
      <CardTitle id="program-customers-heading">Customers from {appName}</CardTitle>
      {children}
      <CardLink href="/creator/referrals" className="self-start">
        View customers
      </CardLink>
    </HomeCard>
  );
}

/** Paying customers through this program; null when the query failed. */
export function CustomersCard({ appName, paying }: { appName: string; paying: number | null }) {
  return (
    <CustomersFrame appName={appName}>
      <span className="tabular text-[2rem] leading-none font-extrabold tracking-[-0.04em]">
        {paying === null ? "—" : count.format(paying)}
      </span>
      <span className="text-[13px] text-muted-foreground">
        {paying === null
          ? "Unavailable"
          : "Paid at least once. Each one’s sign-up and payments are on the Customers page."}
      </span>
    </CustomersFrame>
  );
}

export function CustomersCardSkeleton({ appName }: { appName: string }) {
  return (
    <CustomersFrame appName={appName} busy>
      <span className="flex h-8 items-center">
        <Skeleton className="h-7 w-12" />
      </span>
      <span className="flex h-5 items-center">
        <Skeleton className="h-3 w-48 max-w-full" />
      </span>
    </CustomersFrame>
  );
}
