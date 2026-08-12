import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppText } from "@/lib/whatsapp/send"

export const dynamic = "force-dynamic"

// Avoid visually-ambiguous characters (0/O, 1/I/L) so a staff member reading
// a code aloud or a student retyping it by hand can't easily get it wrong.
const DISCOUNT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function generateDiscountCode(): string {
  const bytes = randomBytes(10)
  let code = ""
  for (let i = 0; i < bytes.length; i++) {
    code += DISCOUNT_CODE_ALPHABET[bytes[i] % DISCOUNT_CODE_ALPHABET.length]
  }
  return `CAD-${code}`
}

interface VerifyPaymentBody {
  registrationId?: string
  paymentId?: string
  verifiedBy?: string
}

/**
 * Called by NeeedCADAdmin (server-side, never the browser directly) when
 * staff click "Mark paid" on a registration. Single source of truth for
 * discount-code generation -- generates it here, writes it to Supabase, and
 * immediately WhatsApps the student, instead of the admin panel generating
 * a code and staff having to manually relay it.
 *
 * Protected by a shared secret (ADMIN_API_SECRET) rather than Supabase
 * auth, since the caller is another app's server, not a logged-in user.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret")
  if (!secret || !process.env.ADMIN_API_SECRET || secret !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: VerifyPaymentBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 })
  }

  const { registrationId, paymentId, verifiedBy } = body
  if (!registrationId) {
    return NextResponse.json({ success: false, error: "registrationId is required" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
  }

  const { data: registration, error: regFetchError } = await supabase
    .from("student_registrations")
    .select("id, name, phone")
    .eq("id", registrationId)
    .maybeSingle()

  if (regFetchError || !registration) {
    console.error("[verify-payment] registration lookup failed:", regFetchError)
    return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 })
  }

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("discount_percent")
    .limit(1)
    .maybeSingle()
  const discountPercent = settings ? Number(settings.discount_percent) : null

  const discountCode = generateDiscountCode()
  const now = new Date().toISOString()

  if (paymentId) {
    const { error: paymentError } = await supabase
      .from("payments")
      .update({ status: "verified", verified_at: now, verified_by: verifiedBy || null })
      .eq("id", paymentId)

    if (paymentError) {
      console.error("[verify-payment] payments update failed:", paymentError)
      return NextResponse.json({ success: false, error: "Could not verify the payment record" }, { status: 500 })
    }
  }

  const { error: regUpdateError } = await supabase
    .from("student_registrations")
    .update({ payment_status: "paid", discount_code: discountCode })
    .eq("id", registrationId)

  if (regUpdateError) {
    console.error("[verify-payment] student_registrations update failed:", regUpdateError)
    return NextResponse.json({ success: false, error: "Could not save the discount code" }, { status: 500 })
  }

  let whatsappSent = false
  let whatsappError: string | undefined
  if (registration.phone) {
    const discountLine = discountPercent
      ? `for ${discountPercent}% off your course fee`
      : "on your course fee"
    const message = `Hi ${registration.name || "there"}! Your CAD Desk Guwahati registration payment is confirmed ✅\n\nYour discount code: *${discountCode}*\nShow this at the centre ${discountLine}.`
    const sendResult = await sendWhatsAppText(registration.phone, message)
    whatsappSent = sendResult.ok
    if (!sendResult.ok) {
      whatsappError = sendResult.error
      // Common cause: it's been >24h since the student's last message, so
      // Meta blocks free-form outbound text (would need an approved
      // message template to reach them after that window). Not fatal --
      // the code is already saved, staff can relay it manually.
      console.error("[verify-payment] WhatsApp send failed:", sendResult.error)
    }
  }

  return NextResponse.json({ success: true, discountCode, whatsappSent, whatsappError })
}
