import "server-only"
import type { FunctionDeclaration } from "@google/genai"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { captureLead, requestCallback } from "@/lib/whatsapp/leads"

export interface ToolContext {
  waPhone: string
  waName: string | null
}

// NOTE: course rows intentionally never select "price" -- the strict
// no-fee-display policy is enforced at the data layer, not just the prompt,
// so the model can never see a fee value to leak in the first place.
const COURSE_LIST_FIELDS = "id,title,caption,category,duration,certification"
const COURSE_DETAIL_FIELDS =
  "id,title,caption,description,category,duration,prerequisites,certification,lessons,table_of_contents"

interface TocModule {
  title?: string
  [key: string]: unknown
}

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "list_course_categories",
    description:
      "Lists every course category at CAD Desk Guwahati with how many courses are in each. Call this when the student asks what fields/courses are offered, or seems unsure what they want.",
    parametersJsonSchema: { type: "object", properties: {} },
  },
  {
    name: "search_courses",
    description:
      "Searches the course catalog by free-text keyword and/or exact category. Returns matching titles, captions, categories, and durations. Never returns fees.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text keyword, e.g. 'AutoCAD' or 'interior design'.",
        },
        category: {
          type: "string",
          description:
            "Exact category name to filter by, e.g. 'Civil / Architecture', 'Mechanical', 'Electrical', 'CS/IT', 'Creative Arts'.",
        },
      },
    },
  },
  {
    name: "get_course_details",
    description:
      "Gets full details for one specific course by id or title: description, duration, prerequisites, certification, and a short curriculum preview (module titles only, capped at 6). Call this whenever the student asks about content, syllabus, curriculum, table of contents, modules, or 'what will I learn'. Never returns fees.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        course_id: { type: "string", description: "Exact course id, if already known." },
        title: { type: "string", description: "Course title or a close match." },
      },
    },
  },
  {
    name: "capture_lead",
    description:
      "Saves the student's enquiry as a lead for the counseling team, using their WhatsApp number automatically. Call once you know their name and course/category of interest.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The student's name." },
        course_title: {
          type: "string",
          description:
            "The course or category they're interested in, in their own words if it's not an exact catalog title.",
        },
        course_id: {
          type: "string",
          description: "Exact course id from search_courses/get_course_details, if known.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "request_callback",
    description:
      "Flags this student for a phone callback from the counseling team. Use when they ask for a person, want a call, or seem stuck.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        note: {
          type: "string",
          description: "Brief context for staff, e.g. what the student needs help with.",
        },
      },
    },
  },
]

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { error: "The course database isn't configured right now." }
  }

  switch (name) {
    case "list_course_categories": {
      const { data, error } = await supabase.from("courses").select("category")
      if (error || !data) return { error: "Could not load categories." }

      const counts = new Map<string, number>()
      for (const row of data) {
        const key = row.category ?? "Uncategorized"
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }

      return {
        categories: Array.from(counts, ([category, courseCount]) => ({
          category,
          courseCount,
        })),
      }
    }

    case "search_courses": {
      const query = typeof args.query === "string" ? args.query.trim() : undefined
      const category = typeof args.category === "string" ? args.category.trim() : undefined

      let q = supabase.from("courses").select(COURSE_LIST_FIELDS).limit(8)
      if (category) q = q.ilike("category", category)
      if (query) q = q.or(`title.ilike.%${query}%,caption.ilike.%${query}%`)

      const { data, error } = await q
      if (error) return { error: "Course search failed." }
      return { courses: data ?? [] }
    }

    case "get_course_details": {
      const courseId = typeof args.course_id === "string" ? args.course_id : undefined
      const title = typeof args.title === "string" ? args.title.trim() : undefined

      let q = supabase.from("courses").select(COURSE_DETAIL_FIELDS).limit(1)
      if (courseId) {
        q = q.eq("id", courseId)
      } else if (title) {
        q = q.ilike("title", `%${title}%`)
      } else {
        return { error: "Provide course_id or title." }
      }

      const { data, error } = await q.maybeSingle()
      if (error || !data) return { error: "Course not found." }

      // Cap the curriculum preview at 6 module titles -- keep it a light
      // teaser for WhatsApp, not a full syllabus dump, and don't leak the
      // nested per-module detail arrays at all.
      const toc = Array.isArray(data.table_of_contents)
        ? (data.table_of_contents as TocModule[])
            .slice(0, 6)
            .map((m) => m.title)
            .filter((t): t is string => typeof t === "string")
        : []

      return { course: { ...data, table_of_contents: toc, table_of_contents_is_partial: toc.length > 0 } }
    }

    case "capture_lead": {
      const name = typeof args.name === "string" && args.name.trim() ? args.name.trim() : ctx.waName
      if (!name) return { error: "A name is required to capture the lead." }

      const courseTitle = typeof args.course_title === "string" ? args.course_title : null
      const courseId = typeof args.course_id === "string" ? args.course_id : null

      const result = await captureLead(
        { waPhone: ctx.waPhone },
        { name, courseTitle, courseId }
      )
      if (!result.success) return { error: result.error }
      return { success: true, leadId: result.leadId }
    }

    case "request_callback": {
      const note = typeof args.note === "string" ? args.note : null
      const result = await requestCallback({ waPhone: ctx.waPhone }, { name: ctx.waName, note })
      if (!result.success) return { error: result.error }
      return { success: true, leadId: result.leadId }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
