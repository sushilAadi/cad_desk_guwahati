import { NextRequest, NextResponse } from "next/server"

import { runAgentTurn } from "@/lib/gemini/agent"
import { sendWhatsAppText } from "@/lib/whatsapp/send"
import {
  sendWelcomeMenu,
  handleMenuSelection,
  completePendingAction,
  isMenuResetKeyword,
} from "@/lib/whatsapp/menu"
import {
  appendMessage,
  clearPendingAction,
  getOrCreateConversation,
  getPendingAction,
  getRecentMessages,
  isDuplicateMessage,
  recordSendResult,
} from "@/lib/whatsapp/conversations"
import { verifyWhatsAppSignature } from "@/lib/whatsapp/verify"
import { downloadAndStoreWhatsAppMedia } from "@/lib/whatsapp/media"
import { recordPaymentSubmission } from "@/lib/whatsapp/registrations"
import { getSupabaseAdmin } from "@/lib/supabase/server"

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

interface WhatsAppInteractiveReply {
  type: "button_reply" | "list_reply"
  button_reply?: { id: string; title: string }
  list_reply?: { id: string; title: string; description?: string }
}

interface WhatsAppTextMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  interactive?: WhatsAppInteractiveReply
  image?: { id: string; mime_type?: string; sha256?: string; caption?: string }
}

interface WhatsAppContact {
  profile?: { name?: string }
  wa_id: string
}

interface WhatsAppStatus {
  id: string
  status: string
  timestamp: string
  recipient_id?: string
  errors?: { code: number; title?: string; message?: string; error_data?: { details?: string } }[]
}

interface WhatsAppChangeValue {
  messages?: WhatsAppTextMessage[]
  contacts?: WhatsAppContact[]
  statuses?: WhatsAppStatus[]
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

    if (value?.statuses?.length) {
      await recordDeliveryStatuses(value.statuses)
    }

    const messages = value?.messages
    if (!messages || messages.length === 0) continue // e.g. a delivery/read status update

    const contact = value?.contacts?.[0]
    const waName = contact?.profile?.name ?? null

    for (const message of messages) {
      if (await isDuplicateMessage(message.id)) continue // webhook retry

      const conversation = await getOrCreateConversation(message.from, waName)
      if (!conversation) {
        console.error("[webhook] no conversation id (Supabase not configured?)")
        continue
      }
      const conversationId = conversation.id

      // Brand-new conversation: always greet with the menu first, regardless
      // of what they typed -- don't send this first turn to Gemini at all.
      if (conversation.isNew) {
        const inboundLabel =
          message.type === "text" ? message.text?.body ?? "" : `[${message.type} message]`
        await appendMessage(conversationId, "user", inboundLabel, message.id)
        const assistantId = await appendMessage(conversationId, "assistant", "[sent welcome menu]")
        const sendResult = await sendWelcomeMenu(message.from)
        if (assistantId) await recordSendResult(assistantId, sendResult)
        continue
      }

      // Button/list tap -- deterministic menu navigation, no Gemini involved.
      if (message.type === "interactive" && message.interactive) {
        const reply = message.interactive.button_reply ?? message.interactive.list_reply
        if (!reply) continue

        await appendMessage(conversationId, "user", `[tapped: ${reply.title}]`, message.id)
        const label = await handleMenuSelection(message.from, reply.id, waName, conversationId)
        await appendMessage(conversationId, "assistant", label)
        continue
      }

      // Image reply while we're waiting on a payment screenshot -- download it
      // from Meta, store it privately in Supabase, and flag the registration
      // for staff to verify. Any other image (not expected) falls through to
      // the generic "text only" message below.
      if (message.type === "image" && message.image?.id) {
        const pending = await getPendingAction(conversationId)
        if (pending?.step === "payment_screenshot" && pending.registrationId) {
          await appendMessage(conversationId, "user", "[sent payment screenshot]", message.id)

          const upload = await downloadAndStoreWhatsAppMedia(
            message.image.id,
            `registrations/${pending.registrationId}`
          )

          let reply: string
          if (upload.success && upload.path) {
            await recordPaymentSubmission({
              registrationId: pending.registrationId,
              amount: pending.paymentAmount ?? 0,
              screenshotUrl: upload.path,
              whatsappMessageId: message.id,
            })
            await clearPendingAction(conversationId)
            reply =
              "Got it! ✅ We've received your payment screenshot — our team will verify it and send you a unique discount code once confirmed. 🎉\n\nEven if the code doesn't reach you right away, don't worry — we already have your details and payment screenshot safely on record, so nothing is lost. Our team can always look it up for you."
          } else {
            reply = "Sorry, I couldn't save that screenshot — could you try sending it again?"
          }

          const assistantId = await appendMessage(conversationId, "assistant", reply)
          const sendResult = await sendWhatsAppText(message.from, reply)
          if (assistantId) await recordSendResult(assistantId, sendResult)
          continue
        }
      }

      if (message.type !== "text" || !message.text?.body) {
        // Non-text, non-interactive message (image/audio/location/etc.) -- not handled yet.
        await sendWhatsAppText(
          message.from,
          "I can only read text messages right now — could you type your question? 🙂"
        )
        continue
      }

      // Typed "menu"/"hi"/"start" etc. always resets to the main menu, from
      // anywhere -- checked before any in-progress flow or Gemini, so no one
      // can get stuck mid-conversation with no way back.
      if (isMenuResetKeyword(message.text.body)) {
        await clearPendingAction(conversationId)
        await appendMessage(conversationId, "user", message.text.body, message.id)
        const assistantId = await appendMessage(conversationId, "assistant", "[sent welcome menu]")
        const sendResult = await sendWelcomeMenu(message.from)
        if (assistantId) await recordSendResult(assistantId, sendResult)
        continue
      }

      // A registration/enquiry flow is waiting on this exact reply (name,
      // qualification, maybe batch) -- handle it directly, skip Gemini.
      const pending = await getPendingAction(conversationId)
      if (pending) {
        await appendMessage(conversationId, "user", message.text.body, message.id)
        const label = await completePendingAction(message.from, conversationId, pending, message.text.body, waName)
        await appendMessage(conversationId, "assistant", label)
        continue
      }

      // Fetch prior history *before* appending this message, so the agent
      // gets it once via `userText` rather than duplicated in `history`.
      const history = await getRecentMessages(conversationId, 12)
      await appendMessage(conversationId, "user", message.text.body, message.id)

      const reply = await runAgentTurn(history, message.text.body, {
        waPhone: message.from,
        waName,
        conversationId,
      })

      // null means a tool (e.g. start_guided_flow) already sent its own
      // WhatsApp message directly -- nothing left to send, and no menu hint
      // either, since that message has its own navigation built in.
      if (reply === null) {
        await appendMessage(conversationId, "assistant", "[handed off to guided flow]")
        continue
      }

      const assistantMessageId = await appendMessage(conversationId, "assistant", reply)
      const sendResult = await sendWhatsAppText(message.from, reply)
      if (assistantMessageId) {
        await recordSendResult(assistantMessageId, sendResult)
      }
    }
  }
}

/** Persists Meta's delivery-status callbacks (sent/delivered/read/failed) for debugging. */
async function recordDeliveryStatuses(statuses: WhatsAppStatus[]) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const rows = statuses.map((s) => {
    const firstError = s.errors?.[0]
    return {
      wa_message_id: s.id,
      status: s.status,
      error_code: firstError?.code ?? null,
      error_title: firstError?.title ?? null,
      error_message: firstError?.message ?? firstError?.error_data?.details ?? null,
      raw: s,
    }
  })

  const { error } = await supabase.from("whatsapp_delivery_status").insert(rows)
  if (error) {
    console.error("[webhook] recordDeliveryStatuses failed:", error)
  }
}
