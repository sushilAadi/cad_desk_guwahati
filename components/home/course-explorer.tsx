"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PublicCourse } from "@/lib/public-courses"

const WHATSAPP_NUMBER = "919127281610"

function whatsappLinkFor(courseTitle: string) {
  const text = `Hi! I'd like to know more about the ${courseTitle} course at CAD Desk Guwahati.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

interface CourseExplorerProps {
  groups: { category: string; courses: PublicCourse[] }[]
}

export function CourseExplorer({ groups }: CourseExplorerProps) {
  const [active, setActive] = useState(groups[0]?.category ?? "")
  const activeGroup = groups.find((g) => g.category === active) ?? groups[0]

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g.category}
            onClick={() => setActive(g.category)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active === g.category
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            {g.category}
            <span className="ml-1.5 opacity-70">({g.courses.length})</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeGroup?.courses.length ? (
          activeGroup.courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                  <span>{course.title}</span>
                  {course.certification && (
                    <Badge variant="success" className="shrink-0">
                      Certificate
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {course.caption ?? "Practical, project-based training."}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {course.duration ? `${course.duration} days` : "Flexible duration"}
                  </span>
                  <Button asChild size="sm">
                    <Link
                      href={whatsappLinkFor(course.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Enquire
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground">
            Course list is loading — message us on WhatsApp for the full list
            in this category.
          </p>
        )}
      </div>
    </div>
  )
}
