import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { FrameLines, FrameStrips } from "@/components/home/frame-lines"
import { SiteHeader } from "@/components/nav/site-header"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"
import { UNIVERSITIES } from "@/lib/universities"
import { SITE_NAME } from "@/lib/site"

export const revalidate = 300

const DISPLAY = "font-[family-name:var(--font-display)] uppercase tracking-[-0.01em]"
const find = (id: string) => UNIVERSITIES.find((u) => u.id === id && u.letter)

export function generateStaticParams() {
  return UNIVERSITIES.filter((u) => u.letter).map((u) => ({ id: u.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const u = find((await params).id)
  if (!u) return {}
  return {
    title: `Letter of appreciation from ${u.short}`,
    description: `${u.name} appreciated the training sessions ${SITE_NAME} conducted for its students.`,
    alternates: { canonical: `/appreciation/${u.id}` },
  }
}

export default async function AppreciationPage({ params }: { params: Promise<{ id: string }> }) {
  const u = find((await params).id)
  if (!u) notFound()
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader groups={groups} totalCount={courses.length} />
      <div className="relative bg-white">
        <FrameLines />
        <FrameStrips />
        <section className="relative px-5 pb-24 pt-10 md:px-[60px] lg:px-[100px] [&>*]:mx-auto [&>*]:max-w-[1440px]">
          <Link href="/#universities" className="inline-flex items-center gap-2 text-xs text-ink-3 transition-colors hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to universities
          </Link>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <h1 className={`${DISPLAY} text-[clamp(40px,6vw,88px)] leading-[0.95] text-ink`}>
              Letter of appreciation<span className="text-brand">.</span>
            </h1>
            <p className="max-w-[40ch] text-base leading-7 text-ink-2">
              {u.name}, {u.place}.
            </p>
          </div>
          <div className="mt-10 flex justify-center rounded-xl border border-line bg-paper-raised p-4 md:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.letter} alt={`Letter of appreciation from ${u.name}`} className="h-auto w-full max-w-[900px] bg-white shadow-[0_12px_40px_rgba(0,0,0,.12)]" />
          </div>
        </section>
      </div>
    </div>
  )
}
