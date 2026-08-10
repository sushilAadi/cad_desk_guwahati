"use client"

import { useState } from "react"
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
} from "lucide-react"
import type { PublicCourse } from "@/lib/public-courses"
import { getCategoryDisplay } from "./category-config"

const ICONS = { Building2, Code, Cpu, Palette, Zap, BookOpen } as const

const WHATSAPP_NUMBER = "919127281610"
function whatsappLinkFor(courseTitle: string) {
  const text = `Hi! I'd like to know more about the ${courseTitle} course at CAD Desk Guwahati.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

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

  const activeGroup = groups.find((g) => g.category === activeCatId) ?? groups[0]
  const selectedDisplay = getCategoryDisplay(activeGroup?.category ?? "")
  const categoryCourses = activeGroup?.courses ?? []

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
                : "text-zinc-700"
    return <Icon className={`h-4 w-4 ${colorClass}`} />
  }

  return (
    <div className="w-full p-5 text-zinc-900 bg-white rounded-none border-2 border-zinc-900 shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-zinc-900 text-amber-400 font-extrabold rounded-none">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wide text-zinc-900 block leading-tight">
              {totalCount}+ Certified Technical Courses
            </span>
            <span className="text-[10px] font-mono text-zinc-600">
              Hover over a category on the left to inspect its courses
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="px-3 py-1.5 bg-zinc-900 text-amber-400 hover:bg-zinc-800 font-mono text-xs font-bold tracking-wider cursor-pointer border border-zinc-900 flex items-center gap-1"
        >
          View Full Catalog <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Vertical Categories Stack */}
        <div className="md:col-span-4 space-y-2 border-r-0 md:border-r-2 border-zinc-200 pr-0 md:pr-4">
          <div className="text-[11px] font-mono font-bold tracking-widest text-zinc-500 pb-1 flex items-center justify-between">
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
                  onMouseEnter={() => setActiveCatId(g.category)}
                  onClick={() => {
                    setActiveCatId(g.category)
                    onSelectCategory(g.category)
                  }}
                  className={`group p-2.5 transition-all cursor-pointer border-2 flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                      : "bg-zinc-50 text-zinc-900 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Category Thumbnail / Icon */}
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-zinc-300 relative bg-zinc-200">
                      <img
                        src={display.image}
                        alt={g.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`font-extrabold text-xs tracking-tight truncate ${isActive ? "text-amber-400" : "text-zinc-900"}`}
                      >
                        {g.category}
                      </h4>
                      <p
                        className={`text-[10px] font-mono leading-tight truncate ${isActive ? "text-zinc-300" : "text-zinc-600"}`}
                      >
                        {display.slogan}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                        isActive
                          ? "bg-amber-400 text-zinc-950 border-amber-300"
                          : "bg-zinc-200 text-zinc-800 border-zinc-300"
                      }`}
                    >
                      {g.courses.length}
                    </span>
                    <ChevronRight className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-zinc-400"}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Hovered Category Details & Courses Grid */}
        <div className="md:col-span-8 space-y-4">
          {/* Active Category Header Banner */}
          <div className="border-2 border-zinc-900 bg-zinc-900 text-white p-4 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
            {/* Category Image Preview */}
            <div className="h-24 w-28 shrink-0 overflow-hidden border-2 border-amber-400 relative bg-zinc-800">
              <img
                src={selectedDisplay.image}
                alt={activeGroup?.category ?? ""}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-amber-400 text-zinc-950 font-mono text-[10px] font-extrabold px-2 py-0.5">
                  {activeGroup?.category}
                </span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold">
                  {categoryCourses.length} Courses Available
                </span>
              </div>

              <h3 className="text-lg font-black tracking-wide text-white">
                {activeGroup?.category} — <span className="text-amber-400">{selectedDisplay.slogan}</span>
              </h3>

              <p className="text-xs text-zinc-300 line-clamp-1">{selectedDisplay.description}</p>
            </div>

            <button
              type="button"
              onClick={() => onSelectCategory(activeGroup?.category ?? "")}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs tracking-wider cursor-pointer shrink-0 border border-amber-300"
            >
              Explore Stream →
            </button>
          </div>

          {/* Courses List in Right Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 font-bold tracking-wider pb-1 border-b border-zinc-200">
              <span>
                Courses in {activeGroup?.category} ({categoryCourses.length})
              </span>
              <span>Scroll for full list ↓</span>
            </div>

            <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2">
              {categoryCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-3 bg-zinc-50 hover:bg-amber-50/60 border border-zinc-200 hover:border-amber-500 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={course.image || selectedDisplay.image}
                      alt={course.title}
                      className="h-12 w-16 object-cover border border-zinc-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-zinc-900 group-hover:text-amber-700 transition-colors truncate">
                        {course.title}
                      </h5>
                      <p className="text-[11px] text-zinc-600 line-clamp-1">
                        {course.caption ?? "Practical, project-based training."}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-0.5">
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

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={whatsappLinkFor(course.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-white font-mono text-[10px] font-bold tracking-wider cursor-pointer transition-colors border border-zinc-900"
                    >
                      Enquire
                    </a>
                  </div>
                </div>
              ))}
              {categoryCourses.length === 0 && (
                <p className="text-xs text-zinc-500 py-4 text-center">
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
