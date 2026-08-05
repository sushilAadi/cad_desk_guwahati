import "server-only"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface PublicCourse {
  id: string
  title: string
  caption: string | null
  category: string
  duration: string | null
  certification: boolean
}

// Used only if Supabase isn't reachable/configured, so the homepage still
// renders something reasonable instead of an empty section.
const FALLBACK_CATEGORIES = [
  "Civil / Architecture",
  "Mechanical",
  "CS / IT",
  "Electrical",
  "Creative Arts",
]

export async function getPublicCourses(): Promise<PublicCourse[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, caption, category, duration, certification")
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
