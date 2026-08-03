import "server-only"

const GRAPH_API_VERSION = "v21.0"

export interface SendResult {
  ok: boolean
  status?: number
  error?: string
}

/**
 * Sends a plain-text WhatsApp message via the Meta Cloud API.
 * Returns a result object (rather than throwing) so the webhook handler
 * can still ack Meta's request even if the send fails, while giving
 * callers the exact status/error for logging or persistence.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    const msg = "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID"
    console.error("[whatsapp]", msg)
    return { ok: false, error: msg }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { preview_url: false, body },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      console.error("[whatsapp] send failed:", res.status, errText)
      return { ok: false, status: res.status, error: errText.slice(0, 1000) }
    }

    return { ok: true, status: res.status }
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error("[whatsapp] send threw:", msg)
    return { ok: false, error: msg.slice(0, 1000) }
  }
}
