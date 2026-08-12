import "server-only"

const GRAPH_API_VERSION = "v21.0"

export interface SendResult {
  ok: boolean
  status?: number
  error?: string
}

async function postToGraph(payload: Record<string, unknown>): Promise<SendResult> {
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
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
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

/** Sends a plain-text WhatsApp message via the Meta Cloud API. */
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  return postToGraph({ to, type: "text", text: { preview_url: false, body } })
}

/** Sends an image from a public URL (e.g. a UPI QR code), with an optional caption. */
export async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string): Promise<SendResult> {
  return postToGraph({ to, type: "image", image: { link: imageUrl, caption } })
}

export interface QuickReplyButton {
  /** Echoed back in the button_reply webhook -- keep short, we route on this. */
  id: string
  /** Max 20 characters (WhatsApp limit). */
  title: string
}

/** Sends up to 3 tappable reply buttons under a body message. */
export async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  buttons: QuickReplyButton[]
): Promise<SendResult> {
  return postToGraph({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  })
}

export interface ListRow {
  /** Echoed back in the list_reply webhook -- keep short, we route on this. */
  id: string
  /** Max 24 characters (WhatsApp limit). */
  title: string
  /** Max 72 characters (WhatsApp limit). */
  description?: string
}

export interface ListSection {
  title?: string
  rows: ListRow[]
}

/** Sends a "View options" list menu (up to 10 rows total across sections). */
export async function sendWhatsAppList(
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: ListSection[]
): Promise<SendResult> {
  return postToGraph({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: sections.map((s) => ({
          title: s.title?.slice(0, 24),
          rows: s.rows.map((r) => ({
            id: r.id,
            title: r.title.slice(0, 24),
            description: r.description?.slice(0, 72),
          })),
        })),
      },
    },
  })
}
