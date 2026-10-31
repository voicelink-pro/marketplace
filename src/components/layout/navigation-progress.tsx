"use client";

import { ProgressProvider } from "@bprogress/next/app";

/**
 * A 2px brand-yellow bar at the top of the window during every client-side
 * navigation. Shows only after 150ms, so instant (prefetched) navigations don't
 * flash it; no spinner. Same-page hash links (`#offers`) don't start it.
 */
export function NavigationProgress({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider height="2px" color="var(--primary)" options={{ showSpinner: false }} delay={150} shallowRouting>
      {children}
    </ProgressProvider>
  );
}
