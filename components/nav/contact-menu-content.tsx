"use client"

import { MapPin, Phone, MessageCircle, Building2, ArrowRight } from "lucide-react"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about CAD Desk Guwahati."
)}`

export function ContactMenuContent() {
  return (
    <div className="w-full p-6 text-ink bg-paper-card rounded-lg border border-line shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-base tracking-wide text-ink">Contact & Centre</h3>
          </div>
          <p className="text-xs text-ink-2">
            Visit our Noonmati centre in Guwahati, or reach us directly on WhatsApp.
          </p>
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer rounded-lg flex items-center gap-2 shrink-0 border border-emerald-700"
        >
          <span>Chat on WhatsApp</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink">
        <div className="p-3 bg-paper-raised border border-line rounded-lg space-y-1">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Noonmati Centre
          </span>
          <p className="text-xs text-ink-2">
            Near Axom Jatiya Vidyalaya, Noonmati, Kamrup Metro, Guwahati, Assam 781020
          </p>
        </div>

        <div className="p-3 bg-paper-raised border border-line rounded-lg space-y-1">
          <span className="text-blue-700 font-bold flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> Phone
          </span>
          <p className="text-xs text-ink-2">+91 91272 81610</p>
        </div>

        <div className="p-3 bg-paper-raised border border-line rounded-lg space-y-1">
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </span>
          <p className="text-xs text-ink-2">Message us anytime — usually replies within minutes.</p>
        </div>
      </div>
    </div>
  )
}
