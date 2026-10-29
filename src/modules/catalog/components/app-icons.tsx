import { cn } from "@/lib/utils";

// Example app icons for illustrations, each a 64×64 squircle in the app's own
// color. Size comes from `className`.

/** Stand-in for "an app": violet squircle with four tiles, one yellow. */
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

/** Coral timer app (Tempo Focus). */
export function TimerAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("block shrink-0", className)}>
      <rect width="64" height="64" rx="16" fill="#FF6B4A" />
      <circle cx="32" cy="34" r="15" fill="#FFFFFF" />
      <path d="M32 26v9l6 4" stroke="#FF6B4A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <rect x="28" y="12" width="8" height="5" rx="2" fill="#FFFFFF" />
    </svg>
  );
}

/** Yellow chat app (Lingo Chat). */
export function ChatAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("block shrink-0", className)}>
      <rect width="64" height="64" rx="16" fill="#FFD600" />
      <path d="M16 20a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H30l-8 7v-7a6 6 0 0 1-6-6z" fill="#111111" />
      <circle cx="25" cy="27" r="2.6" fill="#FFD600" />
      <circle cx="32" cy="27" r="2.6" fill="#FFD600" />
      <circle cx="39" cy="27" r="2.6" fill="#FFD600" />
    </svg>
  );
}

/** Violet notes app (Lexi Notes). */
export function NotesAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("block shrink-0", className)}>
      <rect width="64" height="64" rx="16" fill="#8B5CF6" />
      <path d="M21 13h17l9 9v27a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" fill="#FFFFFF" />
      <rect x="24" y="30" width="17" height="3" rx="1.5" fill="#C4B5FD" />
      <rect x="24" y="37" width="12" height="3" rx="1.5" fill="#C4B5FD" />
    </svg>
  );
}
