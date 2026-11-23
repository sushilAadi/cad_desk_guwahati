export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "")

export const SITE_NAME = "CAD Desk Guwahati"
export const SITE_PHONE = "+919127281610"

// Top bar details. Phone, email, address and Maps link are from the centre page on caddeskindia.com (checked 2026-11-23).
// The rating is a snapshot of the Google listing shown there; update it when it changes.
export const SITE_CONTACT_PHONE = "+918638270013"
export const SITE_CONTACT_PHONE_DISPLAY = "+91 86382 70013"
export const SITE_EMAIL = "guwahati@caddeskindia.com"
export const SITE_ADDRESS_SHORT = "Noonmati Last Gate, opp. Assam Jatiya Bidyalaya, Guwahati 781020"
export const SITE_MAPS_URL = "https://maps.google.com/?cid=10340600818948127133"
export const SITE_RATING = { score: "4.9", reviews: 121 }

// National figures published by CAD Desk India (the franchisor) at caddeskindia.com. They describe the whole network,
// NOT this centre, and are always shown labelled that way. Re-check them before changing; the franchisor's own pages
// disagree on cities (170+ on the Guwahati centre page, 150+ on the home page).
export const CAD_DESK_NETWORK = {
  source: "caddeskindia.com",
  checked: "23 Nov 2026",
  stats: [
    { n: "170+", label: "Cities" },
    { n: "22", label: "States" },
    { n: "2 lakh+", label: "Students trained" },
  ],
}
