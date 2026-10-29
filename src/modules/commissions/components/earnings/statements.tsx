import { formatMinorCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CardHeading, CardTitle, HomeCard } from "@/modules/programs/components/home/card";
import { type MonthStatement, monthYearLabel } from "./earnings-data";

const TH = "pb-2.5 pr-3 text-right text-xs font-semibold whitespace-nowrap text-muted-foreground first:text-left last:pr-0";
const TD = "border-t py-3 pr-3 text-right align-middle whitespace-nowrap last:pr-0";

const money = (minor: bigint, currency: string) => formatMinorCurrency(minor, currency);
const minus = (minor: bigint, currency: string) => (minor > 0n ? `−${money(minor, currency)}` : money(minor, currency));

/** One row per closed month and currency: sales, commission, the platform fee and what you kept. */
export function Statements({ statements }: { statements: MonthStatement[] }) {
  return (
    <HomeCard titleId="statements-heading" className="gap-3">
      <CardHeading
        id="statements-heading"
        title="Monthly statements"
        note="Each month is closed and checked before it can be paid out."
      />
      {statements.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your first statement appears after the first month closes.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <table className="tabular w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th scope="col" className={TH}>
                    Month
                  </th>
                  <th scope="col" className={TH}>
                    Sales
                  </th>
                  <th scope="col" className={TH}>
                    Commission
                  </th>
                  <th scope="col" className={TH}>
                    Platform fee
                  </th>
                  <th scope="col" className={TH}>
                    You earned
                  </th>
                </tr>
              </thead>
              <tbody>
                {statements.map((row) => (
                  <tr key={`${row.month} ${row.currency}`}>
                    <th scope="row" className={cn(TD, "text-left font-semibold")}>
                      {monthYearLabel(row.month)}
                    </th>
                    <td className={cn(TD, "text-muted-foreground")}>{money(row.sale, row.currency)}</td>
                    <td className={TD}>{money(row.gross, row.currency)}</td>
                    <td className={cn(TD, "text-muted-foreground")}>{minus(row.fee, row.currency)}</td>
                    <td className={cn(TD, "font-extrabold")}>{money(row.creator, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col sm:hidden">
            {statements.map((row) => (
              <li key={`${row.month} ${row.currency}`} className="tabular flex flex-col gap-0.5 border-t py-3">
                <span className="flex justify-between gap-3 text-sm">
                  <b>{monthYearLabel(row.month)}</b>
                  <b>{money(row.creator, row.currency)}</b>
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {money(row.sale, row.currency)} sales · {money(row.gross, row.currency)} commission ·{" "}
                  {minus(row.fee, row.currency)} fee
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </HomeCard>
  );
}

export type Correction = {
  id: string;
  original_month: string;
  effective_month: string;
  currency: string;
  creator_delta: string;
};

function signed(minor: string, currency: string): string {
  const value = BigInt(minor);
  return value < 0n ? `−${formatMinorCurrency(-value, currency)}` : `+${formatMinorCurrency(value, currency)}`;
}

/** Refunds and disputes after a payment: what changed, which payment, and the month it counts in. */
export function Corrections({ corrections }: { corrections: Correction[] }) {
  return (
    <HomeCard titleId="corrections-heading" className="gap-3">
      <CardHeading
        id="corrections-heading"
        title="Corrections"
        note="Refunds and disputes change what you earn after a payment."
      />
      <ul className="flex flex-col">
        {corrections.map((row) => (
          <li key={row.id} className="tabular flex items-center justify-between gap-3 border-t py-2.5 text-sm">
            <span className="min-w-0">
              Change to a {monthYearLabel(row.original_month)} payment
              <span className="block text-[13px] text-muted-foreground">
                Counted in {monthYearLabel(row.effective_month)}
              </span>
            </span>
            <b className="shrink-0">{signed(row.creator_delta, row.currency)}</b>
          </li>
        ))}
      </ul>
    </HomeCard>
  );
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

/** Payments that need a manual check before commission is final. No amounts: none is guessed. */
export function NeedsAttention({
  jobs,
  cases,
}: {
  jobs: { transaction_id: string; status: string }[];
  cases: { id: string; created_at: string }[];
}) {
  return (
    <HomeCard titleId="attention-heading" className="gap-3">
      <CardTitle id="attention-heading">Needs a check</CardTitle>
      <ul className="flex flex-col gap-2.5 text-[13px] leading-normal text-muted-foreground">
        {jobs.map((job) => (
          <li key={job.transaction_id} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-muted-foreground" />
            {job.status === "review"
              ? "A payment is being reviewed before its commission is calculated."
              : "A payment is waiting for details before its commission is calculated."}
          </li>
        ))}
        {cases.map((item) => (
          <li key={item.id} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-muted-foreground" />
            {`A payment from ${dateFormat.format(new Date(item.created_at))} is being checked by the platform team.`}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted-foreground">You don’t need to do anything.</p>
    </HomeCard>
  );
}
