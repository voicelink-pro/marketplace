import { Info } from "lucide-react";

/** One neutral line on the creator Earnings and Payouts pages, in place of the sandbox paragraphs. */
export function TestModeNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="note"
      className="flex items-start gap-2.5 rounded-[14px] border bg-card/50 px-3.5 py-2.5 text-sm text-muted-foreground"
    >
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
