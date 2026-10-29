import { KeyRound, Link2, Users } from "lucide-react";
import Link from "next/link";
import { StatusChip } from "@/components/layout/status-chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { pluralWord } from "@/modules/programs/components/links/link-data";
import type { CustomerEarnings } from "./customer-data";

export type CustomerRow = {
  id: string;
  code: string;
  appName: string;
  logoUrl: string | null;
  source: string;
  signedUp: string;
  /** Undefined when the earnings could not be loaded. */
  earnings: CustomerEarnings | undefined;
};

const count = new Intl.NumberFormat("en");
const FOCUS = "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function paymentsText(earnings: CustomerEarnings | undefined): string {
  if (earnings?.payments == null) return "—";
  return `${count.format(earnings.payments)}${earnings.partial && earnings.payments > 0 ? "+" : ""}`;
}

/** Net commission per currency, largest first; a dash before the first payment. */
function earnedText(earnings: CustomerEarnings | undefined): string {
  if (!earnings?.earned?.length) return "—";
  return earnings.earned.map((amount) => formatMinorCurrency(amount.minor, amount.currency)).join(" · ");
}

function SourceChip({ source }: { source: string }) {
  return source === "code" ? (
    <StatusChip>
      <KeyRound aria-hidden />
      Code
    </StatusChip>
  ) : (
    <StatusChip>
      <Link2 aria-hidden />
      Link
    </StatusChip>
  );
}

/**
 * "Paid" once a payment earned you commission; never "Paying" or "Active":
 * an earning says they paid, not that they still do.
 */
function StatusCell({ earnings }: { earnings: CustomerEarnings | undefined }) {
  if (earnings?.payments == null) {
    return (
      <span className="text-muted-foreground">
        —<span className="sr-only">Status unknown</span>
      </span>
    );
  }
  return earnings.payments > 0 ? (
    <StatusChip tone="neutral" dot>
      Paid
    </StatusChip>
  ) : (
    <StatusChip tone="muted">No payment yet</StatusChip>
  );
}

function CustomerLink({ row, className }: { row: CustomerRow; className?: string }) {
  return (
    <Link
      href={`/creator/referrals/${row.id}`}
      aria-label={`Customer ${row.code}`}
      className={cn(FOCUS, "font-mono font-bold underline-offset-4 hover:underline", className)}
    >
      {row.code}
    </Link>
  );
}

function ProgramName({ row }: { row: CustomerRow }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <AppLogo
        app={{ name: row.appName, logoUrl: row.logoUrl }}
        className="size-5 rounded-[6px] border-0 text-[11px]"
      />
      <span className="truncate">{row.appName}</span>
    </span>
  );
}

const TH = "pb-2.5 pr-3 text-left text-xs font-semibold whitespace-nowrap text-muted-foreground last:pr-0";
const TD = "border-t py-3 pr-3 align-middle whitespace-nowrap last:pr-0";

/** From `sm`: one row per customer. The Program column is left out when one program is selected. */
function CustomerTable({ rows, withProgram }: { rows: CustomerRow[]; withProgram: boolean }) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="tabular w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Customer
            </th>
            {withProgram ? (
              <th scope="col" className={TH}>
                Program
              </th>
            ) : null}
            <th scope="col" className={TH}>
              Source
            </th>
            <th scope="col" className={TH}>
              Signed up
            </th>
            <th scope="col" className={cn(TH, "text-right")}>
              Payments
            </th>
            <th scope="col" className={cn(TH, "text-right")}>
              You earned
            </th>
            <th scope="col" className={cn(TH, "text-right")}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const earned = earnedText(row.earnings);
            return (
              <tr key={row.id}>
                <td className={TD}>
                  <CustomerLink row={row} />
                </td>
                {withProgram ? (
                  <td className={cn(TD, "max-w-40")}>
                    <ProgramName row={row} />
                  </td>
                ) : null}
                <td className={TD}>
                  <SourceChip source={row.source} />
                </td>
                <td className={cn(TD, "text-muted-foreground")}>{row.signedUp}</td>
                <td className={cn(TD, "text-right")}>{paymentsText(row.earnings)}</td>
                <td className={cn(TD, "text-right font-bold", earned === "—" && "text-muted-foreground")}>{earned}</td>
                <td className={cn(TD, "text-right")}>
                  <span className="inline-flex justify-end">
                    <StatusCell earnings={row.earnings} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Phones: one card per customer, as in customers-phone.html. */
function CustomerCards({ rows }: { rows: CustomerRow[] }) {
  return (
    <ul className="flex flex-col gap-3 sm:hidden">
      {rows.map((row) => {
        const payments = row.earnings?.payments;
        const earned = earnedText(row.earnings);
        return (
          <li key={row.id} className="tabular flex min-w-0 flex-col gap-2.5 rounded-[20px] border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <CustomerLink row={row} className="text-[15px]" />
              <StatusCell earnings={row.earnings} />
            </div>
            <div className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
              <ProgramName row={row} />
              <span aria-hidden>·</span>
              <span className="shrink-0">{row.signedUp}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-2.5">
              <SourceChip source={row.source} />
              <span className="truncate text-[13px] text-muted-foreground">
                {paymentsText(row.earnings)} {pluralWord(payments ?? 0, "payment")} ·{" "}
                <b className={earned === "—" ? undefined : "text-foreground"}>{earned}</b>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PageLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const className = "max-sm:h-11 max-sm:flex-1";
  return href ? (
    <Button asChild variant="outline" size="sm" className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  ) : (
    <Button variant="outline" size="sm" className={className} disabled>
      {children}
    </Button>
  );
}

/** The query returns pages without a total, so the footer says which page this is and links to its neighbours. */
export function Pagination({ page, previous, next }: { page: number; previous: string | null; next: string | null }) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label="Customer pages"
      className="flex flex-col gap-3 pt-3.5 sm:flex-row sm:items-center sm:justify-between sm:border-t"
    >
      <span className="text-[13px] text-muted-foreground">Page {page}</span>
      <div className="flex gap-2">
        <PageLink href={previous}>Previous</PageLink>
        <PageLink href={next}>Next</PageLink>
      </div>
    </nav>
  );
}

export function CustomerRows({ rows, withProgram }: { rows: CustomerRow[]; withProgram: boolean }) {
  return (
    <>
      <CustomerTable rows={rows} withProgram={withProgram} />
      <CustomerCards rows={rows} />
    </>
  );
}

/** Rows' line boxes while the list streams in. */
export function CustomerRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-3 sm:gap-0">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-[20px] border bg-card p-4 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-3.5"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <span className="flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Before the first sign-up: where customers come from, and the two places to start. The list card's only content. */
export function NoCustomers({ appName }: { appName?: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[20px] border bg-card p-5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:pb-1">
      <span className="grid size-11 place-items-center rounded-[12px] bg-muted text-muted-foreground">
        <Users aria-hidden className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base">{appName ? `No customers from ${appName} yet` : "No customers yet"}</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Customers appear here after the first sign-up through your link or code.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/creator/links">Go to Links</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/creator/programs">View programs</Link>
        </Button>
      </div>
    </div>
  );
}
