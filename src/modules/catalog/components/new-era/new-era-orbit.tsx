"use client";

import { Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CREATOR_COUNT, CreatorAvatar } from "./creator-avatars";
import styles from "./new-era.module.css";

/** Spoke angles, clockwise from the top; one creator per spoke. */
const SPOKES = Array.from({ length: CREATOR_COUNT }, (_, index) => -90 + index * 45);
/** Start delays (s) of the two view dots on each spoke, so the flow never pulses in step. */
const VIEW_DELAYS: [number, number][] = [
  [0, 1.4],
  [0.7, 2.1],
  [0.3, 1.7],
  [1, 2.4],
  [0.5, 1.9],
  [1.2, 2.6],
  [0.2, 1.6],
  [0.9, 2.3],
];
const BEAM_STAGGER_S = 0.4;

function Views({ count }: { count: string }) {
  return (
    <>
      <Eye className="size-3.5 text-muted-foreground" />
      {count} views
    </>
  );
}

function Earned({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="size-1.5 rounded-full bg-primary" />
      {children}
    </>
  );
}

/** Example numbers, consistent with the rest of the page (20% of a $39 plan = $7.80). */
const CHIPS: { left: number; top: number; delay: number; content: React.ReactNode }[] = [
  { left: 34, top: 118, delay: 0, content: <Views count="12.4k" /> },
  { left: 548, top: 84, delay: 2, content: <Views count="3.1k" /> },
  { left: 572, top: 590, delay: 4, content: <Views count="860" /> },
  { left: 296, top: 446, delay: 1, content: <Earned>+1 customer</Earned> },
  {
    left: 290,
    top: 240,
    delay: 3.5,
    content: (
      <Earned>
        +$7.80 <span className="font-semibold text-muted-foreground">/ month</span>
      </Earned>
    ),
  },
];

/** Generic app icon: violet squircle with four tiles. */
function AppIcon() {
  return (
    <svg viewBox="0 0 64 64" className="block size-16">
      <rect width="64" height="64" rx="16" className="fill-side-apps" />
      <rect x="15" y="15" width="15" height="15" rx="4.5" fill="#FFFFFF" />
      <rect x="34" y="15" width="15" height="15" rx="4.5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="15" y="34" width="15" height="15" rx="4.5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="34" y="34" width="15" height="15" rx="4.5" className="fill-primary" />
    </svg>
  );
}

/**
 * Eight creators around an app. The spokes turn slowly; views flow into each
 * creator and a yellow beam carries them on to the app. Laid out on a fixed
 * 720×720 stage, scaled to 0.45 on phones, 0.55 from sm and 0.65 from lg.
 * Animations run only while the graphic is on screen (new-era.module.css).
 */
export function NewEraOrbit() {
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
    <div ref={box} className="relative size-[324px] shrink-0 sm:size-[396px] lg:size-[468px]">
      <div
        role="img"
        aria-label="Eight creators around an app. Views flow into each creator and turn into customers for the app in the middle."
        data-running={running || undefined}
        className={cn(styles.stage, "absolute top-0 left-0 size-[720px] origin-top-left scale-[0.45] sm:scale-[0.55] lg:scale-[0.65]")}
      >
        <div aria-hidden className="absolute inset-0">
          {/* Same dot grid as the hero, faded out from the middle. */}
          <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.14] [mask-image:radial-gradient(circle_at_center,black,transparent_68%)] dark:opacity-[0.2]" />
          <div className="absolute top-[150px] left-[150px] size-[420px] rounded-full border" />
          <div className="absolute top-[14px] left-[14px] size-[692px] rounded-full border border-dashed border-border/70" />

          <div className={cn(styles.spin, "absolute inset-0")}>
            {SPOKES.map((angle, index) => (
              // A zero-size point at the center, turned to the spoke's angle; children sit along its x axis.
              <div
                key={angle}
                className="absolute top-[360px] left-[360px] size-0 origin-top-left"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span className="absolute -top-px left-[72px] h-0.5 w-[100px] rounded-full bg-border" />
                <span
                  className={cn(styles.beam, "absolute -top-[1.5px] left-0 h-[3px] w-[26px] rounded-full bg-primary")}
                  style={{ animationDelay: `${index * BEAM_STAGGER_S}s` }}
                />
                {VIEW_DELAYS[index].map((delay) => (
                  <span
                    key={delay}
                    className={cn(styles.view, "absolute -top-[3px] left-0 size-1.5 rounded-full bg-muted-foreground")}
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
                <div className="absolute top-0 left-[210px] size-0" style={{ transform: `rotate(${-angle}deg)` }}>
                  <div className={cn(styles.upright, "absolute -top-10 -left-10 size-20")}>
                    <CreatorAvatar index={index} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {[0, 1.6].map((delay) => (
            <div
              key={delay}
              className={cn(styles.pulse, "absolute top-[296px] left-[296px] size-32 rounded-[38px] border-[1.5px] border-primary")}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
          <div className="absolute top-[296px] left-[296px] flex size-32 flex-col items-center justify-center gap-2 rounded-[38px] border bg-card">
            <AppIcon />
            <span className="text-[13px] font-bold text-foreground/80">App</span>
          </div>

          {CHIPS.map((chip) => (
            <span
              key={`${chip.left}-${chip.top}`}
              className={cn(
                styles.chip,
                "absolute inline-flex h-8 items-center gap-[7px] rounded-full border bg-card px-[13px] text-[13px] font-bold whitespace-nowrap",
              )}
              style={{ left: chip.left, top: chip.top, animationDelay: `${chip.delay}s` }}
            >
              {chip.content}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
