import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"

/** Fixed code for the Noonmati, Guwahati centre -- every bot-created registration uses this. */
const CENTRE_CODE = "GUWAHATI20_1"

function generateRegNo(): string {
  const n = Math.floor(100000 + Math.random() * 900000) // 6 digits, matches existing "REG-GUW-XXXXXX" convention
  return `REG-GUW-${n}`
}

export interface RegistrationFields {
  waPhone: string
  name: string
  fathersName?: string | null
  contactAddress: string
  dob: string // ISO yyyy-mm-dd
  email: string
  qualification: string
  college: string
  courses: { id: string; title: string }[]
  declaration: boolean
}

/**
 * Writes a full record to `student_registrations` (the real enrollment table,
 * distinct from `enquiries`). Fields the WhatsApp bot can't reasonably collect
 * (photo, fee, software covered) are left null/default -- staff fill those in
 * during in-person paperwork at the centre.
 */
export async function createRegistration(
  fields: RegistrationFields
): Promise<{ success: boolean; id?: string; regNo?: string; error?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The registration database isn't configured right now." }

  const today = new Date().toISOString().slice(0, 10)
  const regNo = generateRegNo()

  const { data, error } = await supabase
    .from("student_registrations")
    .insert({
      date: today,
      reg_no: regNo,
      centre_code: CENTRE_CODE,
      name: fields.name,
      fathers_name: fields.fathersName ?? "",
      contact_address: fields.contactAddress,
      dob: fields.dob,
      email: fields.email,
      qualification: fields.qualification,
      college: fields.college,
      phone: fields.waPhone,
      courses: fields.courses.length ? fields.courses.map((c) => ({ id: c.id, name: c.title })) : null,
      joining_date: today,
      declaration: fields.declaration,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[registrations] createRegistration failed:", error)
    return { success: false, error: "Could not save the registration — please try again." }
  }

  return { success: true, id: data.id, regNo }
}

/** Attaches a payment screenshot URL to an existing registration and flags it for staff review. */
export async function attachPaymentScreenshot(
  registrationId: string,
  screenshotUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The registration database isn't configured right now." }

  const { error } = await supabase
    .from("student_registrations")
    .update({ payment_screenshot_url: screenshotUrl, payment_status: "pending_verification" })
    .eq("id", registrationId)

  if (error) {
    console.error("[registrations] attachPaymentScreenshot failed:", error)
    return { success: false, error: "Could not save the payment screenshot — please try again." }
  }

  return { success: true }
}

export interface PaymentSettings {
  registrationFee: number
  discountPercent: number
  upiId: string | null
  qrImageUrl: string | null
}

/** Reads the single admin-configurable payment settings row (fee/discount/UPI details). */
export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("payment_settings")
    .select("registration_fee, discount_percent, upi_id, qr_image_url")
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("[registrations] getPaymentSettings failed:", error)
    return null
  }

  return {
    registrationFee: Number(data.registration_fee),
    discountPercent: Number(data.discount_percent),
    upiId: data.upi_id,
    qrImageUrl: data.qr_image_url,
  }
}
