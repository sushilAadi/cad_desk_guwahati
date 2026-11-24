"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  Code,
  Cpu,
  Palette,
  Zap,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Clock,
  ChevronRight,
  Layers,
} from "lucide-react"
import type { PublicCourse } from "@/lib/public-courses"
import { getCategoryDisplay } from "./category-config"
import { webp } from "@/lib/webp"
import { courseSlugs } from "@/lib/course-slug"

const ICONS = { Building2, Code, Cpu, Palette, Zap, BookOpen } as const

interface CategoryGroup {
  category: string
  courses: PublicCourse[]
}

interface CoursesMegaMenuProps {
  groups: CategoryGroup[]
  totalCount: number
  onSelectCategory: (catName: string) => void
  onOpenCatalog: () => void
}

export function CoursesMegaMenu({
  groups,
  totalCount,
  onSelectCategory,
  onOpenCatalog,
}: CoursesMegaMenuProps) {
  const [activeCatId, setActiveCatId] = useState<string>(groups[0]?.category ?? "")
  // the course under the pointer (or keyboard focus): its details replace the category banner, and clicking it opens its page
  const [hoverId, setHoverId] = useState<string | null>(null)
  const slugs = useMemo(() => courseSlugs(groups.flatMap((g) => g.courses)), [groups])

  const activeGroup = groups.find((g) => g.category === activeCatId) ?? groups[0]
  const selectedDisplay = getCategoryDisplay(activeGroup?.category ?? "")
  const categoryCourses = activeGroup?.courses ?? []
  const hoverCourse = categoryCourses.find((c) => c.id === hoverId)

  const getIcon = (catName: string) => {
    const meta = getCategoryDisplay(catName)
    const Icon = ICONS[meta.iconName]
    const colorClass =
      meta.iconName === "Building2"
        ? "text-teal-700"
        : meta.iconName === "Code"
          ? "text-blue-700"
          : meta.iconName === "Cpu"
            ? "text-orange-700"
            : meta.iconName === "Palette"
              ? "text-purple-700"
              : meta.iconName === "Zap"
                ? "text-amber-700"
                : "text-ink-2"
    return <Icon className={`h-4 w-4 ${colorClass}`} />
  }

  return (
    <div className="w-full p-5 text-ink bg-paper-card rounded-lg border border-line shadow-xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-ink text-paper font-extrabold rounded-lg">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wide text-ink block leading-tight">
              {totalCount}+ Certified Technical Courses
            </span>
            <span className="text-xs text-ink-2">
              Hover over a category on the left to inspect its courses
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="px-3 py-1.5 bg-ink text-paper hover:bg-ink-2 text-xs font-bold cursor-pointer flex items-center gap-1"
        >
          View Full Catalog <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Vertical Categories Stack */}
        <div className="md:col-span-4 space-y-2 border-r-0 md:border-r-2 border-line pr-0 md:pr-4">
          <div className="text-xs font-bold text-ink-3 pb-1 flex items-center justify-between">
            <span>Select Category</span>
            <span>{groups.length} Streams</span>
          </div>

          <div className="space-y-1.5">
            {groups.map((g) => {
              const isActive = g.category === activeCatId
              const display = getCategoryDisplay(g.category)
              return (
                <div
                  key={g.category}
                  onMouseEnter={() => {
                    setActiveCatId(g.category)
                    setHoverId(null)
                  }}
                  onClick={() => {
                    setActiveCatId(g.category)
                    onSelectCategory(g.category)
                  }}
                  className={`group p-2.5 transition-all cursor-pointer border-2 flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-night text-white border-brand shadow-md"
                      : "bg-paper-raised text-ink border-line hover:border-ink-3 hover:bg-paper-raised"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Category Thumbnail / Icon */}
                    <div className="h-12 aspect-[2/3] shrink-0 overflow-hidden border border-line relative bg-paper-raised">
                      <img
                        src={webp(display.image)}
                        alt={g.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`font-extrabold text-xs tracking-tight truncate ${isActive ? "text-white" : "text-ink"}`}
                      >
                        {g.category}
                      </h4>
                      <p
                        className={`text-xs leading-tight truncate ${isActive ? "text-zinc-300" : "text-ink-2"}`}
                      >
                        {display.slogan}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 border ${
                        isActive
                          ? "bg-amber-400 text-ink border-amber-300"
                          : "bg-paper-raised text-ink border-line"
                      }`}
                    >
                      {g.courses.length}
                    </span>
                    <ChevronRight className={`h-4 w-4 ${isActive ? "text-white" : "text-ink-3"}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Hovered Category Details & Courses Grid */}
        <div className="md:col-span-8 space-y-4">
          {/* Active Category Header Banner */}
          <div className="border border-line bg-night text-white p-4 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden min-h-[8.5rem]">
            {hoverCourse ? (
              <>
                <div className="aspect-[2/3] w-20 shrink-0 overflow-hidden border-2 border-brand relative bg-zinc-800">
                  <img src={webp(hoverCourse.image || selectedDisplay.image)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs">
                    <span className="bg-amber-400 text-ink font-extrabold px-2 py-0.5">{activeGroup?.category}</span>
                    <span className="flex items-center gap-1 text-zinc-200">
                      <Clock className="h-3 w-3 text-amber-400" /> {hoverCourse.duration ? `${hoverCourse.duration} days` : "Flexible"}
                    </span>
                    {hoverCourse.lessons && (
                      <span className="flex items-center gap-1 text-zinc-200">
                        <Layers className="h-3 w-3 text-amber-400" /> {hoverCourse.lessons} modules
                      </span>
                    )}
                    {hoverCourse.certification && <span className="font-bold text-emerald-400">Certificate</span>}
                  </div>
                  <h3 className="text-lg font-semibold tracking-wide text-white truncate">{hoverCourse.title}</h3>
                  <p className="text-xs text-zinc-300 line-clamp-2">{hoverCourse.caption ?? "Practical, project-based training."}</p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <Link
                    href={`/courses/${slugs.get(hoverCourse.id)}`}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink font-extrabold text-xs cursor-pointer text-center border border-amber-300"
                  >
                    View details →
                  </Link>
                </div>
              </>
            ) : (
              <>
            {/* Category Image Preview */}
            <div className="aspect-[2/3] w-20 shrink-0 overflow-hidden border-2 border-brand relative bg-zinc-800">
              <img
                src={webp(selectedDisplay.image)}
                alt={activeGroup?.category ?? ""}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-amber-400 text-ink text-xs font-extrabold px-2 py-0.5">
                  {activeGroup?.category}
                </span>
                <span className="text-emerald-400 text-xs font-bold">
                  {categoryCourses.length} Courses Available
                </span>
              </div>

              <h3 className="text-lg font-semibold tracking-wide text-white">
                {activeGroup?.category} — <span className="text-white">{selectedDisplay.slogan}</span>
              </h3>

              <p className="text-xs text-zinc-300 line-clamp-1">{selectedDisplay.description}</p>
            </div>

            <button
              type="button"
              onClick={() => onSelectCategory(activeGroup?.category ?? "")}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink font-extrabold text-xs cursor-pointer shrink-0 border border-amber-300"
            >
              Explore Stream →
            </button>
              </>
            )}
          </div>

          {/* Courses List in Right Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-ink-2 font-bold pb-1 border-b border-line">
              <span>
                Courses in {activeGroup?.category} ({categoryCourses.length})
              </span>
              <span>Scroll for full list ↓</span>
            </div>

            <div onMouseLeave={() => setHoverId(null)} className="max-h-[340px] overflow-y-auto pr-1 space-y-2">
              {categoryCourses.map((course) => (
                <div
                  key={course.id}
                  onMouseEnter={() => setHoverId(course.id)}
                  onFocus={() => setHoverId(course.id)}
                  className={`relative p-3 border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                    hoverId === course.id ? "bg-paper-raised border-brand" : "bg-paper-raised border-line hover:border-brand"
                  }`}
                >
                  {/* the whole row opens the course page */}
                  <Link href={`/courses/${slugs.get(course.id)}`} aria-label={`View details for ${course.title}`} className="absolute inset-0 z-0 outline-none focus-visible:ring-2 focus-visible:ring-brand" />
                  <div className="relative pointer-events-none flex items-center gap-3 min-w-0">
                    <img
                      src={webp(course.image || selectedDisplay.image)}
                      alt={course.title}
                      className="aspect-[2/3] w-10 object-cover border border-line shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-ink group-hover:text-amber-700 transition-colors truncate">
                        {course.title}
                      </h5>
                      <p className="text-xs text-ink-2 line-clamp-1">
                        {course.caption ?? "Practical, project-based training."}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-ink-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-600" />{" "}
                          {course.duration ? `${course.duration} Days` : "Flexible"}
                        </span>
                        {course.certification && (
                          <span className="font-bold text-emerald-700">Certified</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
              {categoryCourses.length === 0 && (
                <p className="text-xs text-ink-3 py-4 text-center">
                  Course list loading — message us on WhatsApp for the full list.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
