export interface FeatureFlags {
  /** When false (default), the bot never offers/sends course images or brochures. */
  showImages: boolean
  /** When false (default), the bot never generates Razorpay payment links. */
  enablePayment: boolean
  /** When false, the "Registration" option is hidden everywhere in the WhatsApp bot (Enquiry still works). Defaults true. */
  enableRegistration: boolean
}

export function getFeatureFlags(): FeatureFlags {
  return {
    showImages: process.env.SHOW_IMAGES === "true",
    enablePayment: process.env.ENABLE_PAYMENT === "true",
    enableRegistration: process.env.ENABLE_REGISTRATION !== "false",
  }
}
