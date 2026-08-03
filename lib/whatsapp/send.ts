import "server-only"

const GRAPH_API_VERSION = "v21.0"

/**
 * Sends a plain-text WhatsApp message via the Meta Cloud API.
 * Returns true on success; logs and returns false on failure so the
 * webhook handler can still ack Meta's request even if the send fails.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.error("[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID")
    return false
  }

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
    return false
  }

  return true
}
