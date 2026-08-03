export interface FeatureFlags {
  /** When false (default), the bot never offers/sends course images or brochures. */
  showImages: boolean
  /** When false (default), the bot never generates Razorpay payment links. */
  enablePayment: boolean
}

export function getFeatureFlags(): FeatureFlags {
  return {
    showImages: process.env.SHOW_IMAGES === "true",
    enablePayment: process.env.ENABLE_PAYMENT === "true",
  }
}
