import type { MetadataRoute } from "next"
import { getPublicCourses } from "@/lib/public-courses"
import { courseSlugs } from "@/lib/course-slug"
import { UNIVERSITIES } from "@/lib/universities"
import { SITE_URL } from "@/lib/site"

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getPublicCourses()
  const slugs = courseSlugs(courses)
  const now = new Date()
  const entry = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") =>
    ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority })
  return [
    entry("", 1, "weekly"),
    entry("/courses", 0.9, "weekly"),
    ...courses.map((c) => entry(`/courses/${slugs.get(c.id)}`, 0.8, "monthly")),
    entry("/enquiry", 0.7, "monthly"),
    ...UNIVERSITIES.filter((u) => u.letter).map((u) => entry(`/appreciation/${u.id}`, 0.5, "yearly")),
    ...["/privacy", "/terms", "/data-deletion"].map((p) => entry(p, 0.2, "yearly")),
  ]
}
