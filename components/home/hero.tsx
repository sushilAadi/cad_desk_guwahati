"use client"

import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

const WHATSAPP_NUMBER = "919127281610"
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi! I'd like to know more about courses at CAD Desk Guwahati."
)}`

interface HeroProps {
  totalCount: number
}

export function Hero({ totalCount }: HeroProps) {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden">
      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-blue-400/10 blur-[110px]" />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-5 md:py-24">
        {/* Left: copy */}
        <motion.div
          className="md:col-span-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-blue-200/80">
            <span>Admissions Open</span>
            <span className="text-blue-400">•</span>
            <span>Noonmati, Guwahati</span>
            <span className="text-blue-400">•</span>
            <span>{totalCount}+ Courses</span>
          </div>

          <p className="mt-8 text-sm font-medium text-blue-200/80">
            Hi, we&apos;re CAD Desk Guwahati and we train you for
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            In-Demand CAD, CAM{" "}
            <span className="text-amber-400">&amp; IT Skills</span>
          </h1>

          <p className="mt-6 max-w-sm text-sm leading-relaxed text-blue-100/80">
            Hands-on, project-based training across Civil, Mechanical,
            Electrical, CS/IT &amp; Creative Arts — certified at our Noonmati
            centre.
          </p>

          <div className="mt-8">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-zinc-950 transition-colors hover:bg-amber-300"
            >
              <ArrowUpRight className="h-4 w-4" />
              Enquire on WhatsApp
            </a>
          </div>
        </motion.div>

        {/* Right: image — full poster, no cropping */}
        <motion.div
          className="md:col-span-3"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <div className="relative mx-auto w-full max-w-md md:max-w-lg">
            <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl shadow-black/30 ring-1 ring-white/10">
              <img
                src="/images/hero/categories-collage.png"
                alt="CAD Desk Guwahati training tracks — Civil/Architecture, CS/IT, Mechanical, Creative Arts and Electrical"
                className="w-full rounded-[1.5rem] object-contain"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
