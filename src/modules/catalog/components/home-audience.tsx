"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** "Bubble" slide: a quick spring with a small overshoot before it settles. */
const PILL_SPRING = { type: "spring", bounce: 0.3, duration: 0.35 } as const;
/** Stretch toward the target, then back to round, over the same ~350ms. */
const PILL_STRETCH = { scaleX: [1, 1.14, 1], scaleY: [1, 0.94, 1] };

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

/**
 * Segmented control (ARIA radio group: one tab
 * stop, arrow keys move and select). The yellow pill slides to the chosen
 * option after a click or key press and snaps into place otherwise.
 */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onSelect,
  label,
  layoutId,
  fullWidth = false,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onSelect: (value: T) => void;
  label: string;
  /** Unique per mounted control, so two controls never share the pill. */
  layoutId: string;
  fullWidth?: boolean;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  // The last move made here: replays the stretch, anchored on the side it leaves from.
  const [move, setMove] = useState<{ id: number; towardEnd: boolean } | null>(null);
  // True from a click or key press until the pill settles: only then does it slide.
  // Mount, reload and route changes (which can shift the header) snap it into place.
  const [animating, setAnimating] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function select(next: T) {
    if (next === value) return;
    const from = options.findIndex((option) => option.value === value);
    const to = options.findIndex((option) => option.value === next);
    setMove((previous) => ({ id: (previous?.id ?? 0) + 1, towardEnd: to > from }));
    setAnimating(!reducedMotion);
    // Fallback in case no layout animation runs (and so never completes).
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setAnimating(false), 600);
    onSelect(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target: number;
    if (NEXT_KEYS.has(event.key)) target = (index + 1) % options.length;
    else if (PREVIOUS_KEYS.has(event.key)) target = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = options.length - 1;
    else return;
    event.preventDefault();
    buttons.current[target]?.focus();
    select(options[target].value);
  }

  return (
    <LayoutGroup id={layoutId}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          // overflow-hidden clips the pill's stretch to the toggle.
          "flex h-11 items-center overflow-hidden rounded-full border bg-background p-1 text-[15px] ring-4 ring-primary/15",
          fullWidth && "w-full",
        )}
      >
        {options.map((option, index) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => select(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative h-full rounded-full px-4 font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                fullWidth && "flex-1",
                checked ? "text-primary-foreground" : "text-muted-foreground hover:text-primary-ink",
              )}
            >
              {checked ? (
                // Shared pill: slides to the checked option after a user choice, appears in place otherwise.
                <motion.span
                  layoutId="pill"
                  initial={false}
                  transition={animating ? PILL_SPRING : { duration: 0 }}
                  onLayoutAnimationComplete={() => setAnimating(false)}
                  aria-hidden
                  className="absolute inset-0"
                >
                  <motion.span
                    key={move?.id ?? 0}
                    initial={animating ? undefined : false}
                    // Same `animate` on server and client (hydration); reduced motion just finishes it at once.
                    animate={PILL_STRETCH}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.35, times: [0, 0.35, 1], ease: "easeOut" }}
                    style={{ originX: move?.towardEnd ? 0 : 1 }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                </motion.span>
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
