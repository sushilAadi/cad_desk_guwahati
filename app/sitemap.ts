import type { MetadataRoute } from "next"
import { getPublicCourses } from "@/lib/public-courses"
import { courseSlugs } from "@/lib/course-slug"
import { SITE_URL } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getPublicCourses()
  const slugs = courseSlugs(courses)
  return [
    ...["", "/courses", "/privacy", "/terms", "/data-deletion"],
    ...courses.map((c) => `/courses/${slugs.get(c.id)}`),
  ].map((p) => ({ url: `${SITE_URL}${p}` }))
}
