/**
 * Pure helpers for the creator Payouts page: whether a withdrawal can be
 * requested, the two steps of a payout (platform transfer, then bank payout)
 * and how statuses and events read. Money stays in integer minor units.
 */
import type { ChipTone } from "@/modules/commissions/buckets";

/** The bank attempts a payout gets, including the first. */
export const BANK_ATTEMPTS = 3;

export type PayoutAccount = { enabled: boolean; currency: string; minimum_minor: string; fee_minor: string } | null;

export type WithdrawState =
  | { eligible: true; bank: bigint }
  | { eligible: false; bank: bigint; reason: "no_account" | "nothing_available" | "below_minimum" };

/**
 * Same rule as the payout request: an enabled account, and the amount after
 * the provider fee at or above the minimum.
 */
export function withdrawState(available: string, account: PayoutAccount): WithdrawState {
  const amount = BigInt(available);
  const fee = BigInt(account?.fee_minor ?? "0");
  const bank = amount > fee ? amount - fee : 0n;
  if (!account?.enabled) return { eligible: false, bank, reason: "no_account" };
  if (amount <= 0n) return { eligible: false, bank, reason: "nothing_available" };
  if (amount - fee < BigInt(account.minimum_minor)) return { eligible: false, bank, reason: "below_minimum" };
  return { eligible: true, bank };
}

export type StepState = "done" | "failed" | "waiting";
export type PayoutStep = { label: "Platform transfer" | "Bank payout"; state: StepState };

export type PayoutRow = { status: string; transfer_reference: string | null; bank_reference: string | null };

const TRANSFERRED = new Set(["transferred", "paid", "bank_failed", "returned"]);
const BANK_FAILED = new Set(["bank_failed", "returned"]);

/** The platform transfer, then the bank payout; a bank step waits until the transfer is done. */
export function payoutSteps(payout: PayoutRow): [PayoutStep, PayoutStep] {
  const transfer: StepState =
    payout.status === "transfer_failed"
      ? "failed"
      : TRANSFERRED.has(payout.status) || payout.transfer_reference
        ? "done"
        : "waiting";
  const bank: StepState =
    payout.status === "paid" ? "done" : BANK_FAILED.has(payout.status) ? "failed" : "waiting";
  return [
    { label: "Platform transfer", state: transfer },
    { label: "Bank payout", state: bank },
  ];
}

const STATUSES: Record<string, { label: string; tone: ChipTone }> = {
  requested: { label: "Requested", tone: "muted" },
  transferred: { label: "At the provider", tone: "muted" },
  paid: { label: "Paid", tone: "neutral" },
  transfer_failed: { label: "Transfer failed", tone: "held" },
  bank_failed: { label: "Bank failed", tone: "held" },
  returned: { label: "Returned", tone: "held" },
};

export function payoutStatus(status: string): { label: string; tone: ChipTone } {
  return STATUSES[status] ?? { label: "Processing", tone: "muted" };
}

/** Bank failed or returned: the transfer stands, and the bank step can be tried again. */
export function canRetryBank(payout: { status: string; bank_attempt: number }): boolean {
  return BANK_FAILED.has(payout.status) && payout.bank_attempt < BANK_ATTEMPTS;
}

export const isBankFailure = (status: string) => BANK_FAILED.has(status);

const EVENTS: Record<string, string> = {
  payout_requested: "Payout requested",
  bank_retry_requested: "Bank payout retried",
};

/** "Payout requested", or the code in words ("transfer_succeeded" → "Transfer succeeded"). */
export function eventText(code: string): string {
  const known = EVENTS[code];
  if (known) return known;
  const words = code.replaceAll("_", " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Update";
}

/** The sum of paid payouts per currency, largest first. */
export function paidOutByCurrency(
  payouts: { status: string; currency: string; amount_minor: string }[],
): { currency: string; minor: bigint }[] {
  const totals = new Map<string, bigint>();
  for (const payout of payouts) {
    if (payout.status === "paid") totals.set(payout.currency, (totals.get(payout.currency) ?? 0n) + BigInt(payout.amount_minor));
  }
  return [...totals]
    .map(([currency, minor]) => ({ currency, minor }))
    .toSorted((a, b) => (b.minor > a.minor ? 1 : b.minor < a.minor ? -1 : 0));
}
