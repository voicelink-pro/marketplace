/**
 * Money and rate primitives (see docs/DECISIONS.md T-20, T-21, W-07).
 *
 * - All monetary amounts are integers in the currency's smallest unit (`bigint`),
 *   paired with an ISO 4217 3-letter uppercase currency code.
 * - All percentage rates are integer basis points (`1500` = `15.00%`).
 * - Floating-point arithmetic is never used for money or rates.
 */

const CURRENCY_CODE_RE = /^[A-Z]{3}$/;
const INTEGER_STRING_RE = /^-?\d+$/;

export function toMinorBigInt(value: bigint | number | string): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error("Monetary minor units must be a safe integer or bigint.");
    }
    return BigInt(value);
  }
  const trimmed = value.trim();
  if (!INTEGER_STRING_RE.test(trimmed)) {
    throw new Error("Monetary minor units string must be an integer.");
  }
  return BigInt(trimmed);
}

function currencyFractionDigits(currency: string): number {
  if (!CURRENCY_CODE_RE.test(currency)) {
    throw new Error(`Invalid ISO 4217 currency code: ${currency}`);
  }
  const resolved = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).resolvedOptions();
  return resolved.maximumFractionDigits ?? 2;
}

/**
 * Formats integer minor units (e.g. `1499n` in `EUR` -> `"€14.99"`) using a
 * decimal string passed to `Intl.NumberFormat` so `bigint` values never lose
 * precision through IEEE 754 floats.
 */
export function formatMinorCurrency(
  amountMinor: bigint | number | string,
  currency: string,
  locale = "en-US",
): string {
  const minor = toMinorBigInt(amountMinor);
  const digits = currencyFractionDigits(currency);
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  if (digits === 0) {
    const decimalString = `${negative ? "-" : ""}${abs.toString()}` as `${number}`;
    return formatter.format(decimalString);
  }

  const divisor = 10n ** BigInt(digits);
  const majorPart = abs / divisor;
  const fractionPart = (abs % divisor).toString().padStart(digits, "0");
  const decimalString = `${negative ? "-" : ""}${majorPart.toString()}.${fractionPart}` as `${number}`;
  return formatter.format(decimalString);
}

function assertValidBps(bps: number): void {
  if (!Number.isSafeInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error(`Commission rate must be integer basis points between 0 and 10000 (got ${bps}).`);
  }
}

/** Formats basis points as a percentage number without `%` (e.g. `1500` -> `"15"`, `1250` -> `"12.5"`). */
export function formatCommissionNumber(bps: number): string {
  assertValidBps(bps);
  const whole = Math.trunc(bps / 100);
  const remainder = bps % 100;
  if (remainder === 0) return String(whole);
  if (remainder % 10 === 0) return `${whole}.${remainder / 10}`;
  return `${whole}.${String(remainder).padStart(2, "0")}`;
}

/** Formats basis points with `%` (e.g. `2000` -> `"20%"`, `1250` -> `"12.5%"`). */
export function formatCommissionPercent(bps: number): string {
  return `${formatCommissionNumber(bps)}%`;
}

/**
 * Formats an app's commission range across its subscription plans (brief W-07).
 * Never presents the highest rate as applying to every plan ("up to X%").
 */
export function formatCommissionRange(
  minBps: number,
  maxBps: number,
  suffix = "recurring",
): string {
  assertValidBps(minBps);
  assertValidBps(maxBps);
  if (minBps > maxBps) {
    throw new Error(`Invalid commission range: minBps (${minBps}) > maxBps (${maxBps}).`);
  }
  const rateText =
    minBps === maxBps
      ? formatCommissionPercent(minBps)
      : `${formatCommissionNumber(minBps)}–${formatCommissionPercent(maxBps)}`;
  return suffix ? `${rateText} ${suffix}` : rateText;
}
