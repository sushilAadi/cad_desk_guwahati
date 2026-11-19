import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface PublicCourse {
  id: string
  title: string
  caption: string | null
  category: string
  duration: string | null
  certification: boolean
  image: string | null
  lessons: string | null
}

// Used only if Supabase isn't reachable/configured, so the homepage still
// renders something reasonable instead of an empty section.
const FALLBACK_CATEGORIES = [
  "Civil / Architecture",
  "Mechanical",
  "CS/IT",
  "Electrical",
  "Creative Arts",
]

export async function getPublicCourses(): Promise<PublicCourse[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, caption, category, duration, certification, image, lessons")
    .order("category", { ascending: true })
    .order("title", { ascending: true })

  if (error || !data) {
    console.error("[public-courses] fetch failed:", error)
    return []
  }

  return data as PublicCourse[]
}

export function groupByCategory(
  courses: PublicCourse[]
): { category: string; courses: PublicCourse[] }[] {
  const categories =
    courses.length > 0
      ? Array.from(new Set(courses.map((c) => c.category)))
      : FALLBACK_CATEGORIES

  return categories.map((category) => ({
    category,
    courses: courses.filter((c) => c.category === category),
  }))
}

export interface CourseDetail {
  description: string | null
  banner: string | null
  students: string | null
  difficulty: string[]
  languages: string[]
  prerequisites: string | null
  assignment: string | null
  toc: { title: string; detail: string[] }[]
  materials: string[]
  resources: string[]
}

// the extra columns are JSON stored as text; a bad value must not break the page
function json<T>(v: unknown, fallback: T): T {
  if (v && typeof v === "object") return v as T // jsonb columns arrive already parsed
  if (typeof v !== "string" || !v.trim()) return fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}
const names = (v: unknown) =>
  json<unknown[]>(v, []).map((x) => (typeof x === "string" ? x : ((x as { label?: string })?.label ?? ""))).filter(Boolean)

/** Everything for one course page. Price is deliberately not selected. */
export async function getCourseDetail(id: string): Promise<CourseDetail | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from("courses")
    .select("description, banner, students, difficulty, languages, prerequisites, assignment, table_of_contents, materials, additional_resources")
    .eq("id", id)
    .maybeSingle()
  if (error || !data) return null
  const d = data as Record<string, unknown>
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
  return {
    description: s(d.description),
    banner: s(d.banner),
    students: s(d.students),
    difficulty: names(d.difficulty),
    languages: names(d.languages),
    prerequisites: s(d.prerequisites),
    assignment: s(d.assignment),
    toc: json<{ title?: string; detail?: string[] }[]>(d.table_of_contents, []).map((m) => ({
      title: m.title ?? "",
      detail: m.detail ?? [],
    })),
    materials: names(d.materials),
    resources: names(d.additional_resources),
  }
}
