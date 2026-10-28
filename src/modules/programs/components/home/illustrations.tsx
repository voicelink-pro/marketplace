import { MousePointer2, Plus } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { formatCommissionRange } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/modules/catalog/components/app-card";
import { PLATFORM_PATHS } from "@/modules/catalog/components/platform-logos";
import type { CreatorProgramSummary } from "../../queries";

/*
 * Code-built illustrations for Home. Flat fills only; platform tiles use the
 * platforms' own brand colors, as in platform-logos.tsx.
 */

const PLATFORM_TILE = {
  tiktok: "bg-black ring-1 ring-white/20",
  instagram: "bg-[#E1306C]",
  youtube: "bg-[#FF0000]",
  x: "bg-black ring-1 ring-white/20",
} as const;

export type BrandPlatform = keyof typeof PLATFORM_TILE;

export function isBrandPlatform(value: string): value is BrandPlatform {
  return value in PLATFORM_TILE;
}

/** A platform's logo, white on its brand color. */
export function PlatformTile({ platform, className }: { platform: BrandPlatform; className?: string }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center text-white", PLATFORM_TILE[platform], className)}>
      <svg viewBox="0 0 24 24" className="size-[45%] fill-current">
        <path d={PLATFORM_PATHS[platform]} />
      </svg>
    </span>
  );
}

/** The yellow app-icon "b". */
export function BrandTile({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center bg-primary", className)}>
      <LogoMark className="size-[70%] fill-primary-foreground" />
    </span>
  );
}

/** A named link: the host, then the channel's part on a marker, with a cursor on it. */
export function LinkIllustration({ host }: { host: string }) {
  return (
    <div className="flex size-full items-center justify-center px-3">
      <div className="flex max-w-full items-center gap-0.5 rounded-full border bg-background px-4 py-3 text-[13px] font-semibold whitespace-nowrap">
        <span className="min-w-0 truncate text-muted-foreground">{host}/r/</span>
        <span className="shrink-0 rounded-md bg-primary px-1.5 text-primary-foreground">tiktok-bio</span>
      </div>
      <MousePointer2 aria-hidden className="absolute right-9 bottom-7 size-7 fill-foreground text-background" />
    </div>
  );
}

/** A click notification over a faded earlier one. */
export function ClickIllustration() {
  return (
    <>
      <div className="absolute top-[34px] left-1/2 h-16 w-[min(200px,calc(100%-40px))] -translate-x-[45%] rounded-[14px] border bg-card opacity-55" />
      <div className="absolute top-[52px] left-1/2 flex w-[min(214px,calc(100%-24px))] -translate-x-1/2 flex-col gap-1.5 rounded-[14px] border bg-background px-3.5 py-3">
        <div className="flex items-center gap-2">
          <BrandTile className="size-[22px] rounded-md" />
          <span className="flex-1 text-xs font-bold">{siteConfig.name}</span>
          <span className="text-[11px] text-muted-foreground">now</span>
        </div>
        <span className="text-[13px] leading-snug font-semibold">New click on your TikTok link</span>
      </div>
    </>
  );
}

/** TikTok, Instagram and YouTube tiles, slightly tilted. */
export function SocialIllustration() {
  return (
    <div className="flex size-full items-center justify-center">
      <div className="relative h-[90px] w-[170px]">
        <PlatformTile platform="tiktok" className="absolute top-3.5 left-0 size-[66px] -rotate-8 rounded-[18px]" />
        <PlatformTile platform="instagram" className="absolute top-1 left-[52px] size-[66px] rotate-2 rounded-[18px]" />
        <PlatformTile platform="youtube" className="absolute top-[18px] left-[104px] size-[66px] rotate-9 rounded-[18px]" />
      </div>
    </div>
  );
}

const tileClassName = "size-[58px] rounded-2xl border-[3px] border-muted text-2xl";

/** The creator's programs as stacked app tiles, or empty slots before the first one. */
export function JoinIllustration({ programs }: { programs: CreatorProgramSummary[] }) {
  const first = programs[0];
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      <div className="flex">
        {first
          ? programs.slice(0, 3).map((program, index) => (
              <AppLogo
                key={program.appId}
                app={{ name: program.appName, logoUrl: program.logoUrl }}
                className={cn(tileClassName, index > 0 && "-ml-3.5")}
              />
            ))
          : [0, 1, 2].map((index) => (
              <span
                key={index}
                aria-hidden
                className={cn(
                  tileClassName,
                  "grid place-items-center border-dashed border-foreground/20 bg-background text-muted-foreground",
                  index > 0 && "-ml-3.5",
                )}
              >
                {index === 1 ? <Plus className="size-5" /> : null}
              </span>
            ))}
      </div>
      <span className="inline-flex h-6.5 max-w-[calc(100%-24px)] items-center rounded-full border bg-background px-2.5 text-xs font-bold whitespace-nowrap">
        {first ? (
          <>
            <span className="truncate">{first.appName}</span>
            <span className="mx-1">·</span>
            <span className="shrink-0 text-primary-ink">
              {formatCommissionRange(first.minCommissionBps, first.maxCommissionBps)}
            </span>
          </>
        ) : (
          "Pick an app to promote"
        )}
      </span>
    </div>
  );
}
