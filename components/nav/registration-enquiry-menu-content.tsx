"use client"

import Link from "next/link"
import { UserCheck, CheckCircle2, ArrowRight, ShieldCheck, PhoneCall, MessageCircle } from "lucide-react"
import { SITE_CONTACT_PHONE, SITE_CONTACT_PHONE_DISPLAY } from "@/lib/site"

// the WhatsApp line the chat assistant answers on
const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_DISPLAY = "+91 91272 81610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know about courses at CAD Desk Guwahati.")}`

/** One menu for registering and asking questions, because both are the same short form. */
export function RegistrationEnquiryMenuContent() {
  return (
    <div className="w-full p-6 text-ink bg-paper-card rounded-lg border border-line shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-base tracking-wide text-ink">Registration &amp; Enquiry</h3>
          </div>
          <p className="text-xs text-ink-2">
            Students and parents can fill in one short form to register for a course, or to ask about syllabus,
            batch timings and fees.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Link
            href="/enquiry"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-ink font-semibold text-xs transition-colors cursor-pointer rounded-lg flex items-center justify-center gap-2 border border-amber-600"
          >
            <span>Open the form</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-2 underline underline-offset-2 hover:text-ink text-center sm:text-right"
          >
            or chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink">
        <div className="p-3 bg-paper-raised border border-line rounded-lg space-y-1">
          <span className="text-amber-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Quick Enrollment
          </span>
          <p className="text-xs text-ink-2">
            Tell us your course and preferred batch. Our team confirms your seat directly.
          </p>
        </div>

        <div className="p-3 bg-paper-raised border border-line rounded-lg space-y-1">
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Certificate on Completion
          </span>
          <p className="text-xs text-ink-2">Every course includes a certificate once you finish.</p>
        </div>

        <div className="p-3 bg-paper-raised border border-line rounded-lg space-y-1">
          <span className="text-blue-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Hands-on Labs
          </span>
          <p className="text-xs text-ink-2">
            Practical, project-based training on the same software used in the industry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ink">
        <a href={`tel:${SITE_CONTACT_PHONE}`} className="p-3 bg-paper-raised hover:bg-paper-raised border border-line rounded-lg flex items-center gap-3 transition-colors">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <span className="text-ink font-bold block">Call us</span>
            <span className="text-amber-700 text-sm font-semibold">{SITE_CONTACT_PHONE_DISPLAY}</span>
          </div>
        </a>

        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="p-3 bg-paper-raised hover:bg-paper-raised border border-line rounded-lg flex items-center gap-3 transition-colors">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-ink font-bold block">WhatsApp</span>
            <span className="text-emerald-700 text-sm font-semibold">{WHATSAPP_DISPLAY}</span>
          </div>
        </a>
      </div>
    </div>
  )
}
