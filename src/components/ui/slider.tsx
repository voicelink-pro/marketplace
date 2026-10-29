"use client"

import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

/**
 * A box over the thumb's range: Radix keeps the 22px thumb inside the track,
 * so its center sits at 11px + pct × (width − 22px). `left: pct%` on a child
 * lines up with the thumb at that value. Use it for marks and labels.
 */
function SliderScale({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-[11px]", className)} {...props}>
      <div className="relative size-full">{children}</div>
    </div>
  )
}

/** Position of `value` on the scale, in percent. */
function sliderPercent(value: number, min: number, max: number) {
  return max > min ? ((value - min) / (max - min)) * 100 : 0
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step = 1,
  ticks = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** A mark on the track at every step; marks inside the filled part follow `value`. */
  ticks?: boolean
}) {
  const values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min],
    [value, defaultValue, min]
  )
  const filledFrom = values.length > 1 ? Math.min(...values) : min
  const filledTo = Math.max(...values)
  const marks = ticks
    ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, index) => min + index * step)
    : []

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex w-full touch-none items-center py-2 select-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-foreground/15"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-foreground"
        />
      </SliderPrimitive.Track>
      {marks.length > 0 ? (
        // Above the track, below the thumbs (they come later in the DOM).
        <SliderScale
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2"
        >
          {marks.map((mark) => (
            <span
              key={mark}
              style={{ left: `${sliderPercent(mark, min, max)}%` }}
              className={cn(
                "absolute top-0 h-1.5 w-0.5 -translate-x-1/2",
                mark >= filledFrom && mark <= filledTo
                  ? "bg-background"
                  : "bg-muted-foreground/40"
              )}
            />
          ))}
        </SliderScale>
      ) : null}
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          // The thumb carries role="slider", so the label goes there.
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className="block size-[22px] shrink-0 rounded-full border-4 border-card bg-foreground ring-1 ring-foreground/20 transition-shadow outline-none hover:ring-3 hover:ring-ring/30 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider, SliderScale, sliderPercent }
