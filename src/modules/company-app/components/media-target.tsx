"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

export type MediaTarget = "coverImageUrl" | "logoUrl" | "videoUrl" | "screenshot";

export const MEDIA_TARGET_LABELS: Record<MediaTarget, string> = {
  coverImageUrl: "Tile cover",
  logoUrl: "Logo",
  screenshot: "Screenshot",
  videoUrl: "Product video",
};

type Handler = (target: MediaTarget, url: string) => void;
type MediaTargetContext = { apply: Handler; register: (handler: Handler | null) => void };

const Context = createContext<MediaTargetContext | null>(null);

/**
 * Lets the upload form (its own <form>; forms can't nest) drop an uploaded
 * path into a draft field. It only fills the field — saving the draft is
 * still what attaches the file.
 */
export function MediaTargetProvider({ children }: { children: React.ReactNode }) {
  const handler = useRef<Handler | null>(null);
  const register = useCallback((next: Handler | null) => {
    handler.current = next;
  }, []);
  const apply = useCallback<Handler>((target, url) => handler.current?.(target, url), []);
  const value = useMemo(() => ({ apply, register }), [apply, register]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Called by the draft editor to receive uploaded paths. */
export function useMediaTargetHandler(handler: Handler) {
  const context = useContext(Context);
  useEffect(() => {
    context?.register(handler);
    return () => context?.register(null);
  }, [context, handler]);
}

/** Called by the upload form; `null` when there is no editor on the page. */
export function useApplyMedia(): Handler | null {
  return useContext(Context)?.apply ?? null;
}
