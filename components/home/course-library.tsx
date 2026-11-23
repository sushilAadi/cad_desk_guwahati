"use client"

import { useRef, useState } from "react"
import { Search, BadgeCheck } from "lucide-react"
import { CoverBook, sharedImages } from "@/components/home/course-cover"
import { useResponsive } from "@/components/ui/use-responsive"
import type { PublicCourse } from "@/lib/public-courses"

const WHATSAPP_NUMBER = "919127281610"
const BOOK_SIZES = { sm: 140, lg: 160, xl: 180 }

export function whatsappLinkFor(title: string) {
  const text = `Hi! I'd like to know more about the ${title} course at CAD Desk Guwahati.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

// Mouse click-and-drag horizontal scrolling for a row.
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const st = useRef({ down: false, x: 0, left: 0, moved: false })
  return {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || !ref.current) return
      st.current = { down: true, x: e.clientX, left: ref.current.scrollLeft, moved: false }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const s = st.current
      if (!s.down || !ref.current) return
      const dx = e.clientX - s.x
      if (Math.abs(dx) > 5) s.moved = true
      ref.current.scrollLeft = s.left - dx
    },
    onPointerUp: () => (st.current.down = false),
    onPointerLeave: () => (st.current.down = false),
    // swallow the click that ends a drag so it doesn't open WhatsApp
    onClickCapture: (e: React.MouseEvent) => {
      if (st.current.moved) {
        e.preventDefault()
        e.stopPropagation()
        st.current.moved = false
      }
    },
  }
}

function CourseBook({ course, shared }: { course: PublicCourse; shared: Set<string> }) {
  const w = useResponsive(BOOK_SIZES)
  return (
    <a
      href={whatsappLinkFor(course.title)}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      aria-label={`Enquire about ${course.title} on WhatsApp`}
      className="book-card flex shrink-0 flex-col gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
      style={{ width: w }}
    >
      <CoverBook course={course} shared={shared} width={w} />
      <div className="space-y-1">
        <p className="line-clamp-1 text-sm font-medium text-ink">{course.title}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
          {course.duration ? `${course.duration} days` : "Flexible"}
          {course.certification && (
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> Certificate
            </span>
          )}
        </p>
      </div>
    </a>
  )
}

// Section label styled as an engineering drawing title block.
function SheetHeader({ sheet, title, count }: { sheet: string; title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-line pb-3">
      <span className="text-xs text-ink-3">Sheet {sheet}</span>
      <h2 className="text-xl font-medium text-ink">{title}</h2>
      <span className="ml-auto text-xs text-ink-3">{count} courses</span>
    </div>
  )
}

function Shelf({
  sheet,
  title,
  courses,
  shared,
}: {
  sheet: string
  title: string
  courses: PublicCourse[]
  shared: Set<string>
}) {
  const drag = useDragScroll()
  if (!courses.length) return null
  return (
    <section aria-label={title} className="min-w-0">
      <SheetHeader sheet={sheet} title={title} count={courses.length} />
      <div
        {...drag}
        className="-mx-2 mt-6 flex cursor-grab select-none gap-6 overflow-x-auto px-2 pb-4 pt-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((c) => (
          <CourseBook key={c.id} course={c} shared={shared} />
        ))}
      </div>
    </section>
  )
}

export function CourseLibrary({
  groups,
}: {
  groups: { category: string; courses: PublicCourse[] }[]
}) {
  const bw = useResponsive(BOOK_SIZES)
  const [active, setActive] = useState("all")
  const [query, setQuery] = useState("")

  const all = groups.flatMap((g) => g.courses)
  const shared = sharedImages(all)
  const q = query.trim().toLowerCase()
  const filtered = q
    ? all.filter((c) => `${c.title} ${c.category}`.toLowerCase().includes(q))
    : active === "all"
      ? all
      : (groups.find((g) => g.category === active)?.courses ?? [])
  const showShelves = active === "all" && !q
  const recommended = all.filter((c) => c.certification).slice(0, 10)

  return (
    <div id="courses" className="grid scroll-mt-6 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <nav aria-label="Course categories" className="flex gap-1 overflow-x-auto lg:flex-col">
          {[{ category: "all", courses: all }, ...groups].map((g) => {
            const on = active === g.category && !q
            return (
              <button
                key={g.category}
                onClick={() => {
                  setActive(g.category)
                  setQuery("")
                }}
                aria-pressed={on}
                className={`flex h-9 shrink-0 items-center justify-between gap-4 whitespace-nowrap rounded-lg px-3 text-sm transition-colors ${
                  on ? "bg-paper-raised font-medium text-ink" : "text-ink-2 hover:bg-paper-raised/60"
                }`}
              >
                {g.category === "all" ? "All courses" : g.category}
                <span className="text-xs text-ink-3">{g.courses.length}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0 space-y-12">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search courses"
            className="h-10 w-full border-b border-line bg-transparent pl-7 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand"
          />
        </div>

        {showShelves ? (
          <>
            <Shelf sheet="01" title="Recommended" courses={recommended} shared={shared} />
            {groups.map((g, i) => (
              <Shelf
                key={g.category}
                sheet={String(i + 2).padStart(2, "0")}
                title={g.category}
                courses={g.courses}
                shared={shared}
              />
            ))}
          </>
        ) : filtered.length ? (
          <section>
            <SheetHeader
              sheet="--"
              title={q ? `Results for “${query.trim()}”` : active}
              count={filtered.length}
            />
            <div
              className="mt-6 grid justify-start gap-x-6 gap-y-10"
              style={{ gridTemplateColumns: `repeat(auto-fill, ${bw}px)` }}
            >
              {filtered.map((c) => (
                <CourseBook key={c.id} course={c} shared={shared} />
              ))}
            </div>
          </section>
        ) : (
          <p className="text-sm text-ink-2">
            No courses found. Message us on WhatsApp and we&apos;ll help you pick one.
          </p>
        )}
      </div>
    </div>
  )
}
