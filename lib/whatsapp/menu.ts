import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppText, type SendResult } from "@/lib/whatsapp/send"
import { captureLead } from "@/lib/whatsapp/leads"

// ── Button/row id scheme (stateless -- everything we need is in the id) ──
const ROOT_COURSES = "menu:courses"
const ROOT_ENQUIRY = "menu:enquiry"
const ROOT_REGISTRATION = "menu:registration"
const CATEGORY_PREFIX = "cat:"
const COURSE_PREFIX = "course:"
const MORE_PREFIX = "more:"
const ENQUIRE_PREFIX = "enquire:"

const MAX_LIST_ROWS = 10

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/** Sent on a brand-new conversation's first message, regardless of what they typed. */
export async function sendWelcomeMenu(to: string): Promise<SendResult> {
  return sendWhatsAppButtons(
    to,
    "👋 Welcome to CAD Desk Guwahati! We offer 66+ CAD/CAM & IT courses at our Noonmati centre. How can I help you today?",
    [
      { id: ROOT_COURSES, title: "📚 Courses" },
      { id: ROOT_ENQUIRY, title: "❓ Enquiry Desk" },
      { id: ROOT_REGISTRATION, title: "📝 Registration" },
    ]
  )
}

async function sendCategoryList(to: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return sendWhatsAppText(to, "Sorry, our course list isn't available right now.")

  const { data, error } = await supabase.from("courses").select("category")
  if (error || !data) return sendWhatsAppText(to, "Sorry, I couldn't load the course categories right now.")

  const counts = new Map<string, number>()
  for (const row of data) {
    const key = row.category ?? "Uncategorized"
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const rows = Array.from(counts, ([category, count]) => ({
    id: `${CATEGORY_PREFIX}${category}`,
    title: truncate(category, 24),
    description: `${count} course${count === 1 ? "" : "s"}`,
  }))

  await sendWhatsAppList(to, "Which field are you interested in?", "View Categories", [
    { rows },
  ])
}

async function sendCourseList(to: string, category: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return sendWhatsAppText(to, "Sorry, our course list isn't available right now.")

  const { data, error } = await supabase
    .from("courses")
    .select("id,title,duration,certification")
    .ilike("category", category)
    .order("title")

  if (error || !data || data.length === 0) {
    return sendWhatsAppText(
      to,
      `I couldn't find courses in "${category}" right now — type what you're looking for and I'll help directly.`
    )
  }

  const shown = data.slice(0, MAX_LIST_ROWS - 1) // leave room for a "more" row if needed
  const rows = shown.map((c) => ({
    id: `${COURSE_PREFIX}${c.id}`,
    title: truncate(c.title, 24),
    description: `${c.duration ? `${c.duration} days` : "Flexible"}${c.certification ? " • Certified" : ""}`,
  }))

  if (data.length > shown.length) {
    rows.push({
      id: `${MORE_PREFIX}${category}`,
      title: "🔎 See more",
      description: `${data.length - shown.length} more courses — type to search`,
    })
  }

  await sendWhatsAppList(to, `${category} courses:`, "View Courses", [{ rows }])
}

async function sendCourseDetail(to: string, courseId: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return sendWhatsAppText(to, "Sorry, course details aren't available right now.")

  const { data: course, error } = await supabase
    .from("courses")
    .select("id,title,caption,description,duration,prerequisites,certification")
    .eq("id", courseId)
    .maybeSingle()

  if (error || !course) {
    return sendWhatsAppText(to, "Sorry, I couldn't find that course — type its name and I'll look it up.")
  }

  const lines = [
    `*${course.title}*`,
    course.caption || course.description || "Hands-on, project-based training.",
    `Duration: ${course.duration ? `${course.duration} days` : "Flexible"}`,
    course.certification ? "Includes certification on completion." : null,
    course.prerequisites ? `Prerequisites: ${course.prerequisites}` : null,
  ].filter(Boolean)

  await sendWhatsAppText(to, lines.join("\n"))
  await sendWhatsAppButtons(to, "Want to take this further?", [
    { id: `${ENQUIRE_PREFIX}${course.id}`, title: "❓ Enquire" },
    { id: ROOT_COURSES, title: "⬅️ Categories" },
  ])
}

async function sendEnquiryPrompt(to: string) {
  await sendWhatsAppText(
    to,
    "Sure! Tell me your name and what you'd like to know (a course, batch timings, anything) and I'll help right away. 😊"
  )
}

async function sendRegistrationPrompt(to: string) {
  await sendWhatsAppText(
    to,
    "Great! Please share your name and which course you'd like to register for, and our team will confirm your seat at the Noonmati centre."
  )
}

async function sendMoreCoursesPrompt(to: string, category: string) {
  await sendWhatsAppText(
    to,
    `Type the course name you're looking for in ${category} and I'll find it for you!`
  )
}

/** Deterministic capture when the student taps "Enquire" on a specific course. */
async function handleEnquireTap(to: string, courseId: string, waName: string | null) {
  const supabase = getSupabaseAdmin()
  const { data: course } = supabase
    ? await supabase.from("courses").select("title").eq("id", courseId).maybeSingle()
    : { data: null }

  const name = waName ?? "WhatsApp lead"
  const result = await captureLead(
    { waPhone: to },
    { name, courseTitle: course?.title ?? null, courseId }
  )

  if (!result.success) {
    await sendWhatsAppText(to, "Sorry, something went wrong saving that — could you type your question instead?")
    return
  }

  await sendWhatsAppText(
    to,
    `Thanks${waName ? ` ${waName}` : ""}! I've shared your interest in ${course?.title ?? "this course"} with our counseling team — they'll reach out with details. Anything else I can help with?`
  )
}

/**
 * Routes a tapped button/list reply id to the right menu action.
 * Returns a short label (for storing in conversation history) describing what was tapped.
 */
export async function handleMenuSelection(
  to: string,
  id: string,
  waName: string | null
): Promise<string> {
  if (id === ROOT_COURSES) {
    await sendCategoryList(to)
    return "[tapped: Courses]"
  }
  if (id === ROOT_ENQUIRY) {
    await sendEnquiryPrompt(to)
    return "[tapped: Enquiry Desk]"
  }
  if (id === ROOT_REGISTRATION) {
    await sendRegistrationPrompt(to)
    return "[tapped: Registration]"
  }
  if (id.startsWith(CATEGORY_PREFIX)) {
    const category = id.slice(CATEGORY_PREFIX.length)
    await sendCourseList(to, category)
    return `[tapped category: ${category}]`
  }
  if (id.startsWith(COURSE_PREFIX)) {
    const courseId = id.slice(COURSE_PREFIX.length)
    await sendCourseDetail(to, courseId)
    return `[tapped course: ${courseId}]`
  }
  if (id.startsWith(MORE_PREFIX)) {
    const category = id.slice(MORE_PREFIX.length)
    await sendMoreCoursesPrompt(to, category)
    return `[tapped: see more in ${category}]`
  }
  if (id.startsWith(ENQUIRE_PREFIX)) {
    const courseId = id.slice(ENQUIRE_PREFIX.length)
    await handleEnquireTap(to, courseId, waName)
    return `[tapped enquire: ${courseId}]`
  }

  // Unknown id (e.g. an old menu from before a deploy) -- fall back gracefully.
  await sendWelcomeMenu(to)
  return `[tapped unknown option: ${id}]`
}
