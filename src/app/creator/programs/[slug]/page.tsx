import { CircleCheck, MousePointerClick, Plus, UserPlus, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatStrip, StatValue, StatValueSkeleton } from "@/components/layout/stat-strip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatMinorCurrency } from "@/lib/money";
import { requireViewer } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getPaymentMetrics } from "@/modules/payments/queries";
import { CreateLinkDialog } from "@/modules/programs/components/create-link-dialog";
import { CodeAndLink } from "@/modules/programs/components/detail/code-and-link";
import { ProgramHero } from "@/modules/programs/components/detail/program-hero";
import { CustomersCard, CustomersCardSkeleton, TermsCard } from "@/modules/programs/components/detail/side-cards";
import { CardHeading, HomeCard } from "@/modules/programs/components/home/card";
import { earnedInMonth, monthKey, monthLabel, percentOf } from "@/modules/programs/components/home/home-data";
import { HowToPromoteGuide } from "@/modules/programs/components/how-to-promote-guide";
import { linkRows, plural, sortLinkRows } from "@/modules/programs/components/links/link-data";
import { LinkRowsSkeleton, ProgramLinkRows } from "@/modules/programs/components/links/link-rows";
import { type AttributionSummary, loadAttribution } from "@/modules/programs/components/links/load-attribution";
import { type CreatorProgramDetail, getCreatorProgramDetailBySlug } from "@/modules/programs/queries";

export const metadata: Metadata = { title: "Program details" };

type Settled<T> = Promise<T | undefined>;
type Commissions = Awaited<ReturnType<typeof getCommissionWorkspace>>;
type Payments = Awaited<ReturnType<typeof getPaymentMetrics>>;

/** This program's results, started once and awaited only inside each part's <Suspense>. */
type ProgramData = {
  program: CreatorProgramDetail;
  attribution: Settled<AttributionSummary>;
  payments: Settled<Payments>;
  commissions: Settled<Commissions>;
};

const count = new Intl.NumberFormat("en");
const untracked = <StatValue value="—" caption="Tracking unavailable" muted />;
const unavailable = <StatValue value="—" caption="Unavailable" muted />;
const signupsOf = (summary: AttributionSummary) => summary.registrations + summary.code_registrations;

async function ClicksStat({ data }: { data: ProgramData }) {
  const summary = await data.attribution;
  if (!summary) return untracked;
  return <StatValue value={count.format(summary.clicks)} caption={`On ${plural(data.program.links.length, "link")}`} />;
}

async function SignupsStat({ data }: { data: ProgramData }) {
  const summary = await data.attribution;
  if (!summary) return untracked;
  const rate = percentOf(signupsOf(summary), summary.clicks);
  const byCode = `${count.format(summary.code_registrations)} by code`;
  return <StatValue value={count.format(signupsOf(summary))} caption={rate ? `${rate} of clicks · ${byCode}` : byCode} />;
}

async function PayingStat({ data }: { data: ProgramData }) {
  const [payments, summary] = await Promise.all([data.payments, data.attribution]);
  if (!payments) return unavailable;
  const share = summary ? percentOf(payments.paying_customers, signupsOf(summary)) : null;
  return (
    <StatValue
      value={count.format(payments.paying_customers)}
      caption={share ? `${share} of sign-ups` : "Customers who paid"}
    />
  );
}

/** This app's net commission this month, as on the Programs list; a dash until there is some. */
async function EarnedStat({ data }: { data: ProgramData }) {
  const commissions = await data.commissions;
  if (!commissions) return unavailable;
  const month = monthKey(new Date());
  const earned = earnedInMonth(commissions.earnings, month, data.program.appId);
  const caption = monthLabel(month, "long");
  return earned ? (
    <StatValue value={formatMinorCurrency(earned.minor, earned.currency)} caption={caption} />
  ) : (
    <StatValue value="—" caption={caption} muted />
  );
}

function Results({ data }: { data: ProgramData }) {
  const cell = (Value: (props: { data: ProgramData }) => Promise<React.ReactNode>) => (
    <Suspense fallback={<StatValueSkeleton />}>
      <Value data={data} />
    </Suspense>
  );
  return (
    <StatStrip
      ariaLabel={`Results for ${data.program.appName}`}
      cells={[
        { icon: MousePointerClick, label: "Clicks", value: cell(ClicksStat) },
        { icon: UserPlus, label: "Sign-ups", value: cell(SignupsStat) },
        { icon: Users, label: "Paying customers", value: cell(PayingStat) },
        { icon: Wallet, label: "Earned this month", value: cell(EarnedStat) },
      ]}
    />
  );
}

/** Named links by clicks, the primary link last; "—" for results when tracking is unavailable. */
async function LinkList({ data }: { data: ProgramData }) {
  const summary = await data.attribution;
  const sorted = sortLinkRows(linkRows([data.program], summary?.links), "clicks");
  const rows = [...sorted.filter((row) => !row.isDefault), ...sorted.filter((row) => row.isDefault)];
  const hasNamed = rows.some((row) => !row.isDefault);
  return (
    <>
      <ProgramLinkRows rows={rows} />
      {hasNamed ? null : (
        <p className="text-[13px] leading-snug text-muted-foreground">
          One link per place you post shows which one brings customers.
        </p>
      )}
    </>
  );
}

function ProgramLinks({ data }: { data: ProgramData }) {
  const { program } = data;
  return (
    <HomeCard titleId="program-links-heading" className="gap-3">
      <CardHeading
        id="program-links-heading"
        title={`Links for ${program.appName}`}
        note="One per place you post"
        action={
          <CreateLinkDialog
            programs={[
              {
                membershipId: program.membershipId,
                appName: program.appName,
                logoUrl: program.logoUrl,
                availableDestinations: program.availableDestinations,
              },
            ]}
            fixedMembershipId={program.membershipId}
          >
            <Button variant="outline" className="h-10 shrink-0 px-4">
              <Plus data-icon="inline-start" />
              Create link
            </Button>
          </CreateLinkDialog>
        }
      />
      <Suspense fallback={<LinkRowsSkeleton rows={program.links.length || 1} />}>
        <LinkList data={data} />
      </Suspense>
    </HomeCard>
  );
}

async function Customers({ data }: { data: ProgramData }) {
  const payments = await data.payments;
  return <CustomersCard appName={data.program.appName} paying={payments?.paying_customers ?? null} />;
}

/**
 * The program comes first (it decides notFound); its results start right
 * after and stream into their own <Suspense>, so a failed query shows "—"
 * or "Unavailable" in its place only.
 */
export default async function CreatorProgramDetailPage({
  params,
  searchParams,
}: PageProps<"/creator/programs/[slug]">) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);
  const viewer = await requireViewer(`/creator/programs/${encodeURIComponent(slug)}`);
  const program = await getCreatorProgramDetailBySlug(viewer.userId, slug);

  if (!program) notFound();

  const justJoined = rawSearch.joined === "1";
  const data: ProgramData = {
    program,
    attribution: loadAttribution(program.appId),
    payments: settled(() => getPaymentMetrics(program.appId)),
    commissions: settled(() => getCommissionWorkspace()),
  };

  return (
    <div className="flex flex-col gap-7">
      {justJoined ? (
        <Alert>
          <CircleCheck className="text-primary-ink" />
          <AlertTitle>You’ve joined the {program.appName} program</AlertTitle>
          <AlertDescription>
            Your referral code and primary referral link are ready to copy below. Review the quick guide and create named links for each channel you post on.
          </AlertDescription>
        </Alert>
      ) : null}

      <ProgramHero program={program} />
      <Results data={data} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <CodeAndLink program={program} />
          <ProgramLinks data={data} />
          <HowToPromoteGuide
            appName={program.appName}
            attributionWindowDays={program.attributionWindowDays}
            highlighted={justJoined}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <TermsCard program={program} />
          <Suspense fallback={<CustomersCardSkeleton appName={program.appName} />}>
            <Customers data={data} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
