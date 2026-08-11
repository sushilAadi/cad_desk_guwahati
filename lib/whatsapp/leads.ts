import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"

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

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      phone: ctx.waPhone,
      channel: "WhatsApp",
      status: "New",
      sources: ["WhatsApp Bot"],
      name: fields.name,
      course: fields.courseTitle ?? null,
      course_id: fields.courseId ?? null,
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
      .update({ callback_requested: true, escalation_note: fields.note ?? null })
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
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Could not save the callback request." }
  return { success: true, leadId: data.id }
}
