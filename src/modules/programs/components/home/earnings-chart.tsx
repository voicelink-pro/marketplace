"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

/** `value` is minor units as a number: only plotted, never shown or added up. */
export type ChartPoint = { month: string; value: number };

const config = { value: { label: "Earned", color: "var(--primary)" } } satisfies ChartConfig;

/** Six months of net commission: flat primary fill under a primary line, dashed grid. */
export function EarningsChart({ points }: { points: ChartPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto size-full" initialDimension={{ width: 600, height: 170 }}>
      <AreaChart data={points} margin={{ top: 36, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 6" className="stroke-border" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
        <YAxis hide domain={[0, "dataMax"]} />
        <Area
          dataKey="value"
          type="linear"
          stroke="var(--color-value)"
          strokeWidth={3}
          fill="var(--color-value)"
          fillOpacity={0.15}
          isAnimationActive={false}
          activeDot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
