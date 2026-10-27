"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { cn } from "@/lib/utils";

export type LogoCloudApp = { slug: string; name: string; logoUrl: string | null };

type Tile = { kind: "app"; app: LogoCloudApp } | { kind: "empty" };

/** Rows differ in direction and pace so the cloud never moves in lockstep. */
// Negative delays start each row at a different point, so they don't line up as a grid.
const ROWS = [
  { direction: "left", timing: "[--animation-duration:46s]!" },
  { direction: "right", timing: "[--animation-duration:54s]! [&>ul]:[animation-delay:-19s]" },
  { direction: "left", timing: "[--animation-duration:50s]! [&>ul]:[animation-delay:-8s]" },
] as const;

/** Enough tiles per row that a few apps still fill a wide screen before the loop repeats. */
const MIN_TILES = 14;

function rowTiles(apps: LogoCloudApp[], offset: number): Tile[] {
  const rotated = [...apps.slice(offset % apps.length), ...apps.slice(0, offset % apps.length)];
  const tiles: Tile[] = [];
  while (tiles.length < MIN_TILES) {
    for (const app of rotated) tiles.push({ kind: "app", app }, { kind: "empty" });
  }
  return tiles;
}

function AppLogo({ app, className }: { app: LogoCloudApp; className?: string }) {
  return app.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={app.logoUrl} alt="" loading="lazy" className={cn("rounded-lg object-contain", className)} />
  ) : (
    <span aria-hidden className={cn("grid place-items-center rounded-lg bg-foreground font-bold text-background", className)}>
      {app.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

const tileClass = "flex h-14 w-24 items-center justify-center rounded-2xl border sm:h-16 sm:w-28";

/** `focusable={false}` in the moving rows: they repeat every logo, and the cards below are the keyboard path. */
function LogoTile({ tile, focusable = true }: { tile: Tile; focusable?: boolean }) {
  if (tile.kind === "empty") {
    return <div aria-hidden className={cn(tileClass, "border-dashed bg-muted/30")} />;
  }
  return (
    <Link
      href={`/apps/${tile.app.slug}`}
      aria-label={tile.app.name}
      title={tile.app.name}
      tabIndex={focusable ? undefined : -1}
      className={cn(tileClass, "bg-card outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50")}
    >
      <AppLogo app={tile.app} className="size-9 sm:size-10" />
    </Link>
  );
}

/**
 * Logos of the apps on the current catalog page, in three rows that scroll
 * in alternating directions. With reduced motion it is a static grid.
 */
export function LogoCloud({ apps }: { apps: LogoCloudApp[] }) {
  const [paused, setPaused] = useState(false);
  if (apps.length === 0) return null;

  return (
    <section aria-label="Apps on boostlink" className="flex flex-col">
      <div aria-hidden className={cn("flex flex-col motion-reduce:hidden", paused && "[&_ul]:[animation-play-state:paused]")}>
        {ROWS.map((row, i) => (
          <InfiniteMovingCards
            key={i}
            items={rowTiles(apps, i * 2)}
            renderItem={(tile) => <LogoTile tile={tile} focusable={false} />}
            getKey={(tile, index) => (tile.kind === "app" ? `${tile.app.slug}-${index}` : `empty-${index}`)}
            direction={row.direction}
            speed="normal"
            pauseOnHover
            className={cn(
              "z-0 max-w-none [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [&>ul]:py-1.5",
              row.timing,
            )}
          />
        ))}
      </div>

      {/* WCAG 2.2.2: anything moving for more than 5 s needs a way to stop it. */}
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        className="mt-1 inline-flex size-8 self-end items-center justify-center rounded-full border bg-background text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hidden"
      >
        {paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
        <span className="sr-only">{paused ? "Play app logos" : "Pause app logos"}</span>
      </button>

      <ul className="hidden flex-wrap justify-center gap-3 motion-reduce:flex">
        {apps.map((app) => (
          <li key={app.slug}>
            <LogoTile tile={{ kind: "app", app }} />
          </li>
        ))}
      </ul>
    </section>
  );
}
