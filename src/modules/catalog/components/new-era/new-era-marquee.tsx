"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { ChatAppIcon, GenericAppIcon, NotesAppIcon, TimerAppIcon } from "../app-icons";
import { type Platform, PlatformLogoTile } from "../platform-logos";
import { CreatorFace } from "./creator-avatars";
import styles from "./new-era-marquee.module.css";

type Tile =
  | { kind: "app"; Icon: typeof NotesAppIcon; name: string; category: string; commission: string }
  | { kind: "notification"; text: string; amount?: string }
  | { kind: "link"; platform: Platform; path: string; clicks: string }
  | { kind: "creator"; face: number; handle: string; followers: string; platform: Platform }
  | { kind: "stat"; label: string; value: string }
  | { kind: "payout" };

// Example pieces of the product, consistent with the rest of the page
// (20% of a $39 plan = $7.80). Five per column, in the mockup's order.
const COLUMNS: Tile[][] = [
  [
    { kind: "app", Icon: NotesAppIcon, name: "Lexi Notes", category: "AI & Writing", commission: "20%" },
    { kind: "notification", text: "New subscriber via TikTok.", amount: "+$7.80" },
    { kind: "creator", face: 0, handle: "@maya.creates", followers: "48k", platform: "tiktok" },
    { kind: "stat", label: "Paying customers", value: "34" },
    { kind: "link", platform: "instagram", path: "…/r/lexi-notes/ig-bio", clicks: "760" },
  ],
  [
    { kind: "link", platform: "tiktok", path: "…/r/lexi-notes/tiktok-bio", clicks: "1,320" },
    { kind: "app", Icon: TimerAppIcon, name: "Tempo Focus", category: "Productivity", commission: "15%" },
    { kind: "payout" },
    { kind: "creator", face: 1, handle: "@leo.builds", followers: "22k", platform: "instagram" },
    { kind: "notification", text: "Renewal from YouTube.", amount: "+$7.80" },
  ],
  [
    { kind: "creator", face: 2, handle: "@zara.studies", followers: "91k", platform: "youtube" },
    { kind: "notification", text: "New sign-up with code LEXI-5C89C6." },
    { kind: "app", Icon: ChatAppIcon, name: "Lingo Chat", category: "Education", commission: "30%" },
    { kind: "link", platform: "youtube", path: "…/r/lexi-notes/video-1", clicks: "400" },
    { kind: "stat", label: "Sign-ups", value: "186" },
  ],
  [
    { kind: "stat", label: "Earned this month", value: "$129.20" },
    { kind: "creator", face: 3, handle: "@kai.codes", followers: "12k", platform: "x" },
    { kind: "link", platform: "x", path: "…/r/tempo/thread", clicks: "210" },
    { kind: "app", Icon: GenericAppIcon, name: "Habit Grid", category: "Health", commission: "25%" },
    { kind: "notification", text: "New subscriber via Instagram.", amount: "+$3.80" },
  ],
];

/** Staggered starts, so the columns never line up. */
const COLUMN_DELAY_S = 7;
/** Copies of each column; the loop moves by one (new-era-marquee.module.css keeps -20% → -40% in step). */
const COPIES = 5;

/** The hero's key phrase color: black on a yellow marker in light, yellow letters in dark. */
const KEY_PHRASE = "rounded-[0.1em] bg-[#FFD600] px-[0.08em] text-[#111111] dark:bg-transparent dark:px-0 dark:text-primary";
const LABEL = "text-xs font-semibold text-muted-foreground";
const NAME = "text-[15px] font-bold";
const BIG = "text-3xl leading-none font-extrabold tracking-[-0.04em]";
const CHIP = "inline-flex h-[22px] items-center self-start rounded-full px-[9px] text-[11px] font-extrabold whitespace-nowrap";

/** Black platform tiles need an edge to read on dark cards. */
function platformTileClass(platform: Platform, radius: string) {
  return cn(radius, (platform === "tiktok" || platform === "x") && "border border-white/20");
}

function TileContent({ tile }: { tile: Tile }) {
  switch (tile.kind) {
    case "app":
      return (
        <>
          <div className="flex items-center gap-2.5">
            <tile.Icon className="size-10" />
            <span className="flex flex-col">
              <span className={NAME}>{tile.name}</span>
              <span className={LABEL}>{tile.category}</span>
            </span>
          </div>
          <span className={cn(CHIP, "bg-primary text-primary-foreground")}>{tile.commission} recurring</span>
        </>
      );
    case "notification":
      return (
        <>
          <div className="flex items-center gap-2">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-[6px] bg-primary">
              <LogoMark className="size-3.5 fill-primary-foreground" />
            </span>
            <span className="flex-1 text-xs font-bold">boostlink</span>
            <span className={LABEL}>now</span>
          </div>
          <span className="text-[13px] leading-[1.35] font-semibold">
            {tile.text}
            {tile.amount ? (
              <>
                {" "}
                <span className={cn(KEY_PHRASE, "font-bold")}>{tile.amount}</span>
              </>
            ) : null}
          </span>
        </>
      );
    case "link":
      return (
        <>
          <div className="flex items-center gap-2.5">
            <PlatformLogoTile platform={tile.platform} size={32} className={platformTileClass(tile.platform, "rounded-[9px]")} />
            <span className="truncate font-mono text-xs text-foreground/80">{tile.path}</span>
          </div>
          <span className={BIG}>{tile.clicks}</span>
          <span className={LABEL}>clicks this month</span>
        </>
      );
    case "creator":
      return (
        <div className="flex items-center gap-2.5">
          <CreatorFace index={tile.face} className="size-11" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={NAME}>{tile.handle}</span>
            <span className={LABEL}>{tile.followers} followers</span>
          </span>
          <PlatformLogoTile platform={tile.platform} size={24} className={platformTileClass(tile.platform, "rounded-[7px]")} />
        </div>
      );
    case "stat":
      return (
        <>
          <span className={LABEL}>{tile.label}</span>
          <span className={BIG}>{tile.value}</span>
          <span className="block h-1.5 rounded-full bg-muted">
            <span className="block h-full w-[62%] rounded-full bg-muted-foreground" />
          </span>
        </>
      );
    case "payout":
      return (
        <>
          <div className="flex items-center justify-between">
            <span className={LABEL}>Payout</span>
            <span className={cn(CHIP, "bg-muted")}>Paid</span>
          </div>
          <span className={BIG}>$124.40</span>
          <span className={LABEL}>Sent to your bank</span>
        </>
      );
  }
}

/** One copy of a column's tiles, with the gap below the last one so the copies stack evenly. */
function TileSet({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="flex flex-col gap-5 pb-5">
      {tiles.map((tile, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col gap-2.5 rounded-[20px] border p-4 text-left",
            tile.kind === "notification" ? "bg-background" : "bg-card",
          )}
        >
          <TileContent tile={tile} />
        </div>
      ))}
    </div>
  );
}

/**
 * The New era graphic: a wall of boostlink pieces (apps with commissions,
 * creators, link clicks, notifications, earnings) tilted flat, its columns
 * drifting up and down in a seamless loop. Runs only while on screen and not
 * at all with reduced motion. Oval fade at the edges; scaled down below lg,
 * where it runs edge to edge.
 */
export function NewEraMarquee() {
  const box = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      role="img"
      aria-label="A tilted wall of boostlink pieces: apps with commissions, creators, link clicks and earnings."
      className="relative -mx-4 h-[330px] justify-self-stretch overflow-hidden [mask-image:radial-gradient(closest-side,black_45%,transparent)] sm:-mx-6 lg:col-start-1 lg:row-start-1 lg:mx-0 lg:h-[440px]"
    >
      {/* The 620×440 desktop frame, centered in the box and scaled down below lg. */}
      <div aria-hidden className="absolute top-1/2 left-1/2 h-[440px] w-[620px] -translate-1/2 scale-[0.63] lg:scale-100">
        <div
          data-running={running || undefined}
          className={cn(
            styles.wall,
            // items-start: each column keeps its own height, so -20% is exactly one copy.
            // The tilt pivots on a fixed point (the middle of a two-copy wall), so the
            // number of copies doesn't move the picture.
            "absolute -top-[470px] -left-[150px] grid w-[1180px] origin-[590px_622px] grid-cols-4 items-start gap-5 [transform:rotateX(55deg)_rotateZ(-45deg)]",
          )}
        >
          {COLUMNS.map((tiles, index) => (
            <div
              key={index}
              className={cn(styles.column, index % 2 === 1 && styles.reverse)}
              style={{ animationDelay: `${-index * COLUMN_DELAY_S}s` }}
            >
              {Array.from({ length: COPIES }, (_, copy) => (
                <TileSet key={copy} tiles={tiles} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
