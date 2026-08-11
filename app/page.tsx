import { SiteHeader } from "@/components/nav/site-header"
import { Hero } from "@/components/home/hero"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"

export const dynamic = "force-dynamic"

export default async function Home() {
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#02088a]">
      {/* Nav */}
      <SiteHeader groups={groups} totalCount={courses.length} />

      {/* Hero */}
      <Hero totalCount={courses.length} />
    </div>
  )
}
