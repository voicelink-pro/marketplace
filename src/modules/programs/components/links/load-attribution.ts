import { cache } from "react";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getAttributionSummary } from "@/modules/attribution/queries";
import { isLocalPgliteSandboxEnabled } from "@/modules/catalog/local-pglite-sandbox";

export type AttributionSummary = Awaited<ReturnType<typeof getAttributionSummary>>;

/**
 * Clicks and sign-ups for one app (or all), once per request. Undefined when
 * the query fails and in the local PGlite sandbox, which records no clicks:
 * callers show "—", never 0.
 */
export const loadAttribution = cache(
  (appId?: string): Promise<AttributionSummary | undefined> =>
    isLocalPgliteSandboxEnabled() ? Promise.resolve(undefined) : settled(() => getAttributionSummary(appId)),
);
