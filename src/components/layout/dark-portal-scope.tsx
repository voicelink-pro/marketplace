"use client";

import { useEffect } from "react";

/**
 * Menus, sheets and toasts portal to <body>, outside the dark panel wrapper.
 * They only open after hydration, so mirroring the class on <html> here is
 * enough to theme them without a flash.
 */
export function DarkPortalScope() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    return () => root.classList.remove("dark");
  }, []);
  return null;
}
