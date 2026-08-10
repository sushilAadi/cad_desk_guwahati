"use client"

import { MapPin, Phone, MessageCircle, Building2, ArrowRight } from "lucide-react"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about CAD Desk Guwahati."
)}`

export function ContactMenuContent() {
  return (
    <div className="w-full p-6 text-zinc-900 bg-white rounded-none border-2 border-zinc-900 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-black text-base tracking-wide text-zinc-900">Contact & Centre</h3>
          </div>
          <p className="text-xs text-zinc-600">
            Visit our Noonmati centre in Guwahati, or reach us directly on WhatsApp.
          </p>
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider transition-colors cursor-pointer rounded-none flex items-center gap-2 shrink-0 border border-emerald-700"
        >
          <span>Chat on WhatsApp</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-zinc-800">
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none space-y-1">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Noonmati Centre
          </span>
          <p className="text-[11px] text-zinc-600">
            Near Axom Jatiya Vidyalaya, Noonmati, Kamrup Metro, Guwahati, Assam 781020
          </p>
        </div>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none space-y-1">
          <span className="text-blue-700 font-bold flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> Phone
          </span>
          <p className="text-[11px] text-zinc-600">+91 91272 81610</p>
        </div>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none space-y-1">
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </span>
          <p className="text-[11px] text-zinc-600">Message us anytime — usually replies within minutes.</p>
        </div>
      </div>
    </div>
  )
}
