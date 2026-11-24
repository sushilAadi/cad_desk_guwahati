"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  UserCheck,
  Building2,
  MessageCircle,
} from "lucide-react"
import type { PublicCourse } from "@/lib/public-courses"
import { getCategoryDisplay } from "./category-config"
import { RegistrationEnquiryMenuContent } from "./registration-enquiry-menu-content"
import { ContactMenuContent } from "./contact-menu-content"
import { webp } from "@/lib/webp"

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
  const [openSection, setOpenSection] = useState<"register" | "contact" | null>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const close = () => {
    setIsOpen(false)
    setOpenCategory(null)
    setOpenSection(null)
  }

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="md:hidden flex h-9 w-9 items-center justify-center border border-line bg-paper-card text-ink hover:bg-paper-raised"
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
              className="fixed inset-y-0 right-0 z-[70] flex h-full w-[85vw] max-w-sm flex-col bg-paper-card text-ink border-l border-line shadow-2xl md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 text-ink">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">CAD DESK</span>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center border border-line text-ink-2 hover:bg-paper-raised"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Courses accordion */}
                <div className="border-b border-line px-4 py-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-ink-3">
                      COURSES ({totalCount})
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-1.5">
                    {groups.map((g) => {
                      const isOpenCat = openCategory === g.category
                      const display = getCategoryDisplay(g.category)
                      return (
                        <div key={g.category} className="border border-line">
                          <button
                            type="button"
                            onClick={() => setOpenCategory(isOpenCat ? null : g.category)}
                            className={`w-full flex items-center justify-between gap-2 p-2.5 text-left transition-colors ${
                              isOpenCat ? "bg-ink text-paper" : "bg-paper-raised text-ink"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-8 w-8 shrink-0 overflow-hidden border border-line">
                                <img
                                  src={webp(display.image)}
                                  alt={g.category}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-extrabold text-xs truncate">{g.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-xs font-bold px-1.5 py-0.5 border ${
                                  isOpenCat
                                    ? "bg-amber-400 text-ink border-amber-300"
                                    : "bg-paper-raised text-ink border-line"
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
                                className="overflow-hidden bg-paper-card"
                              >
                                <div className="max-h-64 overflow-y-auto divide-y divide-line">
                                  {g.courses.map((course) => (
                                    <a
                                      key={course.id}
                                      href={whatsappLinkFor(course.title)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={close}
                                      className="flex items-center justify-between gap-2 p-2.5 text-xs hover:bg-amber-50"
                                    >
                                      <span className="font-bold text-ink truncate">{course.title}</span>
                                      <span className="shrink-0 text-xs text-amber-700">Enquire →</span>
                                    </a>
                                  ))}
                                  {g.courses.length === 0 && (
                                    <p className="p-2.5 text-xs text-ink-3">
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

                {/* Registration / Enquiry — same content as desktop */}
                <div className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "register" ? null : "register")}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-paper-raised"
                  >
                    <UserCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block text-xs font-extrabold text-ink">Registration / Enquiry</span>
                      <span className="block text-xs text-ink-3">One form to register or ask a question</span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-ink-3 shrink-0 transition-transform ${
                        openSection === "register" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openSection === "register" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3">
                          <RegistrationEnquiryMenuContent />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contact — same content as desktop */}
                <div className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "contact" ? null : "contact")}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-paper-raised"
                  >
                    <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1 text-left">
                      <span className="block text-xs font-extrabold text-ink">Contact Us</span>
                      <span className="block text-xs text-ink-3">Noonmati, Guwahati</span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-ink-3 shrink-0 transition-transform ${
                        openSection === "contact" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openSection === "contact" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3">
                          <ContactMenuContent />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sticky bottom CTA */}
              <div className="border-t border-line p-4">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex w-full items-center justify-center gap-2 bg-zinc-900 px-4 py-3 text-xs font-semibold text-white"
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
