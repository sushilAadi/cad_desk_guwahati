import { NextRequest, NextResponse } from "next/server"

import { runAgentTurn } from "@/lib/gemini/agent"
import { sendWhatsAppText } from "@/lib/whatsapp/send"
import {
  appendMessage,
  getOrCreateConversation,
  getRecentMessages,
  isDuplicateMessage,
} from "@/lib/whatsapp/conversations"
import { verifyWhatsAppSignature } from "@/lib/whatsapp/verify"

export const dynamic = "force-dynamic"

// ── Webhook verification (Meta calls this once when you configure the webhook URL) ──
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

interface WhatsAppTextMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WhatsAppContact {
  profile?: { name?: string }
  wa_id: string
}

interface WhatsAppChangeValue {
  messages?: WhatsAppTextMessage[]
  contacts?: WhatsAppContact[]
  statuses?: unknown[]
}

interface WhatsAppWebhookPayload {
  entry?: {
    changes?: { value?: WhatsAppChangeValue; field?: string }[]
  }[]
}

// ── Incoming messages ──
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const signature = request.headers.get("x-hub-signature-256")
  if (!verifyWhatsAppSignature(rawBody, signature)) {
    console.error("[webhook] invalid signature")
    return new NextResponse("Invalid signature", { status: 401 })
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse("Bad request", { status: 400 })
  }

  // Meta expects a fast 200 ack. We process inline (fine for this volume);
  // if traffic grows, move the work below onto a queue and ack immediately.
  try {
    await handleWebhookPayload(payload)
  } catch (err) {
    console.error("[webhook] handling failed:", err)
  }

  return new NextResponse("OK", { status: 200 })
}

async function handleWebhookPayload(payload: WhatsAppWebhookPayload) {
  const changes = payload.entry?.flatMap((entry) => entry.changes ?? []) ?? []

  for (const change of changes) {
    const value = change.value
    const messages = value?.messages
    if (!messages || messages.length === 0) continue // e.g. a delivery/read status update

    const contact = value?.contacts?.[0]
    const waName = contact?.profile?.name ?? null

    for (const message of messages) {
      if (message.type !== "text" || !message.text?.body) {
        // Non-text message (image/audio/location/etc.) -- not handled yet.
        await sendWhatsAppText(
          message.from,
          "I can only read text messages right now — could you type your question? 🙂"
        )
        continue
      }

      if (await isDuplicateMessage(message.id)) continue // webhook retry

      const conversationId = await getOrCreateConversation(message.from, waName)
      if (!conversationId) {
        console.error("[webhook] no conversation id (Supabase not configured?)")
        continue
      }

      // Fetch prior history *before* appending this message, so the agent
      // gets it once via `userText` rather than duplicated in `history`.
      const history = await getRecentMessages(conversationId, 12)
      await appendMessage(conversationId, "user", message.text.body, message.id)

      const reply = await runAgentTurn(history, message.text.body, {
        waPhone: message.from,
        waName,
      })

      await appendMessage(conversationId, "assistant", reply)
      await sendWhatsAppText(message.from, reply)
    }
  }
}
