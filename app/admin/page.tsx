import { CalendarDays, DatabaseZap, PhoneCall, TrendingUp, Users } from "lucide-react"

import { LeadStatusChart } from "@/components/charts/lead-status-chart"
import { LeadsByCategoryChart } from "@/components/charts/leads-by-category-chart"
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time-chart"
import { RecentLeadsTable } from "@/components/admin/recent-leads-table"
import { StatCard } from "@/components/admin/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAdminDashboardData } from "@/lib/queries"

// Reads live data from Supabase on every request — this page should never
// be statically prerendered, since the numbers change as leads come in.
export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const {
    usingSampleData,
    totalCourses,
    leadsByCategory,
    leadsOverTime,
    leadStatusBreakdown,
    recentLeads,
    stats,
  } = await getAdminDashboardData()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            Enquiry dashboard
          </h1>
          {usingSampleData ? (
            <Badge variant="warning" className="gap-1">
              <DatabaseZap className="size-3" />
              Sample data — connect Supabase to see live leads
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          WhatsApp lead capture across {totalCourses} courses &middot; fees are
          never quoted by the bot &mdash; counseling only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enquiries (30d)"
          value={stats.totalLeads30d.toLocaleString("en-IN")}
          icon={Users}
        />
        <StatCard
          label="Today's enquiries"
          value={stats.todayLeads.toString()}
          icon={CalendarDays}
          hint="via WhatsApp Cloud API"
        />
        <StatCard
          label="Callback requests (30d)"
          value={stats.callbackRequests30d.toString()}
          icon={PhoneCall}
          hint="escalated to counseling team"
        />
        <StatCard
          label="Enrollment conversion"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Enquiries over time</CardTitle>
            <CardDescription>
              Daily WhatsApp leads vs. callback requests, last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsOverTimeChart data={leadsOverTime} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead status</CardTitle>
            <CardDescription>Funnel breakdown, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadStatusChart data={leadStatusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Enquiries by category</CardTitle>
            <CardDescription>Last 30 days, across the course catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsByCategoryChart data={leadsByCategory} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent leads</CardTitle>
            <CardDescription>
              Latest student enquiries captured from WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLeadsTable leads={recentLeads} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
