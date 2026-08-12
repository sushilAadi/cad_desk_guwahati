import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppButtons, sendWhatsAppImage, sendWhatsAppList, sendWhatsAppText, type SendResult } from "@/lib/whatsapp/send"
import { captureLead } from "@/lib/whatsapp/leads"
import { createRegistration, getPaymentSettings } from "@/lib/whatsapp/registrations"
import { getFeatureFlags } from "@/lib/config/flags"
import {
  getPendingAction,
  setPendingAction,
  clearPendingAction,
  type PendingAction,
} from "@/lib/whatsapp/conversations"

// ── Button/row id scheme (stateless through navigation -- only the course
// "cart" and the final free-text steps need conversation state, via
// pending_action). ──
const ROOT_COURSES = "menu:courses"
const ROOT_ENQUIRY = "menu:enquiry"
const ROOT_REGISTRATION = "menu:registration"
const ROOT_ASK = "ask:general"
const MENU_MAIN = "menu:main"
const CATEGORY_PREFIX = "cat:" // cat:<flow>:<category>
const COURSE_PREFIX = "course:" // course:<flow>:<courseId>
const MORE_PREFIX = "more:" // more:<flow>:<nextOffset>:<category> -- pagination, "show more courses"
const TYPE_PREFIX = "type:" // type:<category> -- free-text search fallback ("Other")
const ENQUIRE_PREFIX = "enquire:" // enquire:<courseId>
const REGISTER_PREFIX = "register:" // register:<courseId>
const BATCH_PREFIX = "batch:" // batch:<mode>:<Morning|Afternoon|Evening|other>
const ASK_PREFIX = "ask:" // ask:general | ask:category:<category> | ask:course:<courseId>
const COURSES_ADD_PREFIX = "cadd:" // cadd:<flow> -- "add another course" from the course-selection cart
const COURSES_CONTINUE = "ccontinue" // done adding courses, move to batch timing

/**
 * What the student is browsing for -- carried through category/course ids so
 * a course tap can skip straight to the right next step instead of asking
 * "want to take this further?" again when they already said Enquiry or
 * Registration up front. "browse" is the plain Courses menu (still shows the
 * full Ask/Enquire/Register options on the course detail screen).
 */
type BrowseFlow = "browse" | "enquire" | "register"

/** Splits "<flow>:<rest>" (rest may itself contain ":") from a tapped id's remainder. */
function splitFlow(rest: string): [BrowseFlow, string] {
  const sepIdx = rest.indexOf(":")
  const flow = (sepIdx === -1 ? rest : rest.slice(0, sepIdx)) as BrowseFlow
  const remainder = sepIdx === -1 ? "" : rest.slice(sepIdx + 1)
  return [flow, remainder]
}

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

/**
 * Like splitInto, but folds overflow into the FIRST field instead of the
 * last. Used when the first field (a typed batch timing, e.g. "6 PM - 8 PM")
 * is the one likely to contain the delimiter, not the trailing fields.
 */
function splitFromEnd(text: string, count: number): string[] {
  const parts = splitFields(text)
  if (parts.length <= count) return parts
  const tail = parts.slice(-(count - 1))
  const head = parts.slice(0, parts.length - (count - 1)).join(" - ")
  return [head, ...tail]
}

function isSkip(text: string): boolean {
  return text.trim().toLowerCase() === "skip"
}

/**
 * True only if y-mo-d is a real calendar date (rejects things like
 * "31/04/1990" -- April has 30 days -- which regex matching alone lets
 * through and Postgres then rejects at insert time with a 400).
 */
function isRealDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) return false
  const date = new Date(y, mo - 1, d)
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
}

/** Parses DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD into an ISO yyyy-mm-dd string, or null if not a real date. */
function parseDob(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null

  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    if (!isRealDate(Number(y), Number(mo), Number(d))) return null
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (m) {
    const [, y, mo, d] = m
    if (!isRealDate(Number(y), Number(mo), Number(d))) return null
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  return null
}

/**
 * NOT currently called -- was sent after every single free-text (Gemini)
 * reply, but that meant it showed up instantly after every message with no
 * regard for whether the student was still typing, which felt spammy.
 * Kept here in case we want a real idle-timeout nudge later (e.g. only sent
 * if the student hasn't replied in ~40s), which needs a delayed job/queue
 * to implement properly -- this function is the "send it" half of that.
 */
export async function sendMainMenuHint(to: string): Promise<SendResult> {
  return sendWhatsAppButtons(to, "Anything else? You can also jump back anytime:", [
    { id: MENU_MAIN, title: "🏠 Main Menu" },
  ])
}

/**
 * Sent on a brand-new conversation's first message, regardless of what they typed.
 * Shows Courses, Enquiry Desk, Registration (if enabled), then Ask a Question --
 * as a list, since WhatsApp only shows buttons directly and caps those at 3.
 */
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

async function sendCategoryList(to: string, intro: string, flow: BrowseFlow) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return sendWhatsAppText(to, "Sorry, our course list isn't available right now.")

  const { data, error } = await supabase.from("courses").select("category")
  if (error || !data) return sendWhatsAppText(to, "Sorry, I couldn't load the course categories right now.")

  const categories = Array.from(new Set(data.map((row) => row.category ?? "Uncategorized")))

  const rows = categories.map((category) => ({
    id: `${CATEGORY_PREFIX}${flow}:${category}`,
    title: truncate(category, 24),
    description: "Tap to explore",
  }))
  rows.push({ id: MENU_MAIN, title: "🏠 Main Menu", description: "Back to the start" })

  await sendWhatsAppList(to, `${intro} (Or just type your question anytime.)`, "View Categories", [
    { rows },
  ])
}

/**
 * Paginates through every course in a category via a "More courses" row
 * (WhatsApp lists cap at 10 rows total, so this is how a category with more
 * than ~6 courses is still fully browsable -- not just the first page).
 */
async function sendCourseList(to: string, category: string, flow: BrowseFlow, offset = 0) {
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

  // Reserve up to 4 rows: "More courses" (only when another page remains), "Other", Ask a Question, Main Menu.
  const pageSize = MAX_LIST_ROWS - 4
  const page = data.slice(offset, offset + pageSize)
  const rows = page.map((c) => ({
    id: `${COURSE_PREFIX}${flow}:${c.id}`,
    title: truncate(c.title, 24),
    description: `${c.duration ? `${c.duration} days` : "Flexible"}${c.certification ? " • Certified" : ""}`,
  }))

  const nextOffset = offset + page.length
  const hasMore = nextOffset < data.length
  if (hasMore) {
    rows.push({
      id: `${MORE_PREFIX}${flow}:${nextOffset}:${category}`,
      title: "➡️ More courses",
      description: `${data.length - nextOffset} more in ${category}`,
    })
  }
  rows.push({
    id: `${TYPE_PREFIX}${category}`,
    title: "✍️ Other",
    description: "Don't see it? Type the name",
  })
  rows.push({
    id: `${ASK_PREFIX}category:${category}`,
    title: "💬 Ask a Question",
    description: `About ${truncate(category, 40)} courses`,
  })
  rows.push({ id: MENU_MAIN, title: "🏠 Main Menu", description: "Back to the start" })

  const pageLabel = offset > 0 ? ` (${offset + 1}-${nextOffset} of ${data.length})` : ` (${data.length} total)`
  await sendWhatsAppList(to, `${category} courses:${pageLabel}`, "View Courses", [{ rows }])
}

/**
 * "browse" flow (came from the plain Courses menu) still asks "want to take
 * this further?" since we don't know their intent yet. "enquire"/"register"
 * flow means they already told us that from the root menu -- skip straight
 * to the batch-timing question instead of asking again.
 */
async function sendCourseDetail(to: string, courseId: string, flow: BrowseFlow, conversationId: string) {
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
  let effectiveFlow = flow
  if (effectiveFlow === "register" && !flags.enableRegistration) effectiveFlow = "enquire"

  if (effectiveFlow === "enquire" || effectiveFlow === "register") {
    await addCourseToSelection(to, conversationId, effectiveFlow, course.id, course.title)
    return
  }

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

/**
 * Adds a course to the in-progress enquire/register "cart" (creating it if
 * this is the first course) and asks whether to add another or continue --
 * this is what makes multi-course selection possible.
 */
async function addCourseToSelection(
  to: string,
  conversationId: string,
  flow: "enquire" | "register",
  courseId: string,
  courseTitle: string
) {
  const existing = await getPendingAction(conversationId)

  let courses: { id: string; title: string }[]
  if (existing && existing.mode === flow && existing.step === "collect_courses") {
    courses = existing.courses.some((c) => c.id === courseId)
      ? existing.courses
      : [...existing.courses, { id: courseId, title: courseTitle }]
  } else {
    courses = [{ id: courseId, title: courseTitle }]
  }

  await setPendingAction(conversationId, {
    mode: flow,
    courses,
    batch: null,
    step: "collect_courses",
    collected: {},
  })

  const verb = flow === "register" ? "register for" : "ask about"
  const list = courses.map((c) => c.title).join(", ")
  await sendWhatsAppButtons(
    to,
    `Great, you'd like to ${verb} *${courseTitle}*. Your selection so far: ${list}.\nWant to add another course?`,
    [
      { id: `${COURSES_ADD_PREFIX}${flow}`, title: "➕ Add Another" },
      { id: COURSES_CONTINUE, title: `➡️ Continue (${courses.length})` },
    ]
  )
}

/** Step 2 of enquire/register: ask for batch timing, once the course "cart" is finalized. */
async function sendBatchOptions(to: string, mode: PendingAction["mode"], courses: { id: string; title: string }[]) {
  const verb = mode === "register" ? "register for" : "ask about"
  const list = courses.map((c) => c.title).join(", ")
  await sendWhatsAppList(
    to,
    `Great, you'd like to ${verb} *${list}*. Which batch timing works for you?`,
    "View Timings",
    [
      {
        rows: [
          { id: `${BATCH_PREFIX}${mode}:Morning`, title: "🌅 Morning" },
          { id: `${BATCH_PREFIX}${mode}:Afternoon`, title: "🌤️ Afternoon" },
          { id: `${BATCH_PREFIX}${mode}:Evening`, title: "🌇 Evening" },
          {
            id: `${BATCH_PREFIX}${mode}:other`,
            title: "✍️ Type it",
            description: "e.g. 6 PM - 8 PM, or Weekend",
          },
          { id: MENU_MAIN, title: "🏠 Main Menu", description: "Back to the start" },
        ],
      },
    ]
  )
}

/** Step 3: batch is chosen (or not) -- now collect name (+ qualification) in one message. */
async function startNameCollection(
  to: string,
  conversationId: string,
  mode: PendingAction["mode"],
  courses: { id: string; title: string }[],
  batch: string | null
) {
  await setPendingAction(conversationId, {
    mode,
    courses,
    batch,
    step: "name_qual",
    collected: {},
  })

  const qualNote =
    mode === "register" ? "(both name and qualification are required)" : "(qualification is optional)"

  if (batch) {
    await sendWhatsAppText(
      to,
      `Almost done — reply with your *Name - Qualification*, separated by a dash ${qualNote}.\nExample: \`Rahul Sharma - 12th Pass\``
    )
  } else {
    await sendWhatsAppText(
      to,
      `No problem — reply with your *Batch timing - Name - Qualification*, separated by dashes ${qualNote}.\nExample: \`6 PM - 8 PM - Rahul Sharma - 12th Pass\` (batch timing can be anything, e.g. \`6 PM - 8 PM\`, \`Weekend\`, \`Afternoon\`)`
    )
  }
}

async function askEmailDob(to: string, conversationId: string, pending: PendingAction) {
  await setPendingAction(conversationId, { ...pending, step: "email_dob" })
  const note =
    pending.mode === "register"
      ? "(both are required to complete registration)"
      : "(optional — reply `skip` to move on)"
  await sendWhatsAppText(
    to,
    `Thanks! Now your *Email, Date of Birth (DD/MM/YYYY)*, separated by a comma ${note}.\nExample: \`rahul@email.com, 15/08/2000\``
  )
}

async function askAddress(to: string, conversationId: string, pending: PendingAction) {
  await setPendingAction(conversationId, { ...pending, step: "address" })
  const note = pending.mode === "register" ? "(required to complete registration)" : "(optional — reply `skip` to finish)"
  await sendWhatsAppText(to, `Almost there — what's your *address*? ${note}`)
}

/** Register-only step 4: father's name (optional) + college/school (required). */
async function askFatherCollege(to: string, conversationId: string, pending: PendingAction) {
  await setPendingAction(conversationId, { ...pending, step: "father_college" })
  await sendWhatsAppText(
    to,
    "Almost done — reply with your *Father's Name, College/School*, separated by a comma (father's name is optional).\nExample: `Ramesh Sharma, ABC College`\nOr just the college name on its own works too."
  )
}

/** Register-only step 5: final Yes/No confirmation before writing to student_registrations. */
async function askConfirm(to: string, conversationId: string, pending: PendingAction) {
  await setPendingAction(conversationId, { ...pending, step: "confirm" })
  const c = pending.collected
  const batch = pending.batch || "Flexible"
  const summary = [
    `*${c.name}*`,
    c.qualification ? `Qualification: ${c.qualification}` : null,
    c.college ? `College: ${c.college}` : null,
    c.email ? `Email: ${c.email}` : null,
    c.dob ? `DOB: ${c.dob}` : null,
    c.address ? `Address: ${c.address}` : null,
    `Course(s): ${pending.courses.map((course) => course.title).join(", ")} (${batch} batch)`,
  ]
    .filter(Boolean)
    .join("\n")

  await sendWhatsAppText(
    to,
    `Please confirm your registration details:\n\n${summary}\n\nReply *YES* to confirm and submit, or *NO* to cancel.`
  )
}

const YES_WORDS = new Set(["yes", "y", "confirm", "ok", "okay", "sure", "haan", "yep", "yeah"])
const NO_WORDS = new Set(["no", "n", "cancel", "nahi"])

async function finalizeEnquiry(to: string, conversationId: string, pending: PendingAction) {
  const { name, qualification, email, dob, address } = pending.collected
  const batch = pending.batch || "Flexible"
  const courseList = pending.courses.map((c) => c.title).join(", ")

  const result = await captureLead(
    { waPhone: to },
    {
      name: name || "WhatsApp lead",
      courses: pending.courses.map((c) => ({ id: c.id, title: c.title })),
      qualification: qualification ?? null,
      batchTime: batch,
      email: email ?? null,
      dob: dob ?? null,
      address: address ?? null,
    }
  )

  await clearPendingAction(conversationId)

  if (!result.success) {
    await sendWhatsAppText(to, "Sorry, something went wrong saving that — could you try again in a moment?")
    return
  }

  await sendWhatsAppText(
    to,
    `Thanks ${name}! I've shared your interest in *${courseList}* (${batch} batch) with our counseling team — they'll reach out soon. 😊`
  )
}

async function finalizeRegistration(to: string, conversationId: string, pending: PendingAction, declaration: boolean) {
  const { name, qualification, email, dob, address, fathersName, college } = pending.collected

  const result = await createRegistration({
    waPhone: to,
    name: name || "WhatsApp lead",
    fathersName: fathersName ?? null,
    contactAddress: address || "Not provided",
    dob: dob || new Date().toISOString().slice(0, 10),
    email: email || "not-provided@caddeskguwahati.com",
    qualification: qualification || "Not provided",
    college: college || "Not provided",
    courses: pending.courses,
    declaration,
  })

  if (!result.success || !result.id) {
    await clearPendingAction(conversationId)
    await sendWhatsAppText(to, "Sorry, something went wrong saving that — could you try again in a moment?")
    return
  }

  const batch = pending.batch || "Flexible"
  const courseList = pending.courses.map((c) => c.title).join(", ")
  await sendWhatsAppText(
    to,
    `You're registered, ${name}! 🎉\nRegistration No: *${result.regNo}*\nCourse(s): ${courseList} (${batch} batch)\n\nOur team will confirm your seat and complete the paperwork at the Noonmati centre shortly.`
  )

  const settings = await getPaymentSettings()
  if (settings && settings.registrationFee > 0) {
    const upiLine = settings.upiId
      ? `\nUPI ID: *${settings.upiId}*\nOr pay via: upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=CAD%20Desk%20Guwahati&am=${settings.registrationFee}&cu=INR`
      : ""
    await sendWhatsAppText(
      to,
      `💳 Pay ₹${settings.registrationFee} now to confirm your seat — this also unlocks a *${settings.discountPercent}% discount on your course fee*.${upiLine}\n\nOnce paid, just send a screenshot of the payment here. Our team will verify it and send you a unique discount code to redeem at the centre.`
    )
    if (settings.qrImageUrl) {
      await sendWhatsAppImage(to, settings.qrImageUrl, `Scan to pay ₹${settings.registrationFee}`)
    }
    await setPendingAction(conversationId, {
      ...pending,
      step: "payment_screenshot",
      registrationId: result.id,
      paymentAmount: settings.registrationFee,
    })
    return
  }

  await clearPendingAction(conversationId)
}

/**
 * Called when a free-text reply arrives while a pending_action is waiting on it.
 * Returns a short label (for conversation history) describing what happened.
 * Registration is stricter than enquiry -- email/DOB/address/college can't be
 * skipped, since they're NOT NULL columns on the real student_registrations table.
 */
export async function completePendingAction(
  to: string,
  conversationId: string,
  pending: PendingAction,
  rawText: string,
  waName: string | null
): Promise<string> {
  const isRegister = pending.mode === "register"

  if (pending.step === "collect_courses") {
    // They typed something instead of tapping a button -- re-show the choice.
    const list = pending.courses.map((c) => c.title).join(", ")
    await sendWhatsAppButtons(to, `Your selection so far: ${list}.\nTap below to add another course or continue:`, [
      { id: `${COURSES_ADD_PREFIX}${pending.mode}`, title: "➕ Add Another" },
      { id: COURSES_CONTINUE, title: `➡️ Continue (${pending.courses.length})` },
    ])
    return "[re-sent add/continue buttons]"
  }

  if (pending.step === "payment_screenshot") {
    if (isSkip(rawText) || rawText.trim().toLowerCase() === "later") {
      await clearPendingAction(conversationId)
      await sendWhatsAppText(
        to,
        "No problem — you can pay later or at the centre. Our team will follow up. 😊"
      )
      return "[skipped payment screenshot]"
    }
    await sendWhatsAppText(
      to,
      "Once you've paid, please send a *screenshot/photo* of the payment here (or reply `skip` to pay later)."
    )
    return "[waiting for payment screenshot]"
  }

  if (pending.step === "name_qual") {
    let batch = pending.batch
    let name: string
    let qualification: string | undefined

    if (batch) {
      const parts = splitInto(rawText, 2)
      name = parts[0] || waName || "WhatsApp lead"
      qualification = parts[1] || undefined
    } else {
      // Batch was typed freely and may itself contain a dash (e.g. "6 PM - 8 PM"),
      // so fold overflow into the batch field, not the trailing name/qualification.
      const parts = splitFromEnd(rawText, 3)
      batch = parts[0] || "Flexible"
      name = parts[1] || waName || "WhatsApp lead"
      qualification = parts[2] || undefined
    }

    if (isRegister && !qualification) {
      await sendWhatsAppText(
        to,
        "Qualification is required to complete registration — please include it.\nExample: `Rahul Sharma - 12th Pass`"
      )
      return "[asked again: qualification required for registration]"
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
    if (isRegister && isSkip(rawText)) {
      await sendWhatsAppText(to, "Email and date of birth are required to complete registration — they can't be skipped.")
      return "[asked again: email/DOB required for registration]"
    }

    let email: string | undefined
    let dob: string | undefined

    if (!isSkip(rawText)) {
      const parts = splitInto(rawText, 2)
      email = parts[0] || undefined
      dob = parts[1] ? parseDob(parts[1]) ?? undefined : undefined
    }

    if (isRegister && (!email || !dob)) {
      await sendWhatsAppText(
        to,
        "I need both a valid email and date of birth (DD/MM/YYYY) to complete registration.\nExample: `rahul@email.com, 15/08/2000`"
      )
      return "[asked again: valid email/DOB required for registration]"
    }

    const next: PendingAction = {
      ...pending,
      collected: { ...pending.collected, email, dob },
    }
    await askAddress(to, conversationId, next)
    return "[collected email/DOB, asked for address]"
  }

  if (pending.step === "address") {
    const address = isSkip(rawText) ? null : rawText.trim() || null

    if (isRegister && !address) {
      await sendWhatsAppText(to, "Address is required to complete registration — it can't be skipped.")
      return "[asked again: address required for registration]"
    }

    const next: PendingAction = {
      ...pending,
      collected: { ...pending.collected, address: address ?? undefined },
    }

    if (isRegister) {
      await askFatherCollege(to, conversationId, next)
      return "[collected address, asked for father's name/college]"
    }

    await finalizeEnquiry(to, conversationId, next)
    return "[completed pending enquire]"
  }

  if (pending.step === "father_college") {
    const parts = splitInto(rawText, 2)
    let fathersName: string | undefined
    let college: string | undefined

    if (parts.length >= 2) {
      ;[fathersName, college] = parts
    } else {
      college = parts[0] || undefined
    }

    if (!college) {
      await sendWhatsAppText(
        to,
        "College/school name is required to complete registration (father's name is optional).\nExample: `Ramesh Sharma, ABC College` or just `ABC College`"
      )
      return "[asked again: college required for registration]"
    }

    const next: PendingAction = {
      ...pending,
      collected: { ...pending.collected, fathersName, college },
    }
    await askConfirm(to, conversationId, next)
    return "[collected father's name/college, asked to confirm]"
  }

  // step === "confirm" (register only)
  const answer = rawText.trim().toLowerCase()
  if (YES_WORDS.has(answer)) {
    await finalizeRegistration(to, conversationId, pending, true)
    return "[completed pending register]"
  }
  if (NO_WORDS.has(answer)) {
    await clearPendingAction(conversationId)
    await sendWhatsAppText(to, "No problem — registration cancelled. You can start again anytime from the menu.")
    return "[cancelled pending register]"
  }
  await sendWhatsAppText(to, "Please reply *YES* to confirm and submit, or *NO* to cancel.")
  return "[asked again: yes/no confirmation]"
}

async function sendEnquiryPrompt(to: string) {
  await sendCategoryList(to, "Happy to help! Which field is your question about?", "enquire")
}

/** Invites free text after "Ask a Question" is tapped -- the reply flows to the Gemini agent as normal. */
async function sendAskPrompt(to: string, context: string) {
  await sendWhatsAppText(to, `Sure! Type your question about ${context} and I'll do my best to help. 😊`)
}

async function sendRegistrationPrompt(to: string) {
  await sendCategoryList(to, "Let's get you registered! Which field would you like to join?", "register")
}

/**
 * Lets the Gemini agent hand off to the same structured Registration/Enquiry
 * flow a menu tap would start, when the student expresses that intent in
 * free text (e.g. "can you help me register") instead of tapping a button.
 * Mirrors handleMenuSelection's ROOT_ENQUIRY/ROOT_REGISTRATION branches,
 * including clearing any stale pending_action first.
 */
export async function startGuidedFlow(
  to: string,
  conversationId: string,
  mode: "enquire" | "register"
): Promise<void> {
  await clearPendingAction(conversationId)

  if (mode === "register" && getFeatureFlags().enableRegistration) {
    await sendRegistrationPrompt(to)
    return
  }
  await sendEnquiryPrompt(to)
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
  // Only a genuine "start over" tap abandons an in-progress course
  // selection/collection flow -- category/course/batch/cart taps all need
  // the pending_action to stay intact as students build up their selection.
  const isResetTap =
    id === MENU_MAIN ||
    id === ROOT_COURSES ||
    id === ROOT_ENQUIRY ||
    id === ROOT_REGISTRATION ||
    id === ROOT_ASK ||
    id.startsWith(ASK_PREFIX)
  if (isResetTap) {
    await clearPendingAction(conversationId)
  }

  if (id === MENU_MAIN) {
    await sendWelcomeMenu(to)
    return "[tapped: Main Menu]"
  }
  if (id === ROOT_COURSES) {
    await sendCategoryList(to, "Which field are you interested in?", "browse")
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
    const [flow, category] = splitFlow(id.slice(CATEGORY_PREFIX.length))
    await sendCourseList(to, category, flow)
    return `[tapped category: ${category}]`
  }
  if (id.startsWith(COURSE_PREFIX)) {
    const [flow, courseId] = splitFlow(id.slice(COURSE_PREFIX.length))
    await sendCourseDetail(to, courseId, flow, conversationId)
    return `[tapped course: ${courseId}]`
  }
  if (id.startsWith(MORE_PREFIX)) {
    // "<flow>:<nextOffset>:<category>" -- pagination, show the next page of courses.
    const rest = id.slice(MORE_PREFIX.length)
    const firstColon = rest.indexOf(":")
    const secondColon = rest.indexOf(":", firstColon + 1)
    const flow = rest.slice(0, firstColon) as BrowseFlow
    const offset = Number(rest.slice(firstColon + 1, secondColon)) || 0
    const category = rest.slice(secondColon + 1)
    await sendCourseList(to, category, flow, offset)
    return `[tapped: more courses in ${category} at ${offset}]`
  }
  if (id.startsWith(TYPE_PREFIX)) {
    const category = id.slice(TYPE_PREFIX.length)
    await sendMoreCoursesPrompt(to, category)
    return `[tapped: type course name in ${category}]`
  }
  if (id.startsWith(ENQUIRE_PREFIX) || id.startsWith(REGISTER_PREFIX)) {
    let mode: "enquire" | "register" = id.startsWith(REGISTER_PREFIX) ? "register" : "enquire"
    if (mode === "register" && !getFeatureFlags().enableRegistration) mode = "enquire"
    const courseId = id.slice(id.startsWith(REGISTER_PREFIX) ? REGISTER_PREFIX.length : ENQUIRE_PREFIX.length)

    const supabase = getSupabaseAdmin()
    const { data: course } = supabase
      ? await supabase.from("courses").select("title").eq("id", courseId).maybeSingle()
      : { data: null }

    await addCourseToSelection(to, conversationId, mode, courseId, course?.title ?? "this course")
    return `[tapped ${mode}: ${courseId}]`
  }
  if (id.startsWith(COURSES_ADD_PREFIX)) {
    const flow = id.slice(COURSES_ADD_PREFIX.length) as "enquire" | "register"
    await sendCategoryList(to, "Sure! Which field is the next course in?", flow)
    return "[tapped: Add Another Course]"
  }
  if (id === COURSES_CONTINUE) {
    const pending = await getPendingAction(conversationId)
    if (!pending || pending.step !== "collect_courses" || pending.courses.length === 0) {
      await sendWelcomeMenu(to)
      return "[tapped: Continue (no active selection, showed menu)]"
    }
    await sendBatchOptions(to, pending.mode, pending.courses)
    return "[tapped: Continue with course selection]"
  }
  if (id.startsWith(BATCH_PREFIX)) {
    // "<mode>:<Morning|Afternoon|Evening|other>" -- course list lives in pending_action, not the id.
    const rest = id.slice(BATCH_PREFIX.length)
    const sepIdx = rest.indexOf(":")
    const mode = rest.slice(0, sepIdx) as PendingAction["mode"]
    const batchRaw = rest.slice(sepIdx + 1)

    const pending = await getPendingAction(conversationId)
    if (!pending || pending.step !== "collect_courses" || pending.courses.length === 0) {
      await sendWelcomeMenu(to)
      return "[tapped: batch (no active selection, showed menu)]"
    }

    const batch = batchRaw === "other" ? null : batchRaw
    await startNameCollection(to, conversationId, mode, pending.courses, batch)
    return `[tapped batch: ${batchRaw}]`
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
