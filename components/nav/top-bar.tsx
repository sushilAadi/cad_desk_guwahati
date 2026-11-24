import { MapPin, Mail, Phone, Star } from "lucide-react"
import {
  SITE_ADDRESS_SHORT,
  SITE_CONTACT_PHONE,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_EMAIL,
  SITE_MAPS_URL,
  SITE_RATING,
} from "@/lib/site"

const LINK = "items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white"

/** Slim bar above the header: call, email, where we are, and the Google rating. It scrolls away; the header below stays pinned. */
export function TopBar() {
  return (
    <div className="w-full bg-night text-sm font-medium text-white/80 md:text-[15px]">
      <div className="mx-auto flex min-h-11 w-full max-w-[1640px] items-center justify-between gap-x-6 gap-y-1 px-5 md:px-[60px] lg:px-[100px]">
        <div className="flex items-center gap-x-5">
          <a href={`tel:${SITE_CONTACT_PHONE}`} className={`${LINK} inline-flex font-medium text-white`} aria-label={`Call ${SITE_CONTACT_PHONE_DISPLAY}`}>
            <Phone className="h-4 w-4" strokeWidth={1.75} />
            {SITE_CONTACT_PHONE_DISPLAY}
          </a>
          <a href={`mailto:${SITE_EMAIL}`} className={`${LINK} hidden md:inline-flex`}>
            <Mail className="h-4 w-4" strokeWidth={1.75} />
            {SITE_EMAIL}
          </a>
        </div>
        <div className="flex items-center gap-x-5">
          <a href={SITE_MAPS_URL} target="_blank" rel="noopener noreferrer" className={`${LINK} hidden xl:inline-flex`}>
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
            {SITE_ADDRESS_SHORT}
          </a>
          <a href={SITE_MAPS_URL} target="_blank" rel="noopener noreferrer" className={`${LINK} inline-flex`} aria-label={`Rated ${SITE_RATING.score} out of 5 on Google`}>
            <Star className="h-4 w-4 fill-[#ffb400] text-[#ffb400]" strokeWidth={1.5} />
            <span className="font-medium text-white">{SITE_RATING.score}</span>
            <span className="hidden sm:inline">on Google</span>
          </a>
        </div>
      </div>
    </div>
  )
}
