import type { Metadata } from "next"
import { FrameLines, FrameStrips } from "@/components/home/frame-lines"
import { SiteHeader } from "@/components/nav/site-header"
import { courseSlugs } from "@/lib/course-slug"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"
import { SITE_CONTACT_PHONE, SITE_CONTACT_PHONE_DISPLAY } from "@/lib/site"
import { EnquiryForm } from "./enquiry-form"

export const metadata: Metadata = {
  title: "Enquire or register",
  description: "Ask about a course or register your interest at CAD Desk Guwahati, Noonmati. Students and parents can fill in this form.",
  alternates: { canonical: "/enquiry" },
}

const DISPLAY = "font-[family-name:var(--font-display)] uppercase tracking-[-0.01em]"
const STEPS = [
  "Send this form. It takes about two minutes.",
  "Our team contacts you to talk about batch timings, fees and seats.",
  "Your seat is confirmed at our Noonmati centre.",
]

export default async function EnquiryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  // /enquiry?type=register&course=<slug> opens with the course already ticked
  const slugs = courseSlugs(courses)
  const wanted = [sp.course].flat().filter((s): s is string => !!s)
  const initialCourses = courses.filter((c) => wanted.includes(slugs.get(c.id) ?? "")).map((c) => c.id).slice(0, 10)
  const initialType = sp.type === "register" ? "register" : "enquiry"

  const whatsappHref = `https://wa.me/${SITE_CONTACT_PHONE.replace("+", "")}`

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader groups={groups} totalCount={courses.length} />
      <div className="relative bg-white">
        <FrameLines />
        <FrameStrips />
        <section className="relative px-5 pb-24 pt-10 md:px-[60px] lg:px-[100px] [&>*]:mx-auto [&>*]:max-w-[1440px]">
          <h1 className={`${DISPLAY} text-[clamp(44px,6.5vw,104px)] leading-[0.94] text-ink`}>
            Enquire or register<span className="text-brand">.</span>
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-8 text-ink-2">
            For students and parents. Tell us which course you are interested in and we will get back to you with batch timings, fees and seats.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-20">
            <EnquiryForm
              groups={groups.map((g) => ({ category: g.category, courses: g.courses.map((c) => ({ id: c.id, title: c.title })) }))}
              initialType={initialType}
              initialCourses={initialCourses}
              phoneDisplay={SITE_CONTACT_PHONE_DISPLAY}
              whatsappHref={whatsappHref}
            />

            <aside className="lg:sticky lg:top-[calc(var(--site-header)+1rem)] lg:self-start">
              <div className="rounded-2xl border border-line bg-paper-raised p-6 lg:p-8">
                <h2 className={`${DISPLAY} text-3xl leading-none text-ink`}>What happens next</h2>
                <ol className="mt-6 space-y-5">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex gap-4 text-base leading-7 text-ink-2">
                      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-brand text-sm text-ink">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-8 border-t border-line pt-6 text-base leading-7 text-ink-2">
                  <p>Prefer to talk? Call <a href={`tel:${SITE_CONTACT_PHONE}`} className="font-medium text-ink underline underline-offset-2">{SITE_CONTACT_PHONE_DISPLAY}</a>, or <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2">message us on WhatsApp</a>.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  )
}
