"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, type MouseEvent, use, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Switching between the two home pages (`/` ⇄ `/for-apps`) from the header
 * pill or the label above the hero. `pendingHref` is the page being opened
 * until it is shown: the pill moves there at once and the header shows a
 * loading strip. Without a provider, links just navigate.
 */
const AudienceNavContext = createContext<{
  navigate: (href: string) => void;
  pendingHref: string | null;
} | null>(null);

export function AudienceNavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);

  function navigate(href: string) {
    setTarget(href);
    startTransition(() => router.push(href));
  }

  return (
    <AudienceNavContext value={{ navigate, pendingHref: isPending ? target : null }}>
      {children}
    </AudienceNavContext>
  );
}

export function usePendingAudienceHref(): string | null {
  return use(AudienceNavContext)?.pendingHref ?? null;
}

/**
 * Click handler for a real `<a href>` to the other home page: a plain left
 * click goes through the provider; modifier and middle clicks open as usual.
 */
export function useAudienceNavClick(href: string) {
  const context = use(AudienceNavContext);
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (!context || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    context.navigate(href);
  };
}

/** A 32px strip at the bottom of the header with a spinner while the other home page loads. */
export function AudienceNavStatus() {
  const pending = usePendingAudienceHref() !== null;
  return (
    <>
      <div
        aria-hidden
        className={cn(
          "grid place-items-center overflow-hidden motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-out",
          pending ? "h-8" : "h-0",
        )}
      >
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? "Loading" : ""}
      </p>
    </>
  );
}
