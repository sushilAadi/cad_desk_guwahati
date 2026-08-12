import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"

const GRAPH_API_VERSION = "v21.0"

/**
 * Downloads an inbound WhatsApp media attachment (e.g. a payment screenshot)
 * and stores it in the private "payment-screenshots" Supabase Storage bucket.
 * Returns the storage path (not a public URL -- the bucket is private, so
 * viewers need a signed URL generated on demand).
 */
export async function downloadAndStoreWhatsAppMedia(
  mediaId: string,
  destPathPrefix: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) return { success: false, error: "Missing WHATSAPP_ACCESS_TOKEN" }

  const supabase = getSupabaseAdmin()
  if (!supabase) return { success: false, error: "The database isn't configured right now." }

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!metaRes.ok) {
      return { success: false, error: `Could not look up media (${metaRes.status})` }
    }
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string }
    if (!meta.url) return { success: false, error: "Media metadata missing a download URL" }

    const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } })
    if (!fileRes.ok) {
      return { success: false, error: `Could not download media (${fileRes.status})` }
    }
    const bytes = await fileRes.arrayBuffer()

    const ext = (meta.mime_type ?? "image/jpeg").split("/")[1]?.split(";")[0] ?? "jpg"
    const path = `${destPathPrefix}/${mediaId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(path, Buffer.from(bytes), { contentType: meta.mime_type ?? "image/jpeg", upsert: true })

    if (uploadError) {
      console.error("[media] upload failed:", uploadError)
      return { success: false, error: "Could not save the screenshot — please try again." }
    }

    return { success: true, path }
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error("[media] downloadAndStoreWhatsAppMedia threw:", msg)
    return { success: false, error: "Could not save the screenshot — please try again." }
  }
}
