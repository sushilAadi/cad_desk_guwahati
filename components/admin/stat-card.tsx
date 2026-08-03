import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="flex items-start justify-between px-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-sm">{label}</span>
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {hint ? (
            <span className="text-muted-foreground text-xs">{hint}</span>
          ) : null}
          {trend ? (
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value} vs last period
            </span>
          ) : null}
        </div>
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  )
}
