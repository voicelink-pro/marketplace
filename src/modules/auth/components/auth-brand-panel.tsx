"use client";

import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { HOME_AUDIENCE_PARAM, type HomeAudience, parseHomeAudience } from "@/modules/catalog/audience";
import { HeroDotGrid } from "@/modules/catalog/components/hero-dot-grid";
import { BRAND_PANEL } from "../intent";
import { SideCrossfade } from "./side-crossfade";

/**
 * Left half of the auth pages on desktop: the home hero's dot grid (same
 * cursor drift and tint) and brand mark, with the heading and three benefits
 * for the side in `?for=`. Heading and rows keep fixed heights, so switching
 * sides only crossfades the text.
 */
export function AuthBrandPanel({ audience }: { audience: HomeAudience }) {
  return (
    <aside
      aria-labelledby="auth-brand-heading"
      className="relative isolate flex h-full flex-col overflow-hidden rounded-[2rem] bg-linear-to-r from-muted to-card p-10 xl:p-14"
    >
      <HeroDotGrid />
      <LogoMark className="absolute -right-28 -bottom-36 size-[34rem] rotate-[-8deg]" />
      <div className="relative flex flex-col gap-5">
        <h2 id="auth-brand-heading" className="text-3xl leading-tight font-extrabold tracking-[-0.045em] xl:text-4xl">
          <SideCrossfade side={audience} render={(side) => BRAND_PANEL[side].heading} className="min-h-[1lh]" />
        </h2>
        <ul className="flex flex-col gap-2">
          {BRAND_PANEL[audience].benefits.map((_, index) => (
            // Every row is two lines tall; a one-line benefit and its icon sit centred in it, so the gaps read evenly.
            <li key={index} className="flex items-center gap-3 text-base leading-7 font-medium text-pretty xl:text-lg">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary">
                <Check aria-hidden className="size-4 text-primary-foreground" />
              </span>
              <SideCrossfade
                side={audience}
                render={(side) => BRAND_PANEL[side].benefits[index]}
                className="min-h-[2lh] items-center"
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function AuthBrandPanelFromUrl() {
  const audience = parseHomeAudience(useSearchParams().get(HOME_AUDIENCE_PARAM) ?? undefined) ?? "creators";
  return <AuthBrandPanel audience={audience} />;
}
