import type { Metadata } from "next"
import { ViewTransition } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Clock, Languages, Layers, MapPin, Monitor, ArrowRight, Gauge, FileText } from "lucide-react"
import { FrameLines, FrameStrips } from "@/components/home/frame-lines"
import { CourseBanner } from "@/components/home/course-banner"
import { ModuleTopics } from "@/components/home/module-topics"
import { SiteHeader } from "@/components/nav/site-header"
import { getCourseDetail, getPublicCourses, groupByCategory, type PublicCourse } from "@/lib/public-courses"
import { preload } from "react-dom"
import { webp, webpSet } from "@/lib/webp"
import { courseSlugs } from "@/lib/course-slug"
import { SITE_NAME, SITE_PHONE, SITE_URL } from "@/lib/site"

export const revalidate = 300

const DISPLAY = "font-[family-name:var(--font-display)] uppercase tracking-[-0.01em]"

async function load(slug: string) {
  const courses = await getPublicCourses()
  const slugs = courseSlugs(courses)
  const course = courses.find((c) => slugs.get(c.id) === slug)
  return { courses, slugs, course }
}

export async function generateStaticParams() {
  const courses = await getPublicCourses()
  const slugs = courseSlugs(courses)
  return courses.map((c) => ({ slug: slugs.get(c.id)! }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { course } = await load((await params).slug)
  if (!course) return {}
  const full = (await getCourseDetail(course.id))?.description ?? course.caption
  const desc = (full ?? `${course.title} course at ${SITE_NAME}: hands-on training with a certificate, in Noonmati or live online.`).replace(/\s+/g, " ").slice(0, 160)
  return {
    title: `${course.title} Course in Guwahati`,
    description: desc,
    alternates: { canonical: `/courses/${(await params).slug}` },
    openGraph: { title: `${course.title} | ${SITE_NAME}`, description: desc, images: course.image ? [webp(course.image, 1200, true)] : undefined },
  }
}

function Row({ icon: Icon, k, v }: { icon: typeof Clock; k: string; v: string }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
      <span className="text-ink-2">{k}: <span className="font-medium text-ink">{v}</span></span>
    </li>
  )
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { courses, slugs, course } = await load(slug)
  if (!course) notFound()

  const detail = await getCourseDetail(course.id)
  const groups = groupByCategory(courses)
  const related = courses.filter((c) => c.category === course.category && c.id !== course.id).slice(0, 6)
  const days = course.duration ? `${course.duration} days` : "Flexible"
  const desc = detail?.description ?? course.caption ?? `${course.title} training at ${SITE_NAME}, taught hands-on.`
  const banner = detail?.banner ?? null
  // start downloading the banner before the page body is parsed
  if (banner) preload(webp(banner, 1080), { as: "image", fetchPriority: "high", imageSrcSet: webpSet(banner), imageSizes: "(min-width: 1024px) 860px, 100vw" })
  const url = `${SITE_URL}/courses/${slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.title,
        description: desc,
        url,
        inLanguage: detail?.languages.length ? detail.languages : undefined,
        educationalLevel: detail?.difficulty.length ? detail.difficulty.join(", ") : undefined,
        syllabusSections: detail?.toc.length
          ? detail.toc.map((m) => ({ "@type": "Syllabus", name: m.title, description: m.detail.join(", ") }))
          : undefined,
        image: webp(banner ?? course.image ?? "", 1200, true) || undefined,
        provider: {
          "@type": "EducationalOrganization",
          name: SITE_NAME,
          url: SITE_URL,
          telephone: SITE_PHONE,
          address: { "@type": "PostalAddress", addressLocality: "Guwahati", addressRegion: "Assam", addressCountry: "IN" },
        },
        educationalCredentialAwarded: course.certification ? "CAD Desk certificate" : undefined,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: ["onsite", "online"],
          location: "Noonmati, Guwahati",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Home", item: SITE_URL },
          { name: "Courses", item: `${SITE_URL}/courses` },
          { name: course.category, item: `${SITE_URL}/courses?track=${encodeURIComponent(course.category)}` },
          { name: course.title, item: url },
        ].map((b, i) => ({ "@type": "ListItem", position: i + 1, ...b })),
      },
    ],
  }


  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader groups={groups} totalCount={courses.length} />
      <div className="relative bg-white">
      <FrameLines />
      <FrameStrips />
      <main className="relative px-5 pb-24 pt-6 md:px-[60px] lg:px-[100px] [&>*]:mx-auto [&>*]:max-w-[1440px]">
        <nav data-rule aria-label="Breadcrumb" className="text-xs text-ink-3">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
            <li><Link href="/courses" transitionTypes={["nav-back"]} className="hover:text-ink">Courses</Link> /</li>
            <li><Link href={`/courses?track=${encodeURIComponent(course.category)}`} className="hover:text-ink">{course.category}</Link> /</li>
            <li aria-current="page" className="text-ink-2">{course.title}</li>
          </ol>
        </nav>

        <div data-rule className="mt-6 grid gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          {/* left: cover, title, description, what's covered */}
          <article className="min-w-0">
            <CourseBanner course={course} banner={banner} alt={`${course.title} course at ${SITE_NAME}`} />
            <ViewTransition enter="text-rise" default="none">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-3">A {course.category} course at {SITE_NAME}</p>
            </ViewTransition>
            <ViewTransition name={`course-title-${course.id}`} share="morph">
            <h1 className={`${DISPLAY} mt-3 text-[clamp(36px,4.6vw,68px)] leading-[0.98]`}>
              {course.title}<span className="text-brand">.</span>
            </h1>
            </ViewTransition>

            <ViewTransition enter="text-rise" default="none">
              <p className="mt-6 max-w-[68ch] whitespace-pre-line text-base leading-7 text-ink-2">{desc}</p>
            </ViewTransition>
          </article>

          {/* right: sticky enrol panel */}
          <aside className="lg:sticky lg:top-[calc(var(--site-header)+1rem)] lg:self-start">
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line text-sm">
              <div className="flex items-center gap-3 border-r border-line p-3">
                <Layers className="h-5 w-5 text-ink-3" strokeWidth={1.5} />
                <span><span className="block text-xs uppercase tracking-[0.12em] text-ink-3">Lessons</span>{course.lessons ?? "-"}</span>
              </div>
              <div className="flex items-center gap-3 p-3">
                <Gauge className="h-5 w-5 text-ink-3" strokeWidth={1.5} />
                <span><span className="block text-xs uppercase tracking-[0.12em] text-ink-3">Level</span>{detail?.difficulty.length ? detail.difficulty[0] : "All levels"}</span>
              </div>
            </div>

            <ul className="mt-6 space-y-3.5 text-sm">
              {detail?.languages.length ? <Row icon={Languages} k="Language" v={detail.languages.join(", ")} /> : null}
              {detail?.difficulty.length ? (
                <li className="flex items-start gap-3">
                  <Gauge className="mt-1 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.5} />
                  <span className="text-ink-2">
                    Levels:
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {detail.difficulty.map((l) => (
                        <span key={l} className="rounded-full border border-brand/30 bg-[#fdecea] px-3 py-1 text-xs font-medium text-[#b42318]">{l}</span>
                      ))}
                    </span>
                  </span>
                </li>
              ) : null}
              {detail?.resources.length ? <Row icon={FileText} k="Additional resources" v={detail.resources.join(", ")} /> : null}
              <Row icon={Clock} k="Duration" v={days} />
              <Row icon={Monitor} k="Mode" v="Classroom and live online" />
              <Row icon={MapPin} k="Centre" v="Noonmati, Guwahati" />
              {course.certification && <Row icon={BadgeCheck} k="Certificate" v="Upon completion of the course" />}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href={`/enquiry?type=register&course=${slug}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-2">
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} /> Enrol now
              </Link>
              <Link href={`/courses?track=${encodeURIComponent(course.category)}`} transitionTypes={["nav-back"]} className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-4 text-sm font-medium transition-colors hover:bg-paper-raised">
                All courses
              </Link>
            </div>

            <section aria-labelledby="h-get" className="mt-8 border-t border-line pt-6">
              <h2 id="h-get" className="text-xs uppercase tracking-[0.12em] text-ink-3">What you get</h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-ink-2">
                <li>Real projects as you learn, with internships encouraged alongside the classes.</li>
                <li>Attend at the Noonmati centre or join the same class live online.</li>
                {course.certification && <li>A certificate at the end that you can show an employer.</li>}
                <li>Batches and timing confirmed directly by our team on WhatsApp.</li>
              </ul>
            </section>

            {[
              ["Assignment", detail?.assignment],
              ["Prerequisites", detail?.prerequisites],
              ["Materials", detail?.materials.join(", ")],
            ].map(([h, t], i) =>
              t ? (
                <section key={h} className={`mt-6`}>
                  <h2 className="text-xs uppercase tracking-[0.12em] text-ink-3">{h}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-2">{t}</p>
                </section>
              ) : null
            )}
          </aside>
        </div>

        {detail && detail.toc.length > 0 && (
          <section aria-labelledby="h-toc" data-rule className="mt-12 rounded-[28px] bg-paper-raised p-5 sm:p-8 lg:p-10">
            <h2 id="h-toc" className={`${DISPLAY} text-[clamp(26px,2.6vw,38px)] leading-none`}>
              Modules <span className="text-base normal-case text-ink-3">({detail.toc.length})</span>
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {detail.toc.map((m, i) => {
                return (
                  <li key={i} className="flex flex-col rounded-2xl bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-medium leading-snug">{m.title}</h3>
                        <p className="mt-1 text-xs text-ink-3">{m.detail.length} topics</p>
                      </div>
                      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-brand text-xs text-ink">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <ModuleTopics topics={m.detail} />
                  </li>
                )
              })}
            </ol>
            <p className="mt-6 text-center text-sm text-ink-3">…and many more</p>
          </section>
        )}

        {related.length > 0 && (
          <section data-rule aria-labelledby="h-related" className="mt-12 pb-4">
            <h2 id="h-related" className={`${DISPLAY} text-[clamp(28px,3.4vw,48px)] leading-none`}>
              More in {course.category}<span className="text-brand">.</span>
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c: PublicCourse) => (
                <li key={c.id}>
                  <Link href={`/courses/${slugs.get(c.id)}`} className="group flex h-full flex-col justify-between rounded-[22px] bg-paper-raised p-5 transition-colors hover:bg-line/60">
                    <span className="text-base font-medium">{c.title}</span>
                    <span className="mt-4 flex items-center justify-between text-xs text-ink-3">
                      {c.duration ? `${c.duration} days` : "Flexible"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  )
}
