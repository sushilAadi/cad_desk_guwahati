import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppText, type SendResult } from "@/lib/whatsapp/send"
import { captureLead } from "@/lib/whatsapp/leads"
import { getFeatureFlags } from "@/lib/config/flags"
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
const ROOT_ASK = "ask:general"
const MENU_MAIN = "menu:main"
const CATEGORY_PREFIX = "cat:"
const COURSE_PREFIX = "course:"
const MORE_PREFIX = "more:"
const ENQUIRE_PREFIX = "enquire:" // enquire:<courseId>
const REGISTER_PREFIX = "register:" // register:<courseId>
const BATCH_PREFIX = "batch:" // batch:<mode>:<courseId>:<Morning|Evening|other>
const ASK_PREFIX = "ask:" // ask:general | ask:category:<category> | ask:course:<courseId>

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
 * Splits on "-"/"," like splitFields, but folds any extra parts into the
 * last expected field instead of dropping them -- protects against dates
 * (DD-MM-YYYY) or addresses containing the same delimiter characters.
 */
function splitInto(text: string, count: number): string[] {
  const parts = splitFields(text)
  if (parts.length <= count) return parts
  const head = parts.slice(0, count - 1)
  const tail = parts.slice(count - 1).join(" - ")
  return [...head, tail]
}

function isSkip(text: string): boolean {
  return text.trim().toLowerCase() === "skip"
}

/** Parses DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD into an ISO yyyy-mm-dd string. */
function parseDob(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null

  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  return null
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
  const flags = getFeatureFlags()

  const rows = [
    { id: ROOT_COURSES, title: "📚 Courses", description: "Browse by field" },
    { id: ROOT_ENQUIRY, title: "❓ Enquiry Desk", description: "Ask us to reach out" },
  ]
  if (flags.enableRegistration) {
    rows.push({ id: ROOT_REGISTRATION, title: "📝 Registration", description: "Join a course" })
  }
  rows.push({ id: ROOT_ASK, title: "💬 Ask a Question", description: "Type anything, anytime" })

  return sendWhatsAppList(
    to,
    "👋 Welcome to CAD Desk Guwahati! We're a CAD/CAM & IT training institute at our Noonmati centre. How can I help you today?",
    "View Options",
    [{ rows }]
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

  // Reserve 3 rows: "see more" (if needed), "Ask a Question", and Main Menu (always).
  const shown = data.slice(0, MAX_LIST_ROWS - 3)
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
  rows.push({
    id: `${ASK_PREFIX}category:${category}`,
    title: "💬 Ask a Question",
    description: `About ${truncate(category, 40)} courses`,
  })
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

  const flags = getFeatureFlags()
  const rows = [
    { id: `${ASK_PREFIX}course:${course.id}`, title: "💬 Ask a Question", description: `About ${truncate(course.title, 40)}` },
    { id: `${ENQUIRE_PREFIX}${course.id}`, title: "❓ Enquire", description: "Get a callback" },
  ]
  if (flags.enableRegistration) {
    rows.push({ id: `${REGISTER_PREFIX}${course.id}`, title: "📝 Register", description: "Join this course" })
  }
  rows.push({ id: MENU_MAIN, title: "🏠 Main Menu", description: "Back to the start" })

  await sendWhatsAppList(to, "Want to take this further?", "View Options", [{ rows }])
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
  await setPendingAction(conversationId, {
    mode,
    courseId,
    courseTitle,
    batch,
    step: "name_qual",
    collected: {},
  })

  if (batch) {
    await sendWhatsAppText(
      to,
      "Almost done — reply with your *Name - Qualification*, separated by a dash.\nExample: `Rahul Sharma - 12th Pass`\n(Qualification is optional, just your name works too.)"
    )
  } else {
    await sendWhatsAppText(
      to,
      "No problem — reply with your *Batch - Name - Qualification*, separated by dashes.\nExample: `Evening - Rahul Sharma - 12th Pass`\n(Qualification is optional.)"
    )
  }
}

async function askEmailDob(to: string, conversationId: string, pending: PendingAction) {
  await setPendingAction(conversationId, { ...pending, step: "email_dob" })
  await sendWhatsAppText(
    to,
    "Thanks! Now your *Email, Date of Birth (DD/MM/YYYY)*, separated by a comma.\nExample: `rahul@email.com, 15/08/2000`\n(Optional — reply `skip` to move on.)"
  )
}

async function askAddress(to: string, conversationId: string, pending: PendingAction) {
  await setPendingAction(conversationId, { ...pending, step: "address" })
  await sendWhatsAppText(
    to,
    "Last step — what's your *address*? (Optional — reply `skip` to finish.)"
  )
}

async function finalizeLead(
  to: string,
  conversationId: string,
  pending: PendingAction,
  address: string | null
) {
  const { name, qualification, email, dob } = pending.collected
  const batch = pending.batch || "Flexible"

  const result = await captureLead(
    { waPhone: to },
    {
      name: name || "WhatsApp lead",
      courseTitle: pending.courseTitle,
      courseId: pending.courseId,
      qualification: qualification ?? null,
      batchTime: batch,
      email: email ?? null,
      dob: dob ?? null,
      address,
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

/**
 * Called when a free-text reply arrives while a pending_action is waiting on it.
 * Returns a short label (for conversation history) describing what happened.
 */
export async function completePendingAction(
  to: string,
  conversationId: string,
  pending: PendingAction,
  rawText: string,
  waName: string | null
): Promise<string> {
  if (pending.step === "name_qual") {
    let batch = pending.batch
    let name: string
    let qualification: string | undefined

    if (batch) {
      const parts = splitInto(rawText, 2)
      name = parts[0] || waName || "WhatsApp lead"
      qualification = parts[1] || undefined
    } else {
      const parts = splitInto(rawText, 3)
      batch = parts[0] || "Flexible"
      name = parts[1] || waName || "WhatsApp lead"
      qualification = parts[2] || undefined
    }

    const next: PendingAction = {
      ...pending,
      batch,
      collected: { ...pending.collected, name, qualification },
    }
    await askEmailDob(to, conversationId, next)
    return "[collected name/qualification, asked for email/DOB]"
  }

  if (pending.step === "email_dob") {
    let email: string | undefined
    let dob: string | undefined

    if (!isSkip(rawText)) {
      const parts = splitInto(rawText, 2)
      email = parts[0] || undefined
      dob = parts[1] ? parseDob(parts[1]) ?? undefined : undefined
    }

    const next: PendingAction = {
      ...pending,
      collected: { ...pending.collected, email, dob },
    }
    await askAddress(to, conversationId, next)
    return "[collected email/DOB, asked for address]"
  }

  // step === "address"
  const address = isSkip(rawText) ? null : rawText.trim() || null
  await finalizeLead(to, conversationId, pending, address)
  return `[completed pending ${pending.mode}]`
}

async function sendEnquiryPrompt(to: string) {
  await sendCategoryList(to, "Happy to help! Which field is your question about?")
}

/** Invites free text after "Ask a Question" is tapped -- the reply flows to the Gemini agent as normal. */
async function sendAskPrompt(to: string, context: string) {
  await sendWhatsAppText(to, `Sure! Type your question about ${context} and I'll do my best to help. 😊`)
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
    if (!getFeatureFlags().enableRegistration) {
      await sendEnquiryPrompt(to)
      return "[tapped: Registration (disabled, routed to Enquiry)]"
    }
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
    let mode: PendingAction["mode"] = id.startsWith(REGISTER_PREFIX) ? "register" : "enquire"
    if (mode === "register" && !getFeatureFlags().enableRegistration) mode = "enquire"
    const courseId = id.slice(id.startsWith(REGISTER_PREFIX) ? REGISTER_PREFIX.length : ENQUIRE_PREFIX.length)

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
  if (id.startsWith(ASK_PREFIX)) {
    const rest = id.slice(ASK_PREFIX.length) // "general" | "category:<category>" | "course:<courseId>"

    if (rest.startsWith("category:")) {
      const category = rest.slice("category:".length)
      await sendAskPrompt(to, `${category} courses`)
      return `[tapped: ask a question about ${category}]`
    }
    if (rest.startsWith("course:")) {
      const courseId = rest.slice("course:".length)
      const supabase = getSupabaseAdmin()
      const { data: course } = supabase
        ? await supabase.from("courses").select("title").eq("id", courseId).maybeSingle()
        : { data: null }
      const title = course?.title ?? "this course"
      await sendAskPrompt(to, title)
      return `[tapped: ask a question about ${title}]`
    }

    await sendAskPrompt(to, "our courses")
    return "[tapped: Ask a Question]"
  }

  // Unknown id (e.g. an old menu from before a deploy) -- fall back gracefully.
  await sendWelcomeMenu(to)
  return `[tapped unknown option: ${id}]`
}
