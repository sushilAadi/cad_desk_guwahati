import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Verifies Meta's `X-Hub-Signature-256` header against the raw request body,
 * using the WhatsApp app secret. Always verify against the *raw* body string
 * (before any JSON.parse), since re-serializing JSON can change byte-for-byte
 * formatting and break the signature check.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret || !signatureHeader) return false

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")
  const provided = signatureHeader.replace(/^sha256=/, "")

  const expectedBuf = Buffer.from(expected, "hex")
  const providedBuf = Buffer.from(provided, "hex")
  if (expectedBuf.length !== providedBuf.length) return false

  return timingSafeEqual(expectedBuf, providedBuf)
}
