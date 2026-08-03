import "server-only"
import type { FunctionDeclaration } from "@google/genai"

import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface ToolContext {
  waPhone: string
  waName: string | null
}

// NOTE: course rows intentionally never select "price" -- the strict
// no-fee-display policy is enforced at the data layer, not just the prompt,
// so the model can never see a fee value to leak in the first place.
const COURSE_LIST_FIELDS = "id,title,caption,category,duration,certification"
const COURSE_DETAIL_FIELDS =
  "id,title,caption,description,category,duration,prerequisites,certification,lessons"

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
      "Gets full details for one specific course by id or title: description, duration, prerequisites, certification. Never returns fees.",
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

function baseLeadFields(ctx: ToolContext) {
  return {
    phone: ctx.waPhone,
    channel: "WhatsApp" as const,
    status: "New" as const,
    sources: ["WhatsApp Bot"],
  }
}

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
      return { course: data }
    }

    case "capture_lead": {
      const name = typeof args.name === "string" && args.name.trim() ? args.name.trim() : ctx.waName
      if (!name) return { error: "A name is required to capture the lead." }

      const courseTitle = typeof args.course_title === "string" ? args.course_title : null
      const courseId = typeof args.course_id === "string" ? args.course_id : null

      const { data, error } = await supabase
        .from("enquiries")
        .insert({
          ...baseLeadFields(ctx),
          name,
          course: courseTitle,
          course_id: courseId,
        })
        .select("id")
        .single()

      if (error) {
        console.error("[tools] capture_lead failed:", error)
        return { error: "Could not save the enquiry — please try again." }
      }

      return { success: true, leadId: data.id }
    }

    case "request_callback": {
      const note = typeof args.note === "string" ? args.note : null

      const { data: existing } = await supabase
        .from("enquiries")
        .select("id")
        .eq("phone", ctx.waPhone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from("enquiries")
          .update({ callback_requested: true, escalation_note: note })
          .eq("id", existing.id)
        if (error) return { error: "Could not flag the callback." }
        return { success: true, leadId: existing.id }
      }

      const { data, error } = await supabase
        .from("enquiries")
        .insert({
          ...baseLeadFields(ctx),
          name: ctx.waName ?? "WhatsApp lead",
          callback_requested: true,
          escalation_note: note,
        })
        .select("id")
        .single()

      if (error) return { error: "Could not save the callback request." }
      return { success: true, leadId: data.id }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
