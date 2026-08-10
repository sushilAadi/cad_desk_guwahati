"use client"

import { HelpCircle, PhoneCall, ArrowRight, MessageSquare } from "lucide-react"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I have a question about courses at CAD Desk Guwahati."
)}`

export function EnquiryMenuContent() {
  return (
    <div className="w-full p-6 text-zinc-900 bg-white rounded-none border-2 border-zinc-900 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-black text-base tracking-wide text-zinc-900">Course Enquiry & Counseling</h3>
          </div>
          <p className="text-xs text-zinc-600">
            Have questions about syllabus, batch timings, or fees? Send a quick enquiry for guidance from our
            team.
          </p>
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider transition-colors cursor-pointer rounded-none flex items-center gap-2 shrink-0 border border-blue-700"
        >
          <span>Send Quick Enquiry</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-zinc-800">
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none flex items-center gap-3">
          <div className="p-2 rounded-none bg-blue-100 text-blue-700">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <span className="text-zinc-900 font-bold block">Call / WhatsApp</span>
            <span className="text-amber-700 text-sm font-black">+91 91272 81610</span>
          </div>
        </div>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none flex items-center gap-3">
          <div className="p-2 rounded-none bg-emerald-100 text-emerald-700">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-zinc-900 font-bold block">Response Time</span>
            <span className="text-emerald-700 text-sm font-black">Usually within minutes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
