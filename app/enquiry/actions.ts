"use server"

import { headers } from "next/headers"
import { getPublicCourses } from "@/lib/public-courses"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { SITE_CONTACT_PHONE_DISPLAY } from "@/lib/site"

export type EnquiryValues = {
  type: string
  filledBy: string
  name: string
  contactName: string
  phone: string
  email: string
  qualification: string
  batch: string
  mode: string
  message: string
  courses: string[]
  heard: string[]
}

export type EnquiryState =
  | { ok: true; name: string; phone: string }
  | { ok: false; errors: Record<string, string>; values: EnquiryValues; message?: string }
  | null

const FILLED_BY = ["student", "parent", "other"] as const
const BATCHES = ["Morning", "Afternoon", "Evening", "Weekend", "Flexible"]
const MODES = ["Classroom", "Online", "Either"]
// matches the values already used in enquiries.sources, plus a few more
const HEARD = ["News Paper", "TV/Banners", "Presentations", "Social media", "Friend or relative", "Google search", "Other"]

// ponytail: per-instance memory, so it resets on a cold start and is not shared across servers. A first line of
// defence against a flood from one address; move to Upstash/Redis if the form is ever hammered.
const hits = new Map<string, { n: number; since: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_WINDOW = 5

function tooMany(ip: string) {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.since > WINDOW_MS) {
    hits.set(ip, { n: 1, since: now })
    return false
  }
  h.n += 1
  return h.n > MAX_PER_WINDOW
}

/** Indian mobile: accepts 98765 43210, +91 98765 43210, 098765 43210. Returns the 10 digits, or null. */
function indianMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, "")
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2)
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : null
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const text = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max)
  const values: EnquiryValues = {
    type: text("type", 20) === "register" ? "register" : "enquiry",
    filledBy: (FILLED_BY as readonly string[]).includes(text("filledBy", 10)) ? text("filledBy", 10) : "student",
    name: text("name", 80),
    contactName: text("contactName", 80),
    phone: text("phone", 30),
    email: text("email", 120),
    qualification: text("qualification", 120),
    batch: BATCHES.includes(text("batch", 20)) ? text("batch", 20) : "",
    mode: MODES.includes(text("mode", 20)) ? text("mode", 20) : "",
    message: text("message", 500),
    courses: formData.getAll("course").map(String).slice(0, 10),
    heard: formData.getAll("heard").map(String).filter((h) => HEARD.includes(h)),
  }

  // Bots: a hidden field real people never fill, and a form that was "filled" faster than a person can.
  const startedAt = Number(formData.get("t"))
  if (text("website", 50) || !startedAt || Date.now() - startedAt < 2500) {
    return { ok: true, name: values.name || "there", phone: values.phone } // pretend success, store nothing
  }

  const errors: Record<string, string> = {}
  if (values.name.length < 2) errors.name = "Please enter the student's name."
  const mobile = indianMobile(values.phone)
  if (!mobile) errors.phone = "Enter a 10-digit mobile number, for example 98765 43210."
  if (values.email && !EMAIL.test(values.email)) errors.email = "That email address doesn't look right."
  if (!values.courses.length) errors.course = "Choose at least one course."
  if (formData.get("consent") !== "on") errors.consent = "Please tick the box so we can contact you."
  if (Object.keys(errors).length || !mobile) return { ok: false, errors, values }

  const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
  if (tooMany(ip)) {
    return { ok: false, errors: {}, values, message: `Too many submissions from this connection. Please call us on ${SITE_CONTACT_PHONE_DISPLAY}.` }
  }

  // Only courses that really exist: ids from the form are checked against the catalogue.
  const catalogue = await getPublicCourses()
  const chosen = values.courses.map((id) => catalogue.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c)
  if (!chosen.length) return { ok: false, errors: { course: "Choose at least one course." }, values }

  const supabase = getSupabaseAdmin()
  const failed: EnquiryState = {
    ok: false,
    errors: {},
    values,
    message: `We couldn't save that just now. Please try again, or call us on ${SITE_CONTACT_PHONE_DISPLAY}.`,
  }
  if (!supabase) return failed

  const phone = `91${mobile}` // same format the WhatsApp bot stores, so one person is one phone number everywhere

  // The same number twice in ten minutes is a double click or a retry, not a second enquiry.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: recent } = await supabase.from("enquiries").select("id").eq("phone", phone).eq("channel", "Website").gte("created_at", since).limit(1)
  if (recent && recent.length) return { ok: true, name: values.name, phone: mobile }

  // enquiries has no columns for these, so they go in one readable note line for the counsellor.
  const note = [
    `Request: ${values.type === "register" ? "Registration" : "Enquiry"}`,
    `Filled by: ${values.filledBy === "parent" ? "Parent/guardian" : values.filledBy === "other" ? "Someone else" : "Student"}${values.contactName ? ` (${values.contactName})` : ""}`,
    values.mode && `Mode: ${values.mode}`,
    values.message && `Message: ${values.message}`,
  ]
    .filter(Boolean)
    .join(" | ")

  const { error } = await supabase.from("enquiries").insert({
    phone,
    channel: "Website",
    status: "New",
    sources: ["Website Form", ...values.heard],
    name: values.name,
    course: chosen[0].title,
    course_id: chosen[0].id,
    courses: chosen.map((c) => ({ id: c.id, name: c.title })),
    qualification: values.qualification || null,
    batch_time: values.batch || null,
    email: values.email || null,
    escalation_note: note,
  })

  if (error) {
    console.error("[enquiry-form] insert failed:", error.code, error.message) // no personal details in the log
    return failed
  }

  return { ok: true, name: values.name, phone: mobile }
}
