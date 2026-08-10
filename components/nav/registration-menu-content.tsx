"use client"

import { UserCheck, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to register for a course at CAD Desk Guwahati."
)}`

export function RegistrationMenuContent() {
  return (
    <div className="w-full p-6 text-zinc-900 bg-white rounded-none border-2 border-zinc-900 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-600" />
            <h3 className="font-black text-base tracking-wide text-zinc-900">Course Registration</h3>
          </div>
          <p className="text-xs text-zinc-600">
            Enroll directly into any of our CAD/CAM and IT courses at our Noonmati centre — hands-on,
            project-based training.
          </p>
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center gap-2 shrink-0 border border-amber-600"
        >
          <span>Register on WhatsApp</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-zinc-800">
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none space-y-1">
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Quick Enrollment
          </span>
          <p className="text-[11px] text-zinc-600">
            Message us your course and preferred batch — our team confirms your seat directly.
          </p>
        </div>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none space-y-1">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Certificate on Completion
          </span>
          <p className="text-[11px] text-zinc-600">Every course includes a certificate once you finish.</p>
        </div>

        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none space-y-1">
          <span className="text-blue-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Hands-on Labs
          </span>
          <p className="text-[11px] text-zinc-600">
            Practical, project-based training on the same software used in the industry.
          </p>
        </div>
      </div>
    </div>
  )
}
