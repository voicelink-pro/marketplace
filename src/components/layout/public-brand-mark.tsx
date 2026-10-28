"use client";

import { usePathname } from "next/navigation";
import { PageBrandMark } from "@/components/brand/brand-mark-backdrop";

/**
 * On the home page the default spot is behind the hero card, so the "b" moves
 * down: its top in the gap under How it works, the stem through the Benefits
 * panel, the bowl behind the logo cloud, far enough right to stay clear of
 * text in both audience versions (checked at 1280 px). Other public pages keep the default.
 */
export function PublicBrandMark() {
  return <PageBrandMark className={usePathname() === "/" ? "top-285 -right-98" : undefined} />;
}
