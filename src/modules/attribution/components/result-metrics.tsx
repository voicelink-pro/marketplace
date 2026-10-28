import { unstable_rethrow } from "next/navigation";
import { MetricValue } from "@/components/layout/metrics-row";
import { formatMinorCurrency } from "@/lib/money";
import { isLocalPgliteSandboxEnabled } from "@/modules/catalog/local-pglite-sandbox";
import { getCommissionWorkspace } from "@/modules/commissions/queries";
import { getPaymentMetrics } from "@/modules/payments/queries";
import { getAttributionSummary } from "../queries";

/*
 * Overview tiles: each loads one figure on its own, so a slow or failing
 * query only affects its tile. Tracking data lives in Supabase only, so the
 * in-memory sandbox shows a dash with the reason.
 */

type Scope = { appId?: string; company?: boolean; caption: string };

/** The query's result, or undefined when it fails (the queries log their own errors). Next's own errors pass through. */
export function settled<T>(query: () => Promise<T>): Promise<T | undefined> {
  return query().catch((error: unknown) => {
    unstable_rethrow(error);
    return undefined;
  });
}

const needsSupabase = <MetricValue caption="Needs local Supabase" />;
const unavailable = <MetricValue caption="Unavailable" />;

export async function ClicksValue({ appId, company = false, caption }: Scope) {
  if (isLocalPgliteSandboxEnabled()) return needsSupabase;
  const summary = await settled(() => getAttributionSummary(appId, company));
  return summary ? <MetricValue value={summary.clicks} caption={caption} /> : unavailable;
}

export async function PayingCustomersValue({ appId, company = false, caption }: Scope) {
  if (isLocalPgliteSandboxEnabled()) return needsSupabase;
  const metrics = await settled(() => getPaymentMetrics(appId, company));
  return metrics ? <MetricValue value={metrics.paying_customers} caption={caption} /> : unavailable;
}

/** One line per currency: amounts are never summed or converted across currencies. */
export async function CommissionThisMonthValue({ appId, company = false, caption }: Scope) {
  if (isLocalPgliteSandboxEnabled()) return needsSupabase;
  const workspace = await settled(() => getCommissionWorkspace({ appId, company }));
  if (!workspace) return unavailable;
  if (workspace.totals.length === 0) return <MetricValue caption="No commission yet" />;
  const lines = workspace.totals.map((total) => (
    <span key={total.currency}>{formatMinorCurrency(total.accrued_this_month, total.currency)}</span>
  ));
  return <MetricValue value={lines} caption={caption} />;
}
