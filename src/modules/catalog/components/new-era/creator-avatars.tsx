import { useId } from "react";
import { cn } from "@/lib/utils";
import { PLATFORM_PATHS } from "../platform-logos";

type Platform = "tiktok" | "instagram" | "youtube" | "x";

// Flat illustrated faces on a "7 8 50 50" box. The circle behind each one is a
// theme token tint (see CREATORS), so the faces work in light and dark.

const EYE_WHITE = "#FFFFFF";
const INK = "#111111";

function Eyes({ y = 31, r = 3.4 }: { y?: number; r?: number }) {
  return (
    <>
      <circle cx="27" cy={y} r={r} fill={EYE_WHITE} />
      <circle cx="37" cy={y} r={r} fill={EYE_WHITE} />
      <circle cx="27.6" cy={y + 0.5} r={r / 2} fill={INK} />
      <circle cx="37.6" cy={y + 0.5} r={r / 2} fill={INK} />
    </>
  );
}

function BobFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#F5F5F5" />
      <path d="M16 31c0-12 7-19 16-19s16 7 16 19v12H16z" fill={INK} />
      <ellipse cx="32" cy="31" rx="12" ry="14" fill="#FFB4A3" />
      <path d="M19 27c3-8 8-11 13-11s10 3 13 11c-6-4-9-5-13-5s-7 1-13 5z" fill={INK} />
      <Eyes />
    </>
  );
}

function BunFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill={INK} />
      <circle cx="32" cy="12" r="6" fill="#FFD600" />
      <ellipse cx="32" cy="31" rx="12" ry="14" fill="#8B5CF6" />
      <path d="M20 27c0-8 5-12 12-12s12 4 12 12c-4-4-7-5-12-5s-8 1-12 5z" fill="#FFD600" />
      <Eyes />
    </>
  );
}

function CurlsFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#F5F5F5" />
      <ellipse cx="32" cy="32" rx="12" ry="14" fill="#FFD600" />
      {[
        [21, 22],
        [26, 17],
        [32, 15],
        [38, 17],
        [43, 22],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="5.5" fill="#FF6B4A" />
      ))}
      <Eyes y={32} />
    </>
  );
}

function GlassesFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#8B5CF6" />
      <ellipse cx="32" cy="31" rx="12" ry="14" fill="#C4B5FD" />
      <path d="M20 25c1-7 6-10 12-10s11 3 12 10c-5-3-8-4-12-4s-7 1-12 4z" fill={INK} />
      <Eyes r={3.2} />
      <circle cx="27" cy="31" r="5.2" fill="none" stroke={INK} strokeWidth="1.6" />
      <circle cx="37" cy="31" r="5.2" fill="none" stroke={INK} strokeWidth="1.6" />
      <path d="M32 31h0" stroke={INK} strokeWidth="1.6" />
    </>
  );
}

function CapFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#F5F5F5" />
      <ellipse cx="32" cy="32" rx="12" ry="14" fill="#FF6B4A" />
      <path d="M19 25c0-8 6-12 13-12s13 4 13 12z" fill="#FFD600" />
      <path d="M41 23h10a2 2 0 0 1 0 4H41z" fill="#FFD600" />
      <Eyes y={32} />
    </>
  );
}

function LongHairFace() {
  return (
    <>
      <path d="M15 31c0-11 7-18 17-18s17 7 17 18v18H15z" fill="#8B5CF6" />
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill={INK} />
      <ellipse cx="32" cy="31" rx="12" ry="14" fill="#F5F5F5" />
      <path d="M19 27c3-7 8-10 13-10s10 3 13 10c-5-3-9-4-13-4s-8 1-13 4z" fill="#8B5CF6" />
      <circle cx="27" cy="31" r="3.4" fill={EYE_WHITE} stroke="#E5E5E5" strokeWidth="0.6" />
      <circle cx="37" cy="31" r="3.4" fill={EYE_WHITE} stroke="#E5E5E5" strokeWidth="0.6" />
      <circle cx="27.6" cy="31.5" r="1.7" fill={INK} />
      <circle cx="37.6" cy="31.5" r="1.7" fill={INK} />
    </>
  );
}

function SpikyFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#FF6B4A" />
      <ellipse cx="32" cy="32" rx="12" ry="14" fill="#FFD600" />
      <path d="M19 25l2-10 4 5 3-9 4 8 4-8 3 9 4-5 2 10c-4-3-8-4-13-4s-9 1-13 4z" fill={INK} />
      <Eyes y={32} />
    </>
  );
}

function HeadphonesFace() {
  return (
    <>
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill={INK} />
      <ellipse cx="32" cy="32" rx="12" ry="14" fill="#C4B5FD" />
      <path d="M21 25c1-6 5-9 11-9s10 3 11 9c-4-2-7-3-11-3s-7 1-11 3z" fill="#FF6B4A" />
      <path d="M17 31a15 15 0 0 1 30 0" fill="none" stroke={INK} strokeWidth="3" />
      <rect x="14" y="28" width="6" height="11" rx="3" fill={INK} />
      <rect x="44" y="28" width="6" height="11" rx="3" fill={INK} />
      <Eyes y={32} />
    </>
  );
}

/** Ring order, clockwise from the top. Backgrounds: brand tints at 20% or muted. */
const CREATORS: { Face: () => React.ReactNode; background: string; platform: Platform }[] = [
  { Face: BobFace, background: "bg-side-creators/20", platform: "tiktok" },
  { Face: BunFace, background: "bg-side-apps/20", platform: "instagram" },
  { Face: CurlsFace, background: "bg-primary/20", platform: "youtube" },
  { Face: GlassesFace, background: "bg-muted", platform: "x" },
  { Face: CapFace, background: "bg-side-apps/20", platform: "tiktok" },
  { Face: LongHairFace, background: "bg-side-creators/20", platform: "instagram" },
  { Face: SpikyFace, background: "bg-muted", platform: "youtube" },
  { Face: HeadphonesFace, background: "bg-primary/20", platform: "tiktok" },
];

export const CREATOR_COUNT = CREATORS.length;

/** Platform badge in the platform's own colors; the ring matches the page background. */
function PlatformBadge({ platform }: { platform: Platform }) {
  const instagramGradient = useId();
  const ring =
    "absolute -right-1 bottom-0 grid size-[30px] place-items-center rounded-full border-[2.5px] border-background";

  if (platform === "tiktok") {
    return (
      <span className={cn(ring, "bg-black")}>
        {/* Cyan and red offsets behind the white glyph. */}
        <svg viewBox="0 0 24 24" overflow="visible" className="size-[15px]">
          <path d={PLATFORM_PATHS.tiktok} fill="#25F4EE" transform="translate(-1 -1)" />
          <path d={PLATFORM_PATHS.tiktok} fill="#FE2C55" transform="translate(1 1)" />
          <path d={PLATFORM_PATHS.tiktok} fill="#FFFFFF" />
        </svg>
      </span>
    );
  }
  if (platform === "instagram") {
    return (
      <span className={cn(ring, "overflow-hidden bg-white")}>
        <svg viewBox="0 0 24 24" className="absolute -top-[2.5px] -left-[2.5px] size-[30px]">
          <defs>
            {/* Instagram's official radial gradient, from the bottom-left corner. */}
            <radialGradient id={instagramGradient} cx="0.3" cy="1.07" r="1.3">
              <stop offset="0" stopColor="#FDF497" />
              <stop offset="0.05" stopColor="#FDF497" />
              <stop offset="0.45" stopColor="#FD5949" />
              <stop offset="0.6" stopColor="#D6249F" />
              <stop offset="0.9" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" fill={`url(#${instagramGradient})`} />
          <path d={PLATFORM_PATHS.instagram} fill="#FFFFFF" transform="translate(6.6 6.6) scale(0.45)" />
        </svg>
      </span>
    );
  }
  if (platform === "youtube") {
    return (
      <span className={cn(ring, "bg-white")}>
        {/* The play arrow is a cut-out, so the white badge shows through. */}
        <svg viewBox="0 0 24 24" className="size-[17px]">
          <path d={PLATFORM_PATHS.youtube} fill="#FF0000" />
        </svg>
      </span>
    );
  }
  return (
    <span className={cn(ring, "bg-black")}>
      <svg viewBox="0 0 24 24" className="size-3">
        <path d={PLATFORM_PATHS.x} fill="#FFFFFF" />
      </svg>
    </span>
  );
}

/** 80px creator face with its platform badge. Decorative: the orbit's label describes it. */
export function CreatorAvatar({ index }: { index: number }) {
  const { Face, background, platform } = CREATORS[index % CREATORS.length];
  return (
    <span className="relative block size-20">
      <span className={cn("block size-full overflow-hidden rounded-full border-[3px] border-background", background)}>
        <svg viewBox="7 8 50 50" className="block size-full">
          <Face />
        </svg>
      </span>
      <PlatformBadge platform={platform} />
    </span>
  );
}
