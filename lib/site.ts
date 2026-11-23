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

// One schema.org entity for the centre, shared by every page's JSON-LD. Uses the phone shown in the top bar so NAP matches.
export const ORG_LD = {
  "@type": ["EducationalOrganization", "LocalBusiness"],
  "@id": `${SITE_URL}/#org`,
  name: SITE_NAME,
  alternateName: "NEEED ASSOCIATES",
  url: SITE_URL,
  telephone: SITE_CONTACT_PHONE,
  email: SITE_EMAIL,
  hasMap: SITE_MAPS_URL,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Noonmati Last Gate, opp. Assam Jatiya Bidyalaya",
    addressLocality: "Guwahati",
    addressRegion: "Assam",
    postalCode: "781020",
    addressCountry: "IN",
  },
  // Guwahati first (the centre), India for live-online students from other states.
  areaServed: [{ "@type": "City", name: "Guwahati" }, { "@type": "State", name: "Assam" }, { "@type": "Country", name: "India" }],
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "19:00",
  }],
  sameAs: ["https://www.instagram.com/caddeskguwahati9/", "https://www.facebook.com/caddeskguwahati9/", "https://maps.app.goo.gl/fVtvCZQJUo1R5P5t7"],
}

export const SITE_HOURS = "Monday to Saturday, 9am to 7pm"

// Homepage FAQ, also emitted as FAQPage JSON-LD. Answers use only facts stated elsewhere on the site; no prices by choice.
export const FAQ = [
  {
    q: "Where is the best place to learn AutoCAD in Guwahati?",
    a: `CAD Desk Guwahati at Noonmati Last Gate, opposite Assam Jatiya Bidyalaya, teaches AutoCAD alongside 66+ other CAD/CAM and IT courses. Classes are hands-on, at the centre or live online, and the centre is open ${SITE_HOURS}.`,
  },
  {
    q: "What courses does CAD Desk Guwahati offer?",
    a: "CAD Desk Guwahati offers 66+ courses in five tracks: Civil and Architecture, Mechanical, Electrical, Computer Science and IT, and Creative Arts. Popular choices include AutoCAD, Revit, SOLIDWORKS and 3ds Max. Each course page lists the full syllabus, the topics covered and the level it starts from.",
  },
  {
    q: "Can I join CAD Desk Guwahati classes online?",
    a: "Yes. Every course can be taken in the classroom at the Noonmati centre or live online in the same batch, following the same syllabus. You choose classroom or online when you enquire, and the team at the centre will help you pick the batch that fits your schedule.",
  },
  {
    q: "Do I get a certificate after the course?",
    a: "Courses marked with certification end with a CAD Desk certificate that you can show employers. CAD Desk is a national training network with centres across India. Each course page on this website shows whether a certificate is included.",
  },
  {
    q: "What are the fees and how do I enrol?",
    a: `Fees depend on the course and batch, so the centre shares them directly. Fill in the enquiry form on this website, call ${SITE_CONTACT_PHONE_DISPLAY}, or visit the Noonmati centre ${SITE_HOURS}. The team will explain fees, batch timings and the next start date.`,
  },
]
