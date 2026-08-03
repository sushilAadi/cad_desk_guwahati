"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { CategoryCount } from "@/lib/types"

const chartConfig = {
  count: {
    label: "Enquiries",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function LeadsByCategoryChart({ data }: { data: CategoryCount[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
      >
        <defs>
          <linearGradient id="fillCategoryBar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} hide allowDecimals={false} />
        <YAxis
          dataKey="category"
          type="category"
          tickLine={false}
          axisLine={false}
          width={150}
          tickMargin={8}
          className="text-xs"
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="count" fill="url(#fillCategoryBar)" radius={[0, 6, 6, 0]}>
          <LabelList
            dataKey="count"
            position="right"
            className="fill-foreground text-xs font-medium"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
