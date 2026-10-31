"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { type ComponentPropsWithoutRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  /** Seconds before the count starts once in view. */
  delay?: number;
  /** Seconds the count takes. */
  duration?: number;
  decimalPlaces?: number;
}

/**
 * Magic UI's Number Ticker (magicui.design/r/number-ticker), adapted: a timed
 * ease-out tween instead of a spring, no color or tracking of its own, and
 * with reduced motion the final value right away. Counts once, when it first
 * scrolls into view; en-US grouping ("12,345").
 */
export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  duration = 1.5,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const reducedMotion = useReducedMotion();
  const from = direction === "down" ? value : startValue;
  const to = direction === "down" ? startValue : value;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = (latest: number) =>
      Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(latest.toFixed(decimalPlaces)));

    if (reducedMotion) {
      node.textContent = format(to);
      return;
    }
    if (!isInView) return;
    const controls = animate(from, to, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    return () => controls.stop();
  }, [isInView, reducedMotion, from, to, delay, duration, decimalPlaces]);

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} {...props}>
      {Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(from)}
    </span>
  );
}
