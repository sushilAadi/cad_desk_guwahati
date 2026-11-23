import type { Metadata } from "next"
import { SiteHeader } from "@/components/nav/site-header"
import { Storefront } from "@/components/home/storefront"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"

export const revalidate = 300

export const metadata: Metadata = {
  title: "CAD, CAM & IT Courses in Guwahati",
  description: "All CAD/CAM and IT courses at CAD Desk Guwahati, Noonmati: AutoCAD, Revit, SOLIDWORKS, 3ds Max and more, grouped by track. Classroom or live online.",
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
