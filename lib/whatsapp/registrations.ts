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
  courseId?: string | null
  courseTitle?: string | null
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
): Promise<{ success: boolean; regNo?: string; error?: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The registration database isn't configured right now." }

  const today = new Date().toISOString().slice(0, 10)
  const regNo = generateRegNo()

  const { error } = await supabase.from("student_registrations").insert({
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
    courses: fields.courseId ? [{ id: fields.courseId, name: fields.courseTitle ?? null }] : null,
    joining_date: today,
    declaration: fields.declaration,
  })

  if (error) {
    console.error("[registrations] createRegistration failed:", error)
    return { success: false, error: "Could not save the registration — please try again." }
  }

  return { success: true, regNo }
}
