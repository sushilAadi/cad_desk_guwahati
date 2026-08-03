"use client"

import { Cell, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { StatusCount } from "@/lib/types"

const chartConfig = {
  count: { label: "Leads" },
  New: { label: "New", color: "var(--chart-1)" },
  Contacted: { label: "Contacted", color: "var(--chart-2)" },
  "Counseling Scheduled": {
    label: "Counseling Scheduled",
    color: "var(--chart-3)",
  },
  Enrolled: { label: "Enrolled", color: "var(--chart-4)" },
  Lost: { label: "Lost", color: "var(--chart-5)" },
} satisfies ChartConfig

export function LeadStatusChart({ data }: { data: StatusCount[] }) {
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    fill: `var(--color-${d.status})`,
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-auto h-[280px] w-full [&_.recharts-pie-label-text]:fill-foreground"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          strokeWidth={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} stroke="var(--background)" />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          verticalAlign="bottom"
        />
      </PieChart>
    </ChartContainer>
  )
}
