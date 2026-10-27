"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "./use-media-query";

const GAP = 20;
const DOT_RADIUS = 1;
const REACH = 120;
const MAX_PUSH = 5;
const TINT_REACH = 56;
/** Share of the remaining distance a dot covers per frame: a soft ease-out. */
const EASE = 0.14;
const BRAND_YELLOW = "#FFD600";

/** Faded towards the edges, same as the static grid. */
const MASK = "[mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]";

function StaticDots() {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.14] ${MASK} dark:opacity-[0.2]`}
    />
  );
}

/**
 * Hero dot grid. With a fine pointer, dots near the cursor drift away from it
 * (up to 5px within 120px) and ease back when it leaves; the closest ones get
 * a faint yellow tint. Drawn on canvas, at most once per animation frame and
 * only while something moves. Touch devices and reduced motion keep the CSS grid.
 */
export function HeroDotGrid() {
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)", false);
  const reducedMotion = usePrefersReducedMotion();
  if (!finePointer || reducedMotion) return <StaticDots />;
  return <InteractiveDots />;
}

function InteractiveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;

    let width = 0;
    let height = 0;
    let columns = 0;
    let offsets = new Float32Array(0); // x, y per dot
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = host!.clientWidth;
      height = host!.clientHeight;
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.ceil(width / GAP);
      offsets = new Float32Array(columns * Math.ceil(height / GAP) * 2);
      draw();
    }

    /** One frame: move every dot towards its target, paint, and report whether any is still moving. */
    function draw(): boolean {
      const style = getComputedStyle(canvas!);
      const dark = document.documentElement.classList.contains("dark");
      context!.clearRect(0, 0, width, height);
      let moving = false;
      const tinted: [number, number, number][] = [];

      context!.fillStyle = style.color;
      context!.globalAlpha = dark ? 0.2 : 0.14;
      context!.beginPath();
      for (let index = 0; index < offsets.length / 2; index++) {
        const baseX = (index % columns) * GAP + GAP / 2;
        const baseY = Math.floor(index / columns) * GAP + GAP / 2;
        let targetX = 0;
        let targetY = 0;
        let distance = Infinity;
        if (pointer) {
          const dx = baseX - pointer.x;
          const dy = baseY - pointer.y;
          distance = Math.hypot(dx, dy);
          if (distance < REACH && distance > 0.01) {
            const push = (1 - distance / REACH) * MAX_PUSH;
            targetX = (dx / distance) * push;
            targetY = (dy / distance) * push;
          }
        }
        const ox = offsets[index * 2] + (targetX - offsets[index * 2]) * EASE;
        const oy = offsets[index * 2 + 1] + (targetY - offsets[index * 2 + 1]) * EASE;
        const settled = Math.abs(targetX - ox) < 0.02 && Math.abs(targetY - oy) < 0.02;
        offsets[index * 2] = settled ? targetX : ox;
        offsets[index * 2 + 1] = settled ? targetY : oy;
        if (!settled) moving = true;

        const x = baseX + offsets[index * 2];
        const y = baseY + offsets[index * 2 + 1];
        context!.moveTo(x + DOT_RADIUS, y);
        context!.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        if (distance < TINT_REACH) tinted.push([x, y, 1 - distance / TINT_REACH]);
      }
      context!.fill();

      context!.fillStyle = BRAND_YELLOW;
      for (const [x, y, strength] of tinted) {
        context!.globalAlpha = 0.55 * strength;
        context!.beginPath();
        context!.arc(x, y, DOT_RADIUS + 0.25, 0, Math.PI * 2);
        context!.fill();
      }
      context!.globalAlpha = 1;
      return moving;
    }

    function tick() {
      frame = draw() ? requestAnimationFrame(tick) : 0;
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function handleMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const rect = host!.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      schedule();
    }
    function handleLeave() {
      pointer = null;
      schedule();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    // The theme toggle swaps the `dark` class; repaint in the new color.
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    host.addEventListener("pointermove", handleMove);
    host.addEventListener("pointerleave", handleLeave);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      themeObserver.disconnect();
      host.removeEventListener("pointermove", handleMove);
      host.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full text-foreground ${MASK}`}
    />
  );
}
