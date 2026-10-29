/**
 * How a commission's ledger bucket reads to a creator: one label and chip
 * tone per bucket, shared by the customer timeline and the Earnings pages.
 */

export type ChipTone = "neutral" | "muted" | "outline" | "available" | "held";

export type BucketStatus = { label: string; tone: ChipTone };

const BUCKETS: Record<string, BucketStatus> = {
  accrued: { label: "Pending", tone: "muted" },
  unfunded: { label: "Awaiting funding", tone: "muted" },
  available: { label: "Available", tone: "available" },
  held: { label: "On hold", tone: "held" },
  in_payout: { label: "In payout", tone: "neutral" },
  paid: { label: "Paid", tone: "neutral" },
};

/** The ledger only uses the buckets above; anything else reads as still processing. */
export function bucketStatus(bucket: string): BucketStatus {
  return BUCKETS[bucket] ?? { label: "Processing", tone: "muted" };
}
