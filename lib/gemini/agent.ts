import "server-only"
import {
  createPartFromFunctionResponse,
  createUserContent,
  type Content,
} from "@google/genai"

import { getFeatureFlags } from "@/lib/config/flags"
import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini/client"
import { buildSystemInstruction } from "@/lib/gemini/system-prompt"
import { executeTool, toolDeclarations, type ToolContext } from "@/lib/gemini/tools"
import type { ConversationMessage } from "@/lib/whatsapp/conversations"

const MAX_TOOL_ROUNDS = 5
const FALLBACK_REPLY =
  "Sorry, I'm having trouble responding right now. Please try again in a moment, or ask to speak with our counseling team."

function toGeminiContents(history: ConversationMessage[]): Content[] {
  return history
    .filter((m) => m.role !== "tool")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))
}

/**
 * Runs one WhatsApp turn end to end: sends the conversation history + new
 * message to Gemini, executes any tool calls it makes (looping until it
 * settles on a plain-text reply), and returns that reply.
 *
 * Returns null when the turn was already fully handled by a tool that sends
 * its own WhatsApp message directly (currently just start_guided_flow) --
 * the caller should send nothing further in that case, not even the usual
 * "back to menu" hint, since the interactive list that was sent already
 * has its own navigation.
 */
export async function runAgentTurn(
  history: ConversationMessage[],
  userText: string,
  ctx: ToolContext
): Promise<string | null> {
  const ai = getGeminiClient()
  if (!ai) {
    console.error("[agent] GEMINI_API_KEY is not configured")
    return FALLBACK_REPLY
  }

  const flags = getFeatureFlags()
  const systemInstruction = buildSystemInstruction(flags)
  const contents: Content[] = [...toGeminiContents(history), createUserContent(userText)]
  let guidedFlowTriggered = false

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: toolDeclarations }],
        },
      })

      const functionCalls = response.functionCalls
      if (!functionCalls || functionCalls.length === 0) {
        if (guidedFlowTriggered) return null
        const text = response.text?.trim()
        return text && text.length > 0 ? text : FALLBACK_REPLY
      }

      if (functionCalls.some((call) => call.name === "start_guided_flow")) {
        guidedFlowTriggered = true
      }

      // Echo the model's function-call turn back into history, then run
      // every requested tool and append the results as the next turn.
      const modelContent = response.candidates?.[0]?.content
      if (modelContent) contents.push(modelContent)

      const responseParts = await Promise.all(
        functionCalls.map(async (call) => {
          const result = await executeTool(call.name ?? "", call.args ?? {}, ctx)
          return createPartFromFunctionResponse(call.id ?? call.name ?? "unknown", call.name ?? "unknown", result)
        })
      )
      contents.push(createUserContent(responseParts))
    }

    console.error("[agent] hit MAX_TOOL_ROUNDS without a final reply")
    return guidedFlowTriggered ? null : FALLBACK_REPLY
  } catch (err) {
    console.error("[agent] generateContent failed:", err)
    return FALLBACK_REPLY
  }
}
