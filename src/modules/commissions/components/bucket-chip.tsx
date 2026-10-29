import { StatusChip } from "@/components/layout/status-chip";
import { bucketStatus } from "../buckets";

/** A commission's status, e.g. "Pending" or "Available". */
export function BucketChip({ bucket }: { bucket: string }) {
  const { label, tone } = bucketStatus(bucket);
  return (
    <StatusChip tone={tone} dot>
      {label}
    </StatusChip>
  );
}
