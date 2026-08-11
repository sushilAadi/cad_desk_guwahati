import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppText, type SendResult } from "@/lib/whatsapp/send"
import { captureLead } from "@/lib/whatsapp/leads"
import {
  setPendingAction,
  clearPendingAction,
  type PendingAction,
} from "@/lib/whatsapp/conversations"

// ── Button/row id scheme (stateless through navigation -- only the final
// free-text step needs conversation state, via pending_action). ──
const ROOT_COURSES = "menu:courses"
const ROOT_ENQUIRY = "menu:enquiry"
const ROOT_REGISTRATION = "menu:registration"
const MENU_MAIN = "menu:main"
const CATEGORY_PREFIX = "cat:"
const COURSE_PREFIX = "course:"
const MORE_PREFIX = "more:"
const ENQUIRE_PREFIX = "enquire:" // enquire:<courseId>
const REGISTER_PREFIX = "register:" // register:<courseId>
const BATCH_PREFIX = "batch:" // batch:<mode>:<courseId>:<Morning|Evening|other>

const MAX_LIST_ROWS = 10

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/**
 * Typed "reset" words that always take the student back to the main menu,
 * from anywhere in the conversation -- checked before Gemini or any
 * pending_action, so no one can ever get stuck with no way back.
 */
const RESET_KEYWORDS = new Set([
  "menu",
  "main menu",
  "home",
  "start",
  "restart",
  "start over",
  "hi",
  "hii",
  "hello",
  "hey",
])

export function isMenuResetKeyword(text: string): boolean {
  return RESET_KEYWORDS.has(text.trim().toLowerCase())
}

/** Splits "Rahul Sharma - 12th Pass" or "Rahul Sharma, 12th Pass" into trimmed parts. */
function splitFields(text: string): string[] {
  return text
    .split(/[-,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Sent after every free-text (Gemini) reply, so there's always a visible,
 * tappable way back to the menu -- not just the hidden "type menu" keyword.
 */
export async function sendMainMenuHint(to: string): Promise<SendResult> {
  return sendWhatsAppButtons(to, "Anything else? You can also jump back anytime:", [
    { id: MENU_MAIN, title: "🏠 Main Menu" },
  ])
}

/** Sent on a brand-new conversation's first message, regardless of what they typed. */
export async function sendWelcomeMenu(to: string): Promise<SendResult> {
  return sendWhatsAppButtons(
    to,
    "👋 Welcome to CAD Desk Guwahati! We're a CAD/CAM & IT training institute at our Noonmati centre. How can I help you today?",
    [
      { id: ROOT_COURSES, title: "📚 Courses" },
      { id: ROOT_ENQUIRY, title: "❓ Enquiry Desk" },
      { id: ROOT_REGISTRATION, title: "📝 Registration" },
    ]
  )
}

async function sendCategoryList(to: string, intro: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return sendWhatsAppText(to, "Sorry, our course list isn't available right now.")

  const { data, error } = await supabase.from("courses").select("category")
  if (error || !data) return sendWhatsAppText(to, "Sorry, I couldn't load the course categories right now.")

  const categories = Array.from(new Set(data.map((row) => row.category ?? "Uncategorized")))

  const rows = categories.map((category) => ({
    id: `${CATEGORY_PREFIX}${category}`,
    title: truncate(category, 24),
    description: "Tap to explore",
  }))
  rows.push({ id: MENU_MAIN, title: "🏠 Main Menu", description: "Back to the start" })

  await sendWhatsAppList(to, `${intro} (Or just type your question anytime.)`, "View Categories", [
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

  // Reserve 2 rows: one for "see more" (if needed) and one for Main Menu (always).
  const shown = data.slice(0, MAX_LIST_ROWS - 2)
  const rows = shown.map((c) => ({
    id: `${COURSE_PREFIX}${c.id}`,
    title: truncate(c.title, 24),
    description: `${c.duration ? `${c.duration} days` : "Flexible"}${c.certification ? " • Certified" : ""}`,
  }))

  if (data.length > shown.length) {
    rows.push({
      id: `${MORE_PREFIX}${category}`,
      title: "🔎 See more",
      description: "More courses available — type to search",
    })
  }
  rows.push({ id: MENU_MAIN, title: "🏠 Main Menu", description: "Back to the start" })

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
    { id: `${REGISTER_PREFIX}${course.id}`, title: "📝 Register" },
    { id: MENU_MAIN, title: "🏠 Main Menu" },
  ])
}

async function sendMoreCoursesPrompt(to: string, category: string) {
  await sendWhatsAppText(
    to,
    `Type the course name you're looking for in ${category} and I'll find it for you!`
  )
}

/** Step 1 of enquire/register: ask for batch timing via quick buttons, "other" opens free text. */
async function sendBatchOptions(
  to: string,
  mode: PendingAction["mode"],
  courseId: string,
  courseTitle: string
) {
  const verb = mode === "register" ? "register for" : "ask about"
  await sendWhatsAppButtons(to, `Great, you'd like to ${verb} *${courseTitle}*. Which batch timing works for you?`, [
    { id: `${BATCH_PREFIX}${mode}:${courseId}:Morning`, title: "🌅 Morning" },
    { id: `${BATCH_PREFIX}${mode}:${courseId}:Evening`, title: "🌇 Evening" },
    { id: `${BATCH_PREFIX}${mode}:${courseId}:other`, title: "✍️ Type it" },
  ])
}

/** Step 2: batch is chosen (or not) -- now collect name (+ qualification) in one message. */
async function startNameCollection(
  to: string,
  conversationId: string,
  mode: PendingAction["mode"],
  courseId: string,
  courseTitle: string,
  batch: string | null
) {
  if (batch) {
    await setPendingAction(conversationId, { mode, courseId, courseTitle, batch })
    await sendWhatsAppText(
      to,
      "Almost done — reply with your *Name - Qualification*, separated by a dash.\nExample: `Rahul Sharma - 12th Pass`\n(Qualification is optional, just your name works too.)"
    )
  } else {
    await setPendingAction(conversationId, { mode, courseId, courseTitle, batch: null })
    await sendWhatsAppText(
      to,
      "No problem — reply with your *Batch - Name - Qualification*, separated by dashes.\nExample: `Evening - Rahul Sharma - 12th Pass`\n(Qualification is optional.)"
    )
  }
}

/** Called when a free-text reply arrives while a pending_action is waiting on it. */
export async function completePendingAction(
  to: string,
  conversationId: string,
  pending: PendingAction,
  rawText: string,
  waName: string | null
): Promise<void> {
  const parts = splitFields(rawText)

  let batch = pending.batch
  let name: string
  let qualification: string | null

  if (batch) {
    name = parts[0] || waName || "WhatsApp lead"
    qualification = parts[1] || null
  } else {
    batch = parts[0] || "Flexible"
    name = parts[1] || waName || "WhatsApp lead"
    qualification = parts[2] || null
  }

  const result = await captureLead(
    { waPhone: to },
    {
      name,
      courseTitle: pending.courseTitle,
      courseId: pending.courseId,
      qualification,
      batchTime: batch,
    }
  )

  await clearPendingAction(conversationId)

  if (!result.success) {
    await sendWhatsAppText(to, "Sorry, something went wrong saving that — could you try again in a moment?")
    return
  }

  const confirmation =
    pending.mode === "register"
      ? `Thanks ${name}! You're registered for *${pending.courseTitle}* (${batch} batch). Our team will confirm your seat at the Noonmati centre shortly. 🎉`
      : `Thanks ${name}! I've shared your interest in *${pending.courseTitle}* (${batch} batch) with our counseling team — they'll reach out soon. 😊`

  await sendWhatsAppText(to, confirmation)
}

async function sendEnquiryPrompt(to: string) {
  await sendCategoryList(to, "Happy to help! Which field is your question about?")
}

async function sendRegistrationPrompt(to: string) {
  await sendCategoryList(to, "Let's get you registered! Which field would you like to join?")
}

/**
 * Routes a tapped button/list reply id to the right menu action.
 * Returns a short label (for storing in conversation history) describing what was tapped.
 */
export async function handleMenuSelection(
  to: string,
  id: string,
  waName: string | null,
  conversationId: string
): Promise<string> {
  // Any fresh navigation tap abandons an in-progress collection flow.
  if (!id.startsWith(BATCH_PREFIX)) {
    await clearPendingAction(conversationId)
  }

  if (id === MENU_MAIN) {
    await sendWelcomeMenu(to)
    return "[tapped: Main Menu]"
  }
  if (id === ROOT_COURSES) {
    await sendCategoryList(to, "Which field are you interested in?")
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
  if (id.startsWith(ENQUIRE_PREFIX) || id.startsWith(REGISTER_PREFIX)) {
    const mode: PendingAction["mode"] = id.startsWith(REGISTER_PREFIX) ? "register" : "enquire"
    const courseId = id.slice(mode === "register" ? REGISTER_PREFIX.length : ENQUIRE_PREFIX.length)

    const supabase = getSupabaseAdmin()
    const { data: course } = supabase
      ? await supabase.from("courses").select("title").eq("id", courseId).maybeSingle()
      : { data: null }

    await sendBatchOptions(to, mode, courseId, course?.title ?? "this course")
    return `[tapped ${mode}: ${courseId}]`
  }
  if (id.startsWith(BATCH_PREFIX)) {
    const rest = id.slice(BATCH_PREFIX.length) // "<mode>:<courseId>:<batch>"
    const [mode, courseId, batchRaw] = rest.split(":") as [PendingAction["mode"], string, string]

    const supabase = getSupabaseAdmin()
    const { data: course } = supabase
      ? await supabase.from("courses").select("title").eq("id", courseId).maybeSingle()
      : { data: null }

    const batch = batchRaw === "other" ? null : batchRaw
    await startNameCollection(to, conversationId, mode, courseId, course?.title ?? "this course", batch)
    return `[tapped batch: ${batchRaw} for ${courseId}]`
  }

  // Unknown id (e.g. an old menu from before a deploy) -- fall back gracefully.
  await sendWelcomeMenu(to)
  return `[tapped unknown option: ${id}]`
}
