// Mock data for the CAD Desk Guwahati admin dashboard.
// Replace with live Supabase queries once the leads table is wired up.

export type CourseCategory =
  | "Civil CADD"
  | "Mechanical CADD"
  | "Electrical CADD"
  | "Architectural & Interior Design"
  | "Structural Engineering"
  | "IT & Software"

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Counseling Scheduled"
  | "Enrolled"
  | "Lost"

export interface Lead {
  id: string
  name: string
  phone: string
  category: CourseCategory
  course: string
  status: LeadStatus
  source: "WhatsApp"
  callbackRequested: boolean
  createdAt: string // ISO date
}

export const courseCategories: {
  category: CourseCategory
  courseCount: number
}[] = [
  { category: "Civil CADD", courseCount: 14 },
  { category: "Mechanical CADD", courseCount: 13 },
  { category: "Architectural & Interior Design", courseCount: 12 },
  { category: "Electrical CADD", courseCount: 10 },
  { category: "Structural Engineering", courseCount: 9 },
  { category: "IT & Software", courseCount: 8 },
]

export const totalCourses = courseCategories.reduce(
  (sum, c) => sum + c.courseCount,
  0
) // 66

// 14-day enquiry trend (WhatsApp lead captures per day)
export const leadsOverTime: { date: string; leads: number; callbacks: number }[] = [
  { date: "Jul 21", leads: 18, callbacks: 3 },
  { date: "Jul 22", leads: 22, callbacks: 4 },
  { date: "Jul 23", leads: 15, callbacks: 2 },
  { date: "Jul 24", leads: 27, callbacks: 6 },
  { date: "Jul 25", leads: 24, callbacks: 5 },
  { date: "Jul 26", leads: 12, callbacks: 1 },
  { date: "Jul 27", leads: 9, callbacks: 1 },
  { date: "Jul 28", leads: 31, callbacks: 7 },
  { date: "Jul 29", leads: 29, callbacks: 6 },
  { date: "Jul 30", leads: 33, callbacks: 8 },
  { date: "Jul 31", leads: 26, callbacks: 4 },
  { date: "Aug 1", leads: 19, callbacks: 3 },
  { date: "Aug 2", leads: 14, callbacks: 2 },
  { date: "Aug 3", leads: 21, callbacks: 5 },
]

// Enquiries captured per course category (last 30 days)
export const leadsByCategory: { category: CourseCategory; leads: number }[] = [
  { category: "Civil CADD", leads: 96 },
  { category: "Mechanical CADD", leads: 84 },
  { category: "Architectural & Interior Design", leads: 71 },
  { category: "Electrical CADD", leads: 52 },
  { category: "IT & Software", leads: 44 },
  { category: "Structural Engineering", leads: 38 },
]

// Lead funnel status breakdown (last 30 days)
export const leadStatusBreakdown: { status: LeadStatus; count: number }[] = [
  { status: "New", count: 118 },
  { status: "Contacted", count: 96 },
  { status: "Counseling Scheduled", count: 61 },
  { status: "Enrolled", count: 42 },
  { status: "Lost", count: 68 },
]

export const recentLeads: Lead[] = [
  {
    id: "L-4821",
    name: "Ankita Baruah",
    phone: "+91 98640 1XX21",
    category: "Civil CADD",
    course: "AutoCAD Civil + STAAD Pro",
    status: "Counseling Scheduled",
    source: "WhatsApp",
    callbackRequested: true,
    createdAt: "2026-08-03T09:12:00+05:30",
  },
  {
    id: "L-4820",
    name: "Rohit Deka",
    phone: "+91 94350 2XX87",
    category: "Mechanical CADD",
    course: "SolidWorks + AutoCAD Mechanical",
    status: "New",
    source: "WhatsApp",
    callbackRequested: false,
    createdAt: "2026-08-03T08:47:00+05:30",
  },
  {
    id: "L-4819",
    name: "Priyanka Sharma",
    phone: "+91 90020 3XX44",
    category: "Architectural & Interior Design",
    course: "Revit Architecture + 3ds Max",
    status: "Contacted",
    source: "WhatsApp",
    callbackRequested: true,
    createdAt: "2026-08-02T18:30:00+05:30",
  },
  {
    id: "L-4818",
    name: "Manas Pratim Bora",
    phone: "+91 88760 4XX09",
    category: "IT & Software",
    course: "Full Stack Web Development",
    status: "Enrolled",
    source: "WhatsApp",
    callbackRequested: false,
    createdAt: "2026-08-02T16:05:00+05:30",
  },
  {
    id: "L-4817",
    name: "Farhana Yasmin",
    phone: "+91 97070 5XX63",
    category: "Electrical CADD",
    course: "AutoCAD Electrical + ETAP",
    status: "New",
    source: "WhatsApp",
    callbackRequested: false,
    createdAt: "2026-08-02T14:22:00+05:30",
  },
  {
    id: "L-4816",
    name: "Sourav Kalita",
    phone: "+91 96130 6XX18",
    category: "Structural Engineering",
    course: "STAAD Pro + ETABS",
    status: "Lost",
    source: "WhatsApp",
    callbackRequested: false,
    createdAt: "2026-08-01T20:11:00+05:30",
  },
  {
    id: "L-4815",
    name: "Nayanmoni Gogoi",
    phone: "+91 91270 7XX92",
    category: "Civil CADD",
    course: "Primavera P6 + MS Project",
    status: "Contacted",
    source: "WhatsApp",
    callbackRequested: true,
    createdAt: "2026-08-01T12:48:00+05:30",
  },
  {
    id: "L-4814",
    name: "Bidisha Chakraborty",
    phone: "+91 89960 8XX35",
    category: "Architectural & Interior Design",
    course: "Interior Design + SketchUp",
    status: "Counseling Scheduled",
    source: "WhatsApp",
    callbackRequested: false,
    createdAt: "2026-07-31T17:03:00+05:30",
  },
]

export const dashboardStats = {
  totalLeads30d: leadsByCategory.reduce((s, c) => s + c.leads, 0),
  todayLeads: leadsOverTime[leadsOverTime.length - 1].leads,
  callbackRequests30d: leadsOverTime.reduce((s, d) => s + d.callbacks, 0),
  conversionRate:
    Math.round(
      (leadStatusBreakdown.find((s) => s.status === "Enrolled")!.count /
        leadStatusBreakdown.reduce((s, c) => s + c.count, 0)) *
        1000
    ) / 10,
}
