import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import {
  courseCategories as sampleCourseCategories,
  leadsByCategory as sampleLeadsByCategory,
  leadsOverTime as sampleLeadsOverTime,
  leadStatusBreakdown as sampleLeadStatusBreakdown,
  recentLeads as sampleRecentLeads,
  totalCourses as sampleTotalCourses,
} from "@/lib/mock-data"
import {
  LEAD_STATUSES,
  type AdminDashboardData,
  type CategoryCount,
  type DailyCount,
  type Lead,
  type LeadChannel,
  type LeadStatus,
  type StatusCount,
} from "@/lib/types"

const OVER_TIME_DAYS = 14
const WINDOW_DAYS = 30
const RECENT_LEADS_LIMIT = 8

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function isLeadStatus(value: string | null | undefined): value is LeadStatus {
  return !!value && (LEAD_STATUSES as string[]).includes(value)
}

function sampleBundle(): AdminDashboardData {
  const totalLeads30d = sampleLeadsByCategory.reduce((s, c) => s + c.leads, 0)
  const enrolled = sampleLeadStatusBreakdown.find((s) => s.status === "Enrolled")?.count ?? 0
  const statusTotal = sampleLeadStatusBreakdown.reduce((s, c) => s + c.count, 0)

  return {
    usingSampleData: true,
    totalCourses: sampleTotalCourses,
    coursesByCategory: sampleCourseCategories.map((c) => ({
      category: c.category,
      count: c.courseCount,
    })),
    leadsByCategory: sampleLeadsByCategory.map((c) => ({
      category: c.category,
      count: c.leads,
    })),
    leadsOverTime: sampleLeadsOverTime,
    leadStatusBreakdown: sampleLeadStatusBreakdown,
    recentLeads: sampleRecentLeads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      courseTitle: l.course,
      category: l.category,
      status: l.status,
      channel: "WhatsApp",
      callbackRequested: l.callbackRequested,
      createdAt: l.createdAt,
    })),
    stats: {
      totalLeads30d,
      todayLeads: sampleLeadsOverTime[sampleLeadsOverTime.length - 1]?.leads ?? 0,
      callbackRequests30d: sampleLeadsOverTime.reduce((s, d) => s + d.callbacks, 0),
      conversionRate: statusTotal
        ? Math.round((enrolled / statusTotal) * 1000) / 10
        : 0,
    },
  }
}

interface CourseRow {
  category: string | null
}

interface EnquiryCourseJoin {
  title: string | null
  category: string | null
}

interface EnquiryRow {
  id: string
  name: string
  phone: string
  course: string | null
  status: string | null
  channel: string | null
  callback_requested: boolean | null
  created_at: string
  courses: EnquiryCourseJoin | EnquiryCourseJoin[] | null
}

function resolveJoinedCourse(
  courses: EnquiryRow["courses"]
): EnquiryCourseJoin | null {
  if (!courses) return null
  return Array.isArray(courses) ? (courses[0] ?? null) : courses
}

/**
 * Fetches everything the admin dashboard needs from Supabase in parallel.
 * Falls back to bundled sample data (lib/mock-data.ts) whenever the
 * service role key isn't configured yet, or a query fails, so the
 * dashboard always renders something sensible.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return sampleBundle()
  }

  const since30d = daysAgoIso(WINDOW_DAYS)

  const [coursesRes, enquiriesRes, registrationsRes] = await Promise.all([
    supabase.from("courses").select("category"),
    supabase
      .from("enquiries")
      .select(
        "id,name,phone,course,status,channel,callback_requested,created_at,courses(title,category)"
      )
      .gte("created_at", since30d)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_registrations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30d),
  ])

  if (coursesRes.error || enquiriesRes.error) {
    console.error(
      "[queries] getAdminDashboardData failed, falling back to sample data:",
      coursesRes.error ?? enquiriesRes.error
    )
    return sampleBundle()
  }

  const courseRows = (coursesRes.data ?? []) as CourseRow[]
  const enquiryRows = (enquiriesRes.data ?? []) as EnquiryRow[]
  const registrationsCount = registrationsRes.count ?? 0

  // Courses by category (full catalog, not time-windowed)
  const courseCategoryCounts = new Map<string, number>()
  for (const row of courseRows) {
    const key = row.category ?? "Uncategorized"
    courseCategoryCounts.set(key, (courseCategoryCounts.get(key) ?? 0) + 1)
  }
  const coursesByCategory: CategoryCount[] = Array.from(
    courseCategoryCounts,
    ([category, count]) => ({ category, count })
  ).sort((a, b) => b.count - a.count)

  // Leads by category (last 30 days, via the enquiries -> courses join)
  const leadCategoryCounts = new Map<string, number>()
  for (const row of enquiryRows) {
    const joined = resolveJoinedCourse(row.courses)
    const key = joined?.category ?? (row.course ? row.course : "Uncategorized")
    leadCategoryCounts.set(key, (leadCategoryCounts.get(key) ?? 0) + 1)
  }
  const leadsByCategory: CategoryCount[] = Array.from(
    leadCategoryCounts,
    ([category, count]) => ({ category, count })
  ).sort((a, b) => b.count - a.count)

  // Enquiries over the last 14 days, bucketed by day
  const dayBuckets = new Map<string, { leads: number; callbacks: number }>()
  for (let i = OVER_TIME_DAYS - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayBuckets.set(dayLabel(d), { leads: 0, callbacks: 0 })
  }
  const overTimeCutoff = new Date()
  overTimeCutoff.setDate(overTimeCutoff.getDate() - (OVER_TIME_DAYS - 1))
  overTimeCutoff.setHours(0, 0, 0, 0)
  for (const row of enquiryRows) {
    const created = new Date(row.created_at)
    if (created < overTimeCutoff) continue
    const key = dayLabel(created)
    const bucket = dayBuckets.get(key)
    if (!bucket) continue
    bucket.leads += 1
    if (row.callback_requested) bucket.callbacks += 1
  }
  const leadsOverTime: DailyCount[] = Array.from(dayBuckets, ([date, v]) => ({
    date,
    ...v,
  }))

  // Status funnel (last 30 days), always includes every status even at 0
  const statusCounts = new Map<LeadStatus, number>(
    LEAD_STATUSES.map((s) => [s, 0])
  )
  for (const row of enquiryRows) {
    const status = isLeadStatus(row.status) ? row.status : "New"
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
  }
  const leadStatusBreakdown: StatusCount[] = LEAD_STATUSES.map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
  }))

  const recentLeads: Lead[] = enquiryRows.slice(0, RECENT_LEADS_LIMIT).map((row) => {
    const joined = resolveJoinedCourse(row.courses)
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      courseTitle: joined?.title ?? (row.course || null),
      category: joined?.category ?? null,
      status: isLeadStatus(row.status) ? row.status : "New",
      channel: (row.channel as LeadChannel) ?? "Website",
      callbackRequested: !!row.callback_requested,
      createdAt: row.created_at,
    }
  })

  const todayLeads = leadsOverTime[leadsOverTime.length - 1]?.leads ?? 0
  const callbackRequests30d = enquiryRows.filter((r) => r.callback_requested).length
  const enrolledCount = statusCounts.get("Enrolled") ?? 0
  const conversionBase = enquiryRows.length + registrationsCount
  const conversionRate = conversionBase
    ? Math.round(((enrolledCount + registrationsCount) / conversionBase) * 1000) / 10
    : 0

  return {
    usingSampleData: false,
    totalCourses: courseRows.length,
    coursesByCategory,
    leadsByCategory,
    leadsOverTime,
    leadStatusBreakdown,
    recentLeads,
    stats: {
      totalLeads30d: enquiryRows.length,
      todayLeads,
      callbackRequests30d,
      conversionRate,
    },
  }
}
