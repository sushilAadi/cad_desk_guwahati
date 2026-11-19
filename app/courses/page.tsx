import type { Metadata } from "next"
import { SiteHeader } from "@/components/nav/site-header"
import { Storefront } from "@/components/home/storefront"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Courses",
  description: "Every CAD/CAM and IT course at CAD Desk Guwahati, by track.",
  alternates: { canonical: "/courses" },
}

export default async function CoursesPage() {
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader groups={groups} totalCount={courses.length} />
      <Storefront groups={groups} mode="catalogue" />
    </div>
  )
}
