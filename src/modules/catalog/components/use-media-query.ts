"use client";

import { useSyncExternalStore } from "react";

/**
 * Live media query match. `serverValue` is used on the server and before
 * hydration, so pass the value that renders the calm, static version.
 */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}
