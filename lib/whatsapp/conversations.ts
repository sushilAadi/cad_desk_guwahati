import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface ConversationMessage {
  role: "user" | "assistant" | "tool"
  content: string
}

export interface ConversationRef {
  id: string
  /** True if this conversation row was just created by this call (first-ever message from this number). */
  isNew: boolean
}

/**
 * Finds or creates the conversation row for a WhatsApp phone number.
 * Returns null if Supabase isn't configured.
 */
export async function getOrCreateConversation(
  waPhone: string,
  waName: string | null
): Promise<ConversationRef | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data: existing, error: findError } = await supabase
    .from("whatsapp_conversations")
    .select("id")
    .eq("wa_phone", waPhone)
    .maybeSingle()

  if (findError) {
    console.error("[conversations] lookup failed:", findError)
    return null
  }

  if (existing) {
    // Keep the display name fresh and bump updated_at.
    await supabase
      .from("whatsapp_conversations")
      .update({ wa_name: waName ?? undefined, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    return { id: existing.id, isNew: false }
  }

  const { data: created, error: insertError } = await supabase
    .from("whatsapp_conversations")
    .insert({ wa_phone: waPhone, wa_name: waName })
    .select("id")
    .single()

  if (insertError || !created) {
    console.error("[conversations] insert failed:", insertError)
    return null
  }

  return { id: created.id, isNew: true }
}

/** Returns the last `limit` messages for a conversation, oldest first. */
export async function getRecentMessages(
  conversationId: string,
  limit = 12
): Promise<ConversationMessage[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error("[conversations] getRecentMessages failed:", error)
    return []
  }

  return data
    .slice()
    .reverse()
    .map((row) => ({ role: row.role as ConversationMessage["role"], content: row.content }))
}

export async function appendMessage(
  conversationId: string,
  role: ConversationMessage["role"],
  content: string,
  waMessageId?: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      wa_message_id: waMessageId ?? null,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[conversations] appendMessage failed:", error)
    return null
  }

  return data?.id ?? null
}

/** Records the outcome of a WhatsApp send attempt for a stored message (debugging aid). */
export async function recordSendResult(
  messageId: string,
  result: { ok: boolean; status?: number; error?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase
    .from("whatsapp_messages")
    .update({
      send_ok: result.ok,
      send_status: result.status ?? null,
      send_error: result.error ?? null,
    })
    .eq("id", messageId)

  if (error) {
    console.error("[conversations] recordSendResult failed:", error)
  }
}

export interface PendingAction {
  /** What the student is trying to do -- affects confirmation wording only. */
  mode: "enquire" | "register"
  courseId: string
  courseTitle: string
  /** Batch already picked via button; null means it's still being asked for as free text too. */
  batch: string | null
}

/** Reads the in-progress menu flow (if any) waiting on a free-text reply. */
export async function getPendingAction(conversationId: string): Promise<PendingAction | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("pending_action")
    .eq("id", conversationId)
    .maybeSingle()

  if (error || !data?.pending_action) return null
  return data.pending_action as PendingAction
}

export async function setPendingAction(conversationId: string, action: PendingAction): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase
    .from("whatsapp_conversations")
    .update({ pending_action: action })
    .eq("id", conversationId)

  if (error) console.error("[conversations] setPendingAction failed:", error)
}

export async function clearPendingAction(conversationId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase
    .from("whatsapp_conversations")
    .update({ pending_action: null })
    .eq("id", conversationId)

  if (error) console.error("[conversations] clearPendingAction failed:", error)
}

/** True if a message with this WhatsApp message id has already been stored. */
export async function isDuplicateMessage(waMessageId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return false

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("id")
    .eq("wa_message_id", waMessageId)
    .maybeSingle()

  if (error) {
    console.error("[conversations] isDuplicateMessage check failed:", error)
    return false
  }

  return !!data
}
