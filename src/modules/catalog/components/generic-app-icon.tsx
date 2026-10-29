import { cn } from "@/lib/utils";

/** Stand-in for "an app" in illustrations: violet squircle with four tiles, one yellow. */
export function GenericAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("block shrink-0", className)}>
      <rect width="64" height="64" rx="16" className="fill-side-apps" />
      <rect x="15" y="15" width="15" height="15" rx="4.5" fill="#FFFFFF" />
      <rect x="34" y="15" width="15" height="15" rx="4.5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="15" y="34" width="15" height="15" rx="4.5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="34" y="34" width="15" height="15" rx="4.5" className="fill-primary" />
    </svg>
  );
}
