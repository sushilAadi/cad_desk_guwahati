import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/send"

export interface LeadContext {
  waPhone: string
}

/**
 * Shared lead-capture logic, used both by the Gemini `capture_lead` tool
 * (free-text conversations) and the deterministic menu handlers (button/list
 * taps) -- one insert path so leads always land in `enquiries` the same way.
 */
export async function captureLead(
  ctx: LeadContext,
  fields: {
    name: string
    /** Multiple courses (from the WhatsApp menu flow). Takes precedence over courseTitle/courseId when set. */
    courses?: { id?: string | null; title: string }[]
    courseTitle?: string | null
    courseId?: string | null
    qualification?: string | null
    batchTime?: string | null
    email?: string | null
    dob?: string | null // ISO yyyy-mm-dd, or null
    address?: string | null
  }
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The course database isn't configured right now." }

  const courses = fields.courses ?? (fields.courseTitle ? [{ id: fields.courseId, title: fields.courseTitle }] : [])

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      phone: ctx.waPhone,
      channel: "WhatsApp",
      status: "New",
      sources: ["WhatsApp Bot"],
      name: fields.name,
      course: courses[0]?.title ?? null,
      course_id: courses[0]?.id ?? null,
      // Full multi-course list -- course/course_id above only capture the first, for back-compat with joins/filters.
      courses: courses.length ? courses.map((c) => ({ id: c.id ?? null, name: c.title })) : null,
      qualification: fields.qualification ?? null,
      batch_time: fields.batchTime ?? null,
      email: fields.email ?? null,
      dob: fields.dob ?? null,
      address: fields.address ?? null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[leads] captureLead failed:", error)
    return { success: false, error: "Could not save the enquiry — please try again." }
  }

  return { success: true, leadId: data.id }
}

export async function requestCallback(
  ctx: LeadContext,
  fields: { name?: string | null; note?: string | null }
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The course database isn't configured right now." }

  // Ping the institute's own WhatsApp number the same way flagUnmatchedCourse
  // does, so a callback request is never just a silent database row -- staff
  // get an immediate heads-up even if they don't have the admin panel open.
  const alertNumber = process.env.INSTITUTE_ALERT_WHATSAPP_NUMBER
  const templateName = process.env.INSTITUTE_CALLBACK_ALERT_TEMPLATE_NAME

  let whatsappAlertSent = false
  let whatsappAlertError: string | null = null

  if (alertNumber && templateName) {
    const result = await sendWhatsAppTemplate(alertNumber, templateName, "en", [
      fields.name?.trim() || "Unknown",
      ctx.waPhone,
      fields.note?.slice(0, 200) || "No additional details",
    ])
    whatsappAlertSent = result.ok
    if (!result.ok) whatsappAlertError = result.error ?? "Unknown send error"
  } else {
    whatsappAlertError = "INSTITUTE_ALERT_WHATSAPP_NUMBER or INSTITUTE_CALLBACK_ALERT_TEMPLATE_NAME not configured"
  }

  if (whatsappAlertError) console.error("[leads] institute callback alert failed:", whatsappAlertError)

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
      .update({
        callback_requested: true,
        escalation_note: fields.note ?? null,
        whatsapp_alert_sent: whatsappAlertSent,
        whatsapp_alert_error: whatsappAlertError,
      })
      .eq("id", existing.id)
    if (error) return { success: false, error: "Could not flag the callback." }
    return { success: true, leadId: existing.id }
  }

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      phone: ctx.waPhone,
      channel: "WhatsApp",
      status: "New",
      sources: ["WhatsApp Bot"],
      name: fields.name ?? "WhatsApp lead",
      callback_requested: true,
      escalation_note: fields.note ?? null,
      whatsapp_alert_sent: whatsappAlertSent,
      whatsapp_alert_error: whatsappAlertError,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Could not save the callback request." }
  return { success: true, leadId: data.id }
}

/**
 * Logs a "bot couldn't confirm this course exists" moment and pings the
 * institute's own WhatsApp number so staff can call the student directly --
 * the student may never call in themselves, so this makes sure the lead
 * isn't silently lost. Uses an approved template because the institute
 * number won't generally have messaged the bot in the last 24h.
 */
export async function flagUnmatchedCourse(
  ctx: LeadContext,
  fields: { name?: string | null; queryText: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The course database isn't configured right now." }

  const alertNumber = process.env.INSTITUTE_ALERT_WHATSAPP_NUMBER
  const templateName = process.env.INSTITUTE_ALERT_TEMPLATE_NAME

  let whatsappAlertSent = false
  let whatsappAlertError: string | null = null

  if (alertNumber && templateName) {
    const result = await sendWhatsAppTemplate(alertNumber, templateName, "en", [
      fields.name?.trim() || "Unknown",
      ctx.waPhone,
      fields.queryText.slice(0, 200),
    ])
    whatsappAlertSent = result.ok
    if (!result.ok) whatsappAlertError = result.error ?? "Unknown send error"
  } else {
    whatsappAlertError = "INSTITUTE_ALERT_WHATSAPP_NUMBER or INSTITUTE_ALERT_TEMPLATE_NAME not configured"
  }

  const { error } = await supabase.from("unmatched_queries").insert({
    phone: ctx.waPhone,
    name: fields.name?.trim() || null,
    query_text: fields.queryText.slice(0, 500),
    whatsapp_alert_sent: whatsappAlertSent,
    whatsapp_alert_error: whatsappAlertError,
  })

  if (error) {
    console.error("[leads] flagUnmatchedCourse insert failed:", error)
    return { success: false, error: "Could not log the unmatched query." }
  }

  if (whatsappAlertError) console.error("[leads] institute alert send failed:", whatsappAlertError)

  return { success: true }
}
