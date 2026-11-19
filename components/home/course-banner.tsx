"use client"

import { ViewTransition, useCallback, useState } from "react"
import { COVER_COLORS, CoverBook } from "@/components/home/course-cover"
import { webp, webpSet } from "@/lib/webp"
import type { PublicCourse } from "@/lib/public-courses"

export const BANNER_SIZES = "(min-width: 1024px) 860px, 100vw"

/** Used when a course has no banner or its banner fails to load: the book's own colour, with the title set large. */
function GeneratedBanner({ course }: { course: PublicCourse }) {
  return (
    <div
      className="relative aspect-[16/7] w-full overflow-hidden rounded-[28px]"
      style={{ background: COVER_COLORS[course.category] ?? COVER_COLORS.Mechanical }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)" }}
      />
      <div className="relative flex h-full flex-col justify-between p-6 pl-[170px] text-white sm:p-8 sm:pl-[190px]">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">{course.category}</span>
        <span className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,56px)] uppercase leading-[0.95] tracking-[-0.01em]">
          {course.title}
          <span className="text-brand">.</span>
        </span>
      </div>
    </div>
  )
}

/** Banner with the course book overlapping its bottom-left corner, where an author avatar would sit. */
export function CourseBanner({ course, banner, alt }: { course: PublicCourse; banner: string | null; alt: string }) {
  const poster = course.image?.includes("/course-images/") ? course.image : null
  const [broken, setBroken] = useState(false)
  // the server-rendered <img> can fail before React is listening, so check an already-failed one on mount
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setBroken(true)
  }, [])
  return (
    <div className="relative mb-24 sm:mb-28">
      {banner && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={webp(banner, 1080)}
          srcSet={webpSet(banner)}
          sizes={BANNER_SIZES}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-auto w-full rounded-[28px]"
        />
      ) : (
        <GeneratedBanner course={course} />
      )}
      <div className="book-card absolute -bottom-20 left-6 sm:left-8">
        {/* same name as the book on the catalogue, so it morphs from that card into this corner */}
        <ViewTransition name={`course-book-${course.id}`} share="morph">
          <div><CoverBook course={course} img={poster} width={112} /></div>
        </ViewTransition>
      </div>
    </div>
  )
}
