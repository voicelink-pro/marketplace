"use client";

import { usePathname } from "next/navigation";
import { PageBrandMark } from "@/components/brand/brand-mark-backdrop";

/**
 * On the home pages the default spot is behind the hero card. `/` draws its "b" inside the
 * Who it's for section instead (`who-its-for.tsx`): its top level with that section's heading,
 * the rest behind its cards, at this same horizontal spot (-24.5rem past the right edge), from lg up. On `/for-apps`
 * it moves down, far enough right to stay clear of text (checked at 1280 px), with its top
 * ~190px above How it works. Other public pages keep the default.
 */
const HOME_POSITION: Record<string, string> = {
  "/for-apps": "top-285 -right-98",
};

export function PublicBrandMark() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <PageBrandMark className={HOME_POSITION[pathname]} />;
}
