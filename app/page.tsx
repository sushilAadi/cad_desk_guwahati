import { SiteHeader } from "@/components/nav/site-header"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"

export const dynamic = "force-dynamic"

export default async function Home() {
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Nav */}
      <SiteHeader groups={groups} totalCount={courses.length} />

      {/* First screen */}
      <section className="h-screen w-full bg-blue-600" />
    </div>
  )
}
