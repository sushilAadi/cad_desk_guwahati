import "server-only"
import type { FunctionDeclaration } from "@google/genai"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { captureLead, requestCallback } from "@/lib/whatsapp/leads"
import { startGuidedFlow, sendCourseList } from "@/lib/whatsapp/menu"

export interface ToolContext {
  waPhone: string
  waName: string | null
  conversationId: string
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
      "Searches the course catalog by free-text keyword, for when the student describes what they want in their own words (e.g. 'something with 3D modelling'). Returns up to 8 matches -- NOT the full catalog, so never use this (or its result) to answer 'what courses do you have in <category>' -- call show_course_list for that instead, since a category can have far more than 8 courses and listing only a partial set makes the catalog look smaller than it is. Never returns fees.",
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
  {
    name: "show_course_list",
    description:
      "Sends the student the REAL, complete, tappable list of every course in one category -- paginated with a 'More courses' option, exactly like tapping Courses from the main menu. Call this whenever the student asks what courses/options exist in a category (e.g. 'what courses in civil', 'show me electrical courses', 'what do you offer in mechanical') -- do NOT answer this yourself in text by naming a handful of courses, since categories can have 15-20+ courses and a partial text list makes the catalog look small and gives no tappable options. Only use search_courses instead when they describe a specific topic/keyword, not a whole category.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Exact category name: 'Civil / Architecture', 'Mechanical', 'Electrical', 'CS/IT', or 'Creative Arts'.",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "start_guided_flow",
    description:
      "Switches the conversation into our real, structured Registration or Enquiry flow -- this immediately sends the student a tappable list of course categories, the same one they'd get from the main menu, and starts properly collecting their details (name, batch, etc.) step by step. Call this the MOMENT the student expresses clear intent to register/enroll/sign up for a course, or to submit an enquiry / have our team reach out -- e.g. 'help me register', 'I want to enroll', 'sign me up', 'can you register me', 'can someone contact me about this'. Do not just reply in text describing what registration involves -- call this tool instead so they get the real interactive flow. Do not call this for casual browsing questions like 'what courses do you have' or 'tell me about X' -- only when they want to take the concrete next step.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["register", "enquire"],
          description: "'register' if they want to join/enroll in a course, 'enquire' if they just want us to reach out with more info.",
        },
      },
      required: ["mode"],
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

    case "show_course_list": {
      const category = typeof args.category === "string" ? args.category.trim() : undefined
      if (!category) return { error: "category is required" }
      await sendCourseList(ctx.waPhone, category, "browse")
      return {
        success: true,
        note: "The complete interactive course list for this category has already been sent to the student. Do not list courses yourself in text -- respond with an empty message.",
      }
    }

    case "start_guided_flow": {
      const mode = args.mode === "register" ? "register" : "enquire"
      await startGuidedFlow(ctx.waPhone, ctx.conversationId, mode)
      return {
        success: true,
        note: "The interactive category list has already been sent directly to the student. Do not send any further reply of your own -- respond with an empty message.",
      }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}
