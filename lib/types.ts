export type LeadStatus =
  | "New"
  | "Contacted"
  | "Counseling Scheduled"
  | "Enrolled"
  | "Lost"

export type LeadChannel = "WhatsApp" | "Website" | "Walk-in" | "Phone"

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Counseling Scheduled",
  "Enrolled",
  "Lost",
]

export interface Lead {
  id: string
  name: string
  phone: string
  courseTitle: string | null
  category: string | null
  status: LeadStatus
  channel: LeadChannel
  callbackRequested: boolean
  createdAt: string
}

export interface CategoryCount {
  category: string
  count: number
}

export interface DailyCount {
  date: string
  leads: number
  callbacks: number
  [key: string]: string | number
}

export interface StatusCount {
  status: LeadStatus
  count: number
}

export interface DashboardStats {
  totalLeads30d: number
  todayLeads: number
  callbackRequests30d: number
  conversionRate: number
}

export interface AdminDashboardData {
  usingSampleData: boolean
  totalCourses: number
  coursesByCategory: CategoryCount[]
  leadsByCategory: CategoryCount[]
  leadsOverTime: DailyCount[]
  leadStatusBreakdown: StatusCount[]
  recentLeads: Lead[]
  stats: DashboardStats
}
