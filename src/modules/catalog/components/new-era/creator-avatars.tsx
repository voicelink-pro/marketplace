import { cn } from "@/lib/utils";
import { type Platform, PlatformLogoTile } from "../platform-logos";

// Flat illustrated faces on a "7 8 50 50" box. The circle behind each one is a
// theme token tint (see CREATORS).

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

/** A creator's face in its tinted circle, no badge. Size and border come from `className`. */
export function CreatorFace({ index, className }: { index: number; className?: string }) {
  const { Face, background } = CREATORS[index % CREATORS.length];
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-full", background, className)}>
      <svg viewBox="7 8 50 50" className="block size-full">
        <Face />
      </svg>
    </span>
  );
}

/** 80px creator face with its platform badge. Decorative: the surrounding illustration is labelled. */
export function CreatorAvatar({ index }: { index: number }) {
  const { platform } = CREATORS[index % CREATORS.length];
  return (
    <span className="relative block size-20">
      <CreatorFace index={index} className="size-full border-[3px] border-background" />
      {/* 25px plus a 2.5px ring in the page background: a 30px badge. */}
      <PlatformLogoTile
        platform={platform}
        size={25}
        variant="badge"
        className="absolute right-[-1.5px] bottom-[2.5px] rounded-full ring-[2.5px] ring-background"
      />
    </span>
  );
}
