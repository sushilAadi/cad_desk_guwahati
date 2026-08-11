"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  Building2,
  MessageCircle,
  Phone,
  MapPin,
} from "lucide-react"
import type { PublicCourse } from "@/lib/public-courses"
import { getCategoryDisplay } from "./category-config"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about courses at CAD Desk Guwahati."
)}`

interface CategoryGroup {
  category: string
  courses: PublicCourse[]
}

interface MobileNavDrawerProps {
  groups: CategoryGroup[]
  totalCount: number
}

function whatsappLinkFor(courseTitle: string) {
  const text = `Hi! I'd like to know more about the ${courseTitle} course at CAD Desk Guwahati.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

export function MobileNavDrawer({ groups, totalCount }: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const close = () => {
    setIsOpen(false)
    setOpenCategory(null)
  }

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="md:hidden flex h-9 w-9 items-center justify-center border-2 border-zinc-900 bg-white text-zinc-900"
      >
        <Menu className="h-5 w-5" />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-[60] bg-zinc-950/60 backdrop-blur-sm md:hidden"
            />

            {/* Sliding sidebar panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-[70] flex h-full w-[85vw] max-w-sm flex-col bg-white text-zinc-900 border-l-2 border-zinc-900 shadow-2xl md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-zinc-900 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 text-zinc-950">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-black tracking-wider uppercase">CAD DESK</span>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center border border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Courses accordion */}
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-500">
                      COURSES ({totalCount})
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-1.5">
                    {groups.map((g) => {
                      const isOpenCat = openCategory === g.category
                      const display = getCategoryDisplay(g.category)
                      return (
                        <div key={g.category} className="border border-zinc-200">
                          <button
                            type="button"
                            onClick={() => setOpenCategory(isOpenCat ? null : g.category)}
                            className={`w-full flex items-center justify-between gap-2 p-2.5 text-left transition-colors ${
                              isOpenCat ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-900"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 shrink-0 overflow-hidden border border-zinc-300">
                                <img
                                  src={display.image}
                                  alt={g.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-extrabold text-xs truncate">{g.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                                  isOpenCat
                                    ? "bg-amber-400 text-zinc-950 border-amber-300"
                                    : "bg-zinc-200 text-zinc-800 border-zinc-300"
                                }`}
                              >
                                {g.courses.length}
                              </span>
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${isOpenCat ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpenCat && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                                className="overflow-hidden bg-white"
                              >
                                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100">
                                  {g.courses.map((course) => (
                                    <a
                                      key={course.id}
                                      href={whatsappLinkFor(course.title)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={close}
                                      className="flex items-center justify-between gap-2 p-2.5 text-xs hover:bg-amber-50"
                                    >
                                      <span className="font-bold text-zinc-800 truncate">{course.title}</span>
                                      <span className="shrink-0 font-mono text-[10px] text-amber-700">Enquire →</span>
                                    </a>
                                  ))}
                                  {g.courses.length === 0 && (
                                    <p className="p-2.5 text-[11px] text-zinc-500">
                                      Message us on WhatsApp for this category.
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Enquiry */}
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3.5 hover:bg-zinc-50"
                >
                  <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-zinc-900">Enquiry Desk</span>
                    <span className="block text-[11px] text-zinc-500">Ask about syllabus, batches, fees</span>
                  </div>
                </a>

                {/* Contact */}
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3.5 hover:bg-zinc-50"
                >
                  <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-zinc-900">Contact Us</span>
                    <span className="block text-[11px] text-zinc-500">Noonmati, Guwahati</span>
                  </div>
                </a>

                <div className="px-4 py-3.5 space-y-2 text-[11px] text-zinc-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>Near Axom Jatiya Vidyalaya, Noonmati, Guwahati, Assam 781020</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>+91 91272 81610</span>
                  </div>
                </div>
              </div>

              {/* Sticky bottom CTA */}
              <div className="border-t-2 border-zinc-900 p-4">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 bg-zinc-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
