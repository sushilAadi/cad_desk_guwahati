import "server-only"

import { getSupabaseAdmin } from "@/lib/supabase/server"

export interface ConversationMessage {
  role: "user" | "assistant" | "tool"
  content: string
}

/**
 * Finds or creates the conversation row for a WhatsApp phone number.
 * Returns null if Supabase isn't configured.
 */
export async function getOrCreateConversation(
  waPhone: string,
  waName: string | null
): Promise<string | null> {
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
    return existing.id
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

  return created.id
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
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const { error } = await supabase.from("whatsapp_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    wa_message_id: waMessageId ?? null,
  })

  if (error) {
    console.error("[conversations] appendMessage failed:", error)
  }
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
