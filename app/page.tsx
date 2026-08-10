import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CourseExplorer } from "@/components/home/course-explorer"
import { SiteHeader } from "@/components/nav/site-header"
import { getPublicCourses, groupByCategory } from "@/lib/public-courses"

export const dynamic = "force-dynamic"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about courses at CAD Desk Guwahati."
)}`

const HIGHLIGHTS = [
  { label: "66+", sub: "Courses" },
  { label: "5", sub: "Departments" },
  { label: "100%", sub: "Certification" },
]

const FEATURE_TAGS = [
  "Get Certificate",
  "Expert Instructors",
  "Hands-on Labs",
  "Flexible Batches",
]

const WHY_US = [
  "Practical, project-based training on industry-standard software",
  "Small batches with individual attention",
  "Certificate on course completion",
  "Guidance on career paths in your chosen field",
]

export default async function Home() {
  const courses = await getPublicCourses()
  const groups = groupByCategory(courses)

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Nav */}
      <SiteHeader groups={groups} totalCount={courses.length} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-background to-emerald-50 dark:from-blue-950/20 dark:via-background dark:to-emerald-950/20" />
        <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-4">
            Noonmati, Guwahati
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Master In-Demand CAD, CAM &amp; IT Skills
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-muted-foreground">
            CAD Desk Guwahati is a CAD/CAM and IT training institute offering
            industry-oriented, hands-on courses across Civil &amp;
            Architecture, Mechanical, Electrical, CS/IT, and Creative Arts —
            with certification at our Noonmati centre.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Enquire on WhatsApp
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="tel:+919127281610">Call Us</Link>
            </Button>
          </div>

          <div className="mx-auto mt-14 grid max-w-md grid-cols-3 gap-6">
            {HIGHLIGHTS.map((h) => (
              <div key={h.sub}>
                <div className="text-2xl font-bold sm:text-3xl">{h.label}</div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  {h.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-tone highlight cards */}
      <section className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-blue-100 p-8 dark:bg-blue-950/40">
            <h3 className="text-xl font-semibold">
              Learn hands-on, at a pace that works for you
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Every course is built around practical, project-based labs on
              the same software used in the industry — not just theory.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-8 dark:bg-emerald-950/40">
            <h3 className="text-xl font-semibold">
              Trained by instructors who work in the field
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Our trainers bring real project experience into the classroom,
              and give every student individual attention.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-y py-6">
          {FEATURE_TAGS.map((tag) => (
            <Badge key={tag} variant="outline" className="px-3 py-1.5 text-sm">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Our Courses</h2>
          <p className="mt-2 text-muted-foreground">
            Browse by department — message us on WhatsApp for fees, batch
            timings, and admission details.
          </p>
        </div>
        <CourseExplorer groups={groups} />
      </section>

      {/* Why us banner */}
      <section id="why-us" className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="rounded-2xl bg-zinc-900 px-8 py-12 text-zinc-50 sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Why Learn at CAD Desk Guwahati
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {WHY_US.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-50/10 text-xs text-zinc-50">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8">
            <Link href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              Enquire on WhatsApp
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer / contact */}
      <footer id="contact" className="mt-auto border-t bg-background">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            CAD Desk Guwahati &mdash; NEEED ASSOCIATES
          </p>
          <p className="mt-1">
            Near Axom Jatiya Vidyalaya, Noonmati, Kamrup Metro, Guwahati,
            Assam 781020
          </p>
          <p className="mt-1">
            WhatsApp / Phone:{" "}
            <Link href="tel:+919127281610" className="underline">
              +91 91272 81610
            </Link>
          </p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="underline">
              Data Deletion
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
