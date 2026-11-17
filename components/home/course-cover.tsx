"use client"

import { Book } from "@/components/ui/book"
import type { PublicCourse } from "@/lib/public-courses"

// One quiet gradient per category: the colour tells you which track a book is on.
export const COVER_COLORS: Record<string, string> = {
  "Civil / Architecture": "linear-gradient(160deg,#27384f,#161f2e)",
  "CS/IT": "linear-gradient(160deg,#2c2a3f,#17162a)",
  Mechanical: "linear-gradient(160deg,#4a3a32,#2a1f1b)",
  "Creative Arts": "linear-gradient(160deg,#4a2f3d,#291a23)",
  Electrical: "linear-gradient(160deg,#25423f,#14262a)",
}

// An image used by several courses is a generic placeholder, not a real cover.
export function sharedImages(courses: PublicCourse[]) {
  const counts = new Map<string, number>()
  for (const c of courses) if (c.image) counts.set(c.image, (counts.get(c.image) ?? 0) + 1)
  return new Set([...counts].filter(([, n]) => n > 1).map(([u]) => u))
}

export function CoverBook({
  course,
  shared,
  width,
  img: imgProp,
}: {
  course: PublicCourse
  shared?: Set<string>
  width: number
  /** Overrides the default pick; pass `null` to force the generated cover. */
  img?: string | null
}) {
  const img =
    imgProp !== undefined ? (imgProp ?? undefined) : course.image && !shared?.has(course.image) ? course.image : undefined
  return (
    <Book
      cover
      width={width}
      title={course.title}
      color={COVER_COLORS[course.category] ?? COVER_COLORS.Mechanical}
      label={course.category}
      illustration={
        img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={`${course.title} course at CAD Desk Guwahati`}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : undefined
      }
    />
  )
}
