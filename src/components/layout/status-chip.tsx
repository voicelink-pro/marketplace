import { cn } from "@/lib/utils";
import type { ChipTone } from "@/modules/commissions/buckets";

const TONES: Record<ChipTone, string> = {
  neutral: "border-transparent bg-muted text-foreground",
  muted: "text-muted-foreground",
  outline: "text-foreground",
  // Accent text on a yellow tint uses --primary-ink, never plain yellow.
  available: "border-transparent bg-primary/15 text-primary-ink",
  held: "border-transparent bg-destructive/10 text-destructive",
};

/** Small pill for a status or a source. Yellow only for money that is ready to withdraw. */
export function StatusChip({
  tone = "outline",
  dot = false,
  className,
  children,
}: {
  tone?: ChipTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
