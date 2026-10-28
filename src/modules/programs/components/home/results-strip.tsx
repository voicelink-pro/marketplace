import { type StatCell, StatStrip } from "@/components/layout/stat-strip";

/** Home's four results, all time (the queries are not monthly). */
export function ResultsStrip({ cells }: { cells: StatCell[] }) {
  return <StatStrip cells={cells} title="Results" note="All time" headingId="results-heading" />;
}
