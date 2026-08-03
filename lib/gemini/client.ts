import "server-only"
import { GoogleGenAI } from "@google/genai"

let client: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  if (!client) {
    client = new GoogleGenAI({ apiKey })
  }

  return client
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"
