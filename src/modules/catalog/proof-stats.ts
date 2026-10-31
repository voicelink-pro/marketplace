import { loadPublishedCatalog } from "./discover-data";

/** Total paid out to creators, in whole US dollars, for the home page's proof strip. Showcase value, updated manually. */
// TODO(Karol): replace with the real total of completed creator payouts (needs a public-safe aggregate query/RPC).
export const PAID_OUT_USD = 48920;

/**
 * The mean of every published app's top commission rate (the high end of the
 * range its card shows), rounded to a whole percent; null while no published
 * app has a rate. Integer basis points until the final rounding.
 */
export async function getAverageCommissionPercent(): Promise<number | null> {
  const { apps } = await loadPublishedCatalog();
  const rates = apps.map((app) => app.maxCommissionBps).filter((bps) => bps > 0);
  if (rates.length === 0) return null;
  const totalBps = rates.reduce((sum, bps) => sum + bps, 0);
  return Math.round(totalBps / (rates.length * 100));
}
