import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { SiteHeader } from "@/components/nav/site-header"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"

export const dynamic = "force-dynamic"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about courses at CAD Desk Guwahati."
)}`

export default async function Home() {
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#02088a]">
      {/* Nav */}
      <SiteHeader groups={groups} totalCount={courses.length} />

      {/* Hero */}
      <section className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          {/* Left: copy */}
          <div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-blue-200/80">
              <span>Admissions Open</span>
              <span className="hidden sm:inline text-blue-400">•</span>
              <span>Noonmati, Guwahati</span>
              <span className="hidden sm:inline text-blue-400">•</span>
              <span>{courses.length}+ Courses</span>
            </div>

            <p className="mt-8 text-sm font-medium text-blue-200/80">
              Hi, we&apos;re CAD Desk Guwahati and we train you for
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              In-Demand CAD, CAM{" "}
              <span className="text-amber-400">&amp; IT Skills</span>
            </h1>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-zinc-950 transition-colors hover:bg-amber-300"
              >
                <ArrowUpRight className="h-4 w-4" />
                Enquire on WhatsApp
              </a>
              <p className="max-w-xs text-sm text-blue-100/80">
                Hands-on, project-based training across Civil, Mechanical,
                Electrical, CS/IT &amp; Creative Arts — certified at our
                Noonmati centre.
              </p>
            </div>
          </div>

          {/* Right: image */}
          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div className="relative overflow-hidden rounded-3xl bg-white p-3 shadow-2xl rotate-1">
              <img
                src="/images/hero/categories-collage.png"
                alt="CAD Desk Guwahati — Civil, CS/IT, Mechanical, Creative Arts and Electrical training"
                className="w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
