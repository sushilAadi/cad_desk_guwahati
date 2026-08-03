"use client"

import {
  EvilAreaChart,
} from "@/components/evilcharts/charts/recharts-area-chart"
import type { ChartConfig } from "@/components/evilcharts/ui/recharts-chart"
import type { DailyCount } from "@/lib/types"

const chartConfig = {
  callbacks: {
    label: "Callback requests",
    colors: {
      light: ["var(--chart-4)"],
      dark: ["var(--chart-4)"],
    },
  },
  leads: {
    label: "Enquiries",
    colors: {
      light: ["var(--chart-1)"],
      dark: ["var(--chart-1)"],
    },
  },
} satisfies ChartConfig

export function LeadsOverTimeChart({ data }: { data: DailyCount[] }) {
  return (
    <EvilAreaChart
      config={chartConfig}
      data={data}
      className="h-[280px]"
      curveType="monotone"
      animationType="left-to-right"
      xDataKey="date"
    >
      <EvilAreaChart.Grid />
      <EvilAreaChart.XAxis dataKey="date" />
      <EvilAreaChart.YAxis />
      <EvilAreaChart.Tooltip variant="frosted-glass" />
      <EvilAreaChart.Area dataKey="callbacks" variant="gradient" strokeVariant="solid">
        <EvilAreaChart.Dot />
      </EvilAreaChart.Area>
      <EvilAreaChart.Area dataKey="leads" variant="gradient" strokeVariant="solid">
        <EvilAreaChart.Dot />
        <EvilAreaChart.ActiveDot />
      </EvilAreaChart.Area>
      <EvilAreaChart.Legend />
    </EvilAreaChart>
  )
}
