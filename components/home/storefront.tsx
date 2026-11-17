"use client"

import { useEffect, useRef, useState } from "react"
import { FrameLines } from "@/components/home/frame-lines"
import { MaskedMosaic, type MosaicTile } from "@/components/home/masked-mosaic"
import { Book } from "@/components/ui/book"
import { useResponsive } from "@/components/ui/use-responsive"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, ChevronDown, MessageCircle, Plus, Search, X } from "lucide-react"
import { COVER_COLORS, CoverBook, sharedImages } from "@/components/home/course-cover"
import type { PublicCourse } from "@/lib/public-courses"

type Groups = { category: string; courses: PublicCourse[] }[]

// Direction: a drafting office. White sheet, black ink, one red pencil. The course posters are the
// only rich colour on the page; tracks are told apart by a drawing-style code, never by colour.
const TRACK_CODE: Record<string, string> = {
  "Civil / Architecture": "CV",
  "CS/IT": "IT",
  Mechanical: "ME",
  "Creative Arts": "CA",
  Electrical: "EL",
}
const code = (category: string) => TRACK_CODE[category] ?? category.slice(0, 2).toUpperCase()

// Each reason is taken from what the course descriptions themselves promise.
const WHY = [
  { title: "Projects during the course", text: "You work on real projects as you learn, and internships are encouraged alongside the classes." },
  { title: "A certificate at the end", text: "Every course finishes with a CAD Desk certificate you can show an employer." },
  { title: "Classroom or live online", text: "Attend at the Noonmati centre or join the same class online." },
]
const STEPS = [
  { title: "Pick a course", text: "Browse by track or search, and add the ones you like to your list" },
  { title: "Talk to us", text: "Send your list on WhatsApp and we confirm batches, timing and fees" },
  { title: "Start learning", text: "Join in Noonmati or live online" },
]

const WHATSAPP = "https://wa.me/919127281610?text="
const waLink = (titles: string[]) =>
  WHATSAPP +
  encodeURIComponent(
    titles.length === 1
      ? `Hi! I'd like to know more about the ${titles[0]} course at CAD Desk Guwahati.`
      : titles.length
        ? `Hi! I'd like to know more about these courses at CAD Desk Guwahati: ${titles.join(", ")}.`
        : "Hi! I'd like to know more about courses at CAD Desk Guwahati."
  )
const days = (c: PublicCourse) => (c.duration ? `${c.duration} days` : "Flexible")

const TRACK_IMG: Record<string, string> = {
  "Civil / Architecture": "/images/categories/civil.jpg",
  "CS/IT": "/images/categories/cs-it.jpg",
  Mechanical: "/images/categories/mechanical.jpg",
  "Creative Arts": "/images/categories/creative-arts.jpg",
  Electrical: "/images/categories/electrical.jpg",
}
const DISPLAY = "font-[family-name:var(--font-display)] uppercase tracking-[-0.01em]"
const BAND_A = ["Civil / Architecture", "Mechanical", "Electrical", "CS/IT", "Creative Arts"]
const BAND_B = ["Hands-on projects", "Certificate", "Classroom", "Live online", "Noonmati, Guwahati"]
// page margin 20 / 60 / 100; every direct child of a section is a centred 1440px column, so left and right edges always match
const GUTTER = "relative px-5 md:px-[60px] lg:px-[100px] [&>*]:mx-auto [&>*]:max-w-[1440px]"
const PRIMARY = "inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-[#b42318]"
const SECONDARY = "inline-flex h-12 items-center gap-2 rounded-lg border border-line px-5 text-sm font-medium text-ink transition-colors hover:bg-paper-raised"

const GAP = 24 // gap between books in the course grid

/** A course as a book: poster (or generated cover) on the front, title and length underneath. */
function BookCard({ course, img, w, added, onOpen, onToggle }: { course: PublicCourse; img?: string; w: number; added: boolean; onOpen: () => void; onToggle: () => void }) {
  return (
    <div className="shrink-0" style={{ width: w }}>
      <button onClick={onOpen} aria-label={`View ${course.title}`} className="book-card block rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <CoverBook course={course} img={img ?? null} width={w} />
      </button>
      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{course.title}</p>
          <p className="mt-1 truncate font-mono text-xs text-ink-3">{code(course.category)} · {days(course)}</p>
        </div>
        <button
          onClick={onToggle}
          aria-pressed={added}
          aria-label={added ? `Remove ${course.title} from your list` : `Add ${course.title} to your list`}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors ${added ? "border-ink bg-ink text-white" : "border-line text-ink hover:bg-paper-raised"}`}
       >
          {added ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  )
}

/** Small monospace caption above a block, like the class-name notes on tailwindcss.com. */
function Note({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p data-rule className={`mb-4 font-mono text-[11px] tracking-wide ${dark ? "text-white/40" : "text-ink-3/70"}`}>{children}</p>
}

/** Vertical label sitting in the hatched strip to the left of the column (large screens only). */
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-12 left-[calc(50%-min(720px,50vw-100px)-23px)] z-20 hidden rotate-180 font-mono text-[10px] uppercase tracking-[0.22em] text-brand [writing-mode:vertical-rl] lg:block"
    >
      {children}
    </span>
  )
}

/** Colour of each "what you get" row when it is open, and how its text and button read on that colour. */
const WHY_STYLE = [
  { bg: "#ff8a35", fg: "text-white", btn: "bg-white text-ink" },
  { bg: "#e6fa55", fg: "text-ink", btn: "bg-ink text-white" },
  { bg: "#ff4a3f", fg: "text-white", btn: "bg-white text-ink" },
]

const PILL: Record<string, string> = {
  lime: "bg-[#e6fa55] text-ink",
  orange: "bg-[#ff8a35] text-white",
  red: "bg-[#ff4a3f] text-white",
  violet: "bg-[#9b7bf7] text-white",
  green: "bg-[#06b57b] text-white",
  ink: "bg-ink text-white",
  sky: "bg-[#bcd8f2] text-ink",
}

function Pill({ c, children }: { c: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${PILL[c]}`}>{children}</span>
}

function MiniCard({ title, sub, className = "", children }: { title: string; sub: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`min-h-[330px] w-[230px] shrink-0 md:w-[min(300px,30%)] rounded-t-[28px] bg-white p-6 text-center text-ink ${className}`}>
      <p className="text-lg font-medium leading-tight">{title}</p>
      <p className="mt-1 text-xs text-ink-3">{sub}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  )
}

/** Three white cards that peek up from the bottom of an open row. Everything here is something CAD Desk actually offers. */
function MiniCards({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        <MiniCard title="Software" sub="The tools professionals use">
          <Pill c="lime">AutoCAD</Pill>
          <Pill c="ink">Revit</Pill>
          <Pill c="orange">SolidWorks</Pill>
          <Pill c="violet">Photoshop</Pill>
        </MiniCard>
        <MiniCard title="Real projects" sub="Worked on as you learn" className="mt-10">
          <Pill c="sky">Drawings</Pill>
          <Pill c="green">Models</Pill>
          <Pill c="red">Hands-on</Pill>
        </MiniCard>
        <MiniCard title="Internships" sub="Encouraged alongside classes">
          <Pill c="ink">Industry exposure</Pill>
          <Pill c="lime">Practice</Pill>
        </MiniCard>
      </>
    )
  if (i === 1)
    return (
      <>
        <MiniCard title="Every course" sub="Ends with one">
          <span className={`${DISPLAY} block w-full text-4xl leading-none`}>Certificate</span>
          <span className="mt-2 grid h-14 w-14 place-items-center rounded-full bg-brand font-mono text-[9px] text-white">CAD DESK</span>
        </MiniCard>
        <MiniCard title="From CAD Desk" sub="Issued by the institute" className="mt-10">
          <Pill c="lime">CAD Desk</Pill>
          <Pill c="violet">Per course</Pill>
        </MiniCard>
        <MiniCard title="Show an employer" sub="Proof of what you learned">
          <Pill c="green">Skills</Pill>
          <Pill c="sky">Projects</Pill>
        </MiniCard>
      </>
    )
  return (
    <>
      <MiniCard title="Classroom" sub="Noonmati centre, Guwahati">
        <Pill c="ink">In person</Pill>
        <Pill c="lime">Hands-on</Pill>
      </MiniCard>
      <MiniCard title="Live online" sub="Join the same class" className="mt-10">
        <Pill c="violet">From home</Pill>
        <Pill c="sky">Live</Pill>
      </MiniCard>
      <MiniCard title="Your choice" sub="Pick what suits you">
        <Pill c="orange">Offline</Pill>
        <Pill c="green">Online</Pill>
      </MiniCard>
    </>
  )
}

const HERO_IMAGE = "/images/hero/institute.webp" // drop a wide photo of the institute here
const HERO_FALLBACK = "/images/hero/categories-collage.png"

// 8 x 3 grid, 24 boxes numbered across (1 to 24). The first and last columns are half width and the top and
// bottom rows are half height, so the four corners are quarter size and the middle boxes are square.
// Boxes 11, 15 and 21 carry text; every other box is a slice of the one big image.
const HERO_TEXT: Record<number, { cls: string; node: React.ReactNode }> = {
  11: {
    cls: "bg-paper-raised",
    node: (
      <a href="#courses" className="group flex h-full flex-col justify-between p-3 sm:p-4">
        <span>
          <span className="block text-[clamp(13px,1.3vw,19px)] font-medium leading-tight text-ink">Hands-on training</span>
          <span className="mt-1 block text-[clamp(10px,0.85vw,13px)] leading-snug text-ink-2">Real projects as you learn, with internships encouraged.</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-ink">
          Browse courses <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
        </span>
      </a>
    ),
  },
  15: {
    cls: "bg-ink text-white",
    node: (
      <div className="flex h-full flex-col justify-between p-3 sm:p-4">
        <span className={`${DISPLAY} text-[clamp(16px,1.7vw,26px)] leading-[1.02]`}>Classroom<br />or live online</span>
        <span className="font-mono text-[10px] text-white/60">Noonmati, Guwahati</span>
      </div>
    ),
  },
  21: {
    cls: "bg-[#2f3bff] text-white",
    node: (
      <div className="flex h-full flex-col justify-between p-3 sm:p-4">
        <span className={`${DISPLAY} text-[clamp(16px,1.7vw,26px)] leading-[1.02]`}>Certificate with<br />every course</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#2f3bff]">
          <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </div>
    ),
  },
}
const HERO_FULL: MosaicTile[] = Array.from({ length: 24 }, (_, k): MosaicTile => {
  const n = k + 1
  const col = String((k % 8) + 1)
  const row = String(Math.floor(k / 8) + 1)
  const t = HERO_TEXT[n]
  // Rounded everywhere except the outer edge: the top row's top corners and the bottom row's bottom corners
  // are square, apart from the four corners of the whole mosaic, which keep their outer corner rounded.
  // The two top corner boxes are also square on their inner bottom corner (box 1 bottom-left, box 8 bottom-right),
  // and the middle row first and last boxes (9 and 16) are square on their outer side.
  const first = k % 8 === 0
  const last = k % 8 === 7
  const top = row === "1"
  const bottom = row === "3"
  const mid = row === "2"
  const rounded = [
    (top && !first) || (mid && first) || (bottom && first) ? "rounded-tl-none" : "rounded-tl-2xl",
    (top && !last) || (mid && last) || (bottom && last) ? "rounded-tr-none" : "rounded-tr-2xl",
    (bottom && !first) || (top && first) || (mid && first) ? "rounded-bl-none" : "rounded-bl-2xl",
    (bottom && !last) || (top && last) || (mid && last) ? "rounded-br-none" : "rounded-br-2xl",
  ].join(" ")
  return t ? { kind: "node", col, row, className: t.cls, rounded, node: t.node } : { kind: "slice", col, row, rounded }
})

// small screens: a simpler 4 x 2 cut of the same image
const HERO_COMPACT: MosaicTile[] = [
  { kind: "slice", col: "1 / span 2", row: "1 / span 2" },
  { kind: "slice", col: "3", row: "1" },
  { kind: "slice", col: "4", row: "1" },
  { kind: "slice", col: "3 / span 2", row: "2" },
]

/**
 * Sticky section title. The section's big heading scrolls up as normal; as it passes under the navbar this
 * title rises into place and stays pinned (it is sticky inside the section) until the section ends. It is
 * 60% of the big heading's size, and its position, scale and opacity follow the scroll, so the motion is
 * continuous rather than a switch.
 *
 * `size` is 60% of the section heading's font-size clamp.
 */
function StickyBar({ target, title, index, total, dark = false, size = "clamp(26px, 3.6vw, 53px)" }: { target: string; title: string; index: number; total: number; dark?: boolean; size?: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = document.getElementById(target)
    const b = bar.current
    if (!el || !b) return
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // 0 while the heading is still on screen, 1 once it has fully passed under the navbar
        const p = Math.min(Math.max((100 - el.getBoundingClientRect().bottom) / 90, 0), 1)
        b.style.opacity = String(p)
        b.style.transform = `translateY(${(1 - p) * 28}px) scale(${0.94 + 0.06 * p})`
        b.style.pointerEvents = p > 0.6 ? "auto" : "none"
        b.setAttribute("aria-hidden", p > 0.6 ? "false" : "true")
      })
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [target])
  return (
    <div
      ref={bar}
      aria-hidden
      style={{ ["--bh" as string]: `calc(${size} + 22px)`, opacity: 0, transformOrigin: "left center" }}
      className={`sticky top-16 z-30 -mb-[var(--bh)] flex h-[var(--bh)] items-center justify-between gap-4 border-b will-change-transform ${
        dark ? "border-white/15 bg-ink text-white" : "border-line bg-white text-ink"
      }`}
    >
      <span className={`${DISPLAY} leading-none`} style={{ fontSize: size }}>
        {title}
        <span className="text-brand">.</span>
      </span>
      <span className={`font-mono text-[11px] ${dark ? "text-white/50" : "text-ink-3"}`}>
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  )
}

export function Storefront({ groups }: { groups: Groups }) {
  const all = groups.flatMap((g) => g.courses)
  const shared = sharedImages(all)
  // ponytail: only our own uploads (".../course-images/...") are portrait posters; the older hotlinked
  // thumbnails are small landscape logos that a 2:3 cover would letterbox, so those courses get a
  // drawing-sheet cover instead. Switch to real image dimensions if the image sources ever change.
  const posterOf = (c: PublicCourse) =>
    c.image && !shared.has(c.image) && c.image.includes("/course-images/") ? c.image : undefined

  const [active, setActive] = useState(groups[0]?.category ?? "all")
  const [query, setQuery] = useState("")
  // ponytail: the list lives in memory only and resets on reload. Persist to localStorage if people ask.
  const [list, setList] = useState<string[]>([])
  const [listOpen, setListOpen] = useState(false)
  const [view, setView] = useState<PublicCourse | null>(null)
  // The course grid is exactly 6 books per row on desktop (4 / 3 / 2 as it narrows); each book is sized to fill its column.
  const gridRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ cols: 6, w: 150 })
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const fit = () => {
      const W = el.clientWidth
      const cols = W >= 780 ? 6 : W >= 560 ? 4 : W >= 400 ? 3 : 2
      setGrid({ cols, w: Math.floor((W - GAP * (cols - 1)) / cols) })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    window.addEventListener("resize", fit)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", fit)
    }
  }, [])
  const bw = useResponsive({ sm: 120, lg: 96, xl: 128, "2xl": 175 }) // each book + its count must fit its own column
  const [seed, setSeed] = useState(1) // bumps on every tab change so the books reveal in a new random order
  const [why, setWhy] = useState(0)
  const [dot, setDot] = useState<{ c: PublicCourse; i: number; x: number; y: number; b: number; w: number } | null>(null)

  const toggle = (id: string) => setList((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  const q = query.trim().toLowerCase()
  const filtered = q
    ? all.filter((c) => `${c.title} ${c.category}`.toLowerCase().includes(q))
    : active === "all"
      ? all
      : (groups.find((g) => g.category === active)?.courses ?? [])
  const heroMode = useResponsive<string>({ sm: "compact", lg: "full" })
  const listed = all.filter((c) => list.includes(c.id))
  const tabs = groups.map((g) => ({ category: g.category, label: g.category, count: g.courses.length }))

  useEffect(() => {
    if (!view) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setView(null)
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [view])

  return (
    <div className="relative bg-white">
      <FrameLines />

      {/* The frame: hatched strips hug both sides of the content column, as on tailwindcss.com. Neutral lines read on light and dark. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        <div className="absolute inset-y-0 left-1/2 w-[min(1440px,100%-200px)] -translate-x-1/2">
          {["-left-7", "-right-7"].map((side) => (
            <span
              key={side}
              className={`absolute inset-y-0 ${side} w-7 border-x border-[rgba(115,115,115,0.3)]`}
              style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(115,115,115,0.32) 0 1px, transparent 1px 6px)" }}
            />
          ))}
        </div>
      </div>

      {/* 01 Hero: a mosaic of tiles, then a line of text, two pills and a large light headline */}
      <section className={`${GUTTER} pb-10 pt-6 lg:pb-14 lg:pt-8`}>
        <div data-rule className="rise">
          <MaskedMosaic
            src={HERO_IMAGE}
            fallback={HERO_FALLBACK}
            tiles={heroMode === "compact" ? HERO_COMPACT : HERO_FULL}
            objectPosition="center 40%"
            className={`grid gap-2 ${
              heroMode === "compact"
                ? "h-[clamp(240px,60vw,340px)] grid-cols-4 grid-rows-2"
                : "aspect-[7/2] [grid-template-columns:minmax(0,0.5fr)_repeat(6,minmax(0,1fr))_minmax(0,0.5fr)] [grid-template-rows:minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,0.5fr)]"
            }`}
          />
        </div>

        <div data-rule className="mt-3 flex flex-wrap items-start justify-between gap-x-10 gap-y-2">
          <p className="max-w-[56ch] text-[13px] leading-5 text-ink-2">
            From your first drawing to your final project, CAD Desk is where CAD, CAM and IT are learned the practical way, in Noonmati or live online.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-2">
            <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-ink" strokeWidth={2} /> Certificate with every course</li>
            <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-ink" strokeWidth={2} /> Classroom and live online</li>
          </ul>
        </div>

        <div data-rule className="mt-5 flex flex-wrap gap-3">
          <a href="#courses" className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-ink-2">
            Browse courses
          </a>
          <a href={waLink([])} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full border border-ink/25 px-6 text-sm font-medium text-ink transition-colors hover:border-ink">
            Ask on WhatsApp
          </a>
        </div>

        <h1 data-rule className={`${DISPLAY} rise mt-5 text-[clamp(48px,7.4vw,118px)] leading-[0.94] text-ink`} style={{ ["--i" as string]: 1 }}>
          Build a stronger career<span className="text-brand">.</span>
          <br />
          Learn what industries use<span className="text-brand">.</span>
        </h1>
      </section>

      {/* 02 Ribbon: two bands cross at a slant */}
      <div aria-hidden className="relative my-6 h-[150px] overflow-hidden sm:h-[190px]">
        {[
          { words: BAND_A, cls: "bg-brand text-white -rotate-[2.2deg]", rev: false },
          { words: BAND_B, cls: "bg-ink text-white rotate-[1.6deg]", rev: true },
        ].map((b, i) => (
          <div key={i} className={`absolute inset-x-[-5%] top-1/2 -mt-5 overflow-hidden py-3 sm:-mt-6 sm:py-4 ${b.cls}`}>
            <div className={`marquee ${b.rev ? "rev" : ""}`}>
              {[0, 1].map((k) => (
                <div key={k} className={`${DISPLAY} flex shrink-0 items-center gap-8 pr-8 text-xl sm:text-3xl`}>
                  {[...b.words, ...b.words].map((w, j) => (
                    <span key={j} className="flex items-center gap-8 whitespace-nowrap">
                      {w} <span className="text-white/50">/</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 03 Train your way: tracks */}
      <section className={`${GUTTER} py-16 lg:py-24`}>
        <SideLabel>Tracks</SideLabel>
        <StickyBar target="h-tracks" title="Train your way" index={1} total={5} />
        <Note>/ tracks · pick one</Note>
        <div data-rule className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="h-tracks" className={`${DISPLAY} text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>
            Train your way<span className="text-brand">.</span>
          </h2>
          <p className="max-w-[40ch] text-base leading-7 text-ink-2">
            Different goals, one institute. Pick a track and see every course in it.
          </p>
        </div>
        <ul data-rule className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {groups.map((g, i) => (
            <motion.li
              key={g.category}
              
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
           >
              <a
                href="#courses"
                onClick={(e) => {
                  e.preventDefault()
                  setActive(g.category)
                  setQuery("")
                  document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })
                }}
                aria-label={`${g.category}, ${g.courses.length} courses`}
                className="track-book book-card group block rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ink"
             >
                <div className="flex items-end" style={{ gap: Math.max(12, bw * 0.1) }}>
                  <Book
                    cover
                    width={bw}
                    title={g.category}
                    color="#171717"
                    illustration={
                      TRACK_IMG[g.category] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={TRACK_IMG[g.category]} alt="" draggable={false} className="h-full w-full object-cover" />
                      ) : undefined
                    }
                  />
                  <span aria-hidden className="block pb-[3%] transition-colors duration-300">
                    <span
                      className={`${DISPLAY} block leading-[0.8] text-ink/20 transition-colors duration-300 group-hover:text-brand group-focus-visible:text-brand`}
                      style={{ fontSize: bw * 0.55 }}
                   >
                      {g.courses.length}
                    </span>
                    <span
                      className="mt-2 block font-medium text-ink/40 transition-colors duration-300 group-hover:text-ink group-focus-visible:text-ink"
                      style={{ fontSize: Math.max(10, bw * 0.085) }}
                   >
                      Courses
                    </span>
                  </span>
                </div>
                <span className="mt-5 flex items-baseline justify-between gap-3">
                  <span className={`${DISPLAY} text-xl leading-none text-ink`}>{g.category}</span>
                  <span className="font-mono text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                </span>
              </a>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Sheet 03: every course, under tabs */}
      <section id="courses" className={`${GUTTER} scroll-mt-16 border-t border-line pb-32 pt-16 lg:pt-24`}>
        <SideLabel>Catalogue</SideLabel>
        <StickyBar target="h-courses" title="Find your course" index={2} total={5} />
        <Note>/ catalogue · five tracks</Note>
        <div data-rule className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
          <h2 id="h-courses" className={`${DISPLAY} text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>Find your course<span className="text-brand">.</span></h2>
          <div className="w-full sm:w-[360px] lg:pt-4">
            <label className="flex w-full max-w-[420px] items-center gap-3 border-b border-ink pb-2 text-ink">
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH COURSES"
                aria-label="Search courses"
                className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase tracking-[0.12em] outline-none placeholder:text-ink-3/70"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="font-mono text-xs uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-ink">
                  Clear
                </button>
              )}
            </label>
            <p className="mt-3 text-sm leading-6 text-ink-3">Pick a track below, or search for a course by name.</p>
          </div>
        </div>

        {/* the tracks as one large line of type: the picked track is solid, the rest fade back */}
        <div role="tablist" aria-label="Course tracks" className={`mt-8 ${DISPLAY} text-[clamp(26px,2.5vw,44px)] leading-[1.08]`}>
            {tabs.map((t) => {
              const on = active === t.category && !q
              return (
                <span key={t.category} className="mr-[0.3em] inline">
                  <button
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setActive(t.category)
                      setQuery("")
                      setSeed((n) => n + 1)
                    }}
                    className={`inline cursor-pointer whitespace-nowrap text-left uppercase outline-none transition-colors duration-300 focus-visible:underline focus-visible:decoration-4 ${
                      on ? "text-ink" : "text-[#d4d4d4] hover:text-ink/60"
                    }`}
                  >
                    {t.label}
                    <sup className="ml-[0.12em] align-super font-mono text-[0.24em] tracking-normal text-ink-3">{t.count}</sup>
                  </button>
                </span>
              )
            })}
          </div>

        <div ref={gridRef} className="mt-8">
          <p className="font-mono text-xs text-ink-3">
              {filtered.length} {filtered.length === 1 ? "course" : "courses"}
              {q ? ` for "${query.trim()}"` : active === "all" ? "" : ` in ${active}`}
            </p>
            {filtered.length ? (
              <ul data-rule className="mt-6 grid gap-y-12" style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.w}px)`, columnGap: GAP }}>
                {filtered.map((c, i) => {
                  // stable pseudo-random delay (0 to 0.55s), different each tab change
                  const d = (((i + 1) * 7919 + seed * 104729) % 1000) / 1000 * 0.55
                  return (
                    <li key={`${seed}-${c.id}`} className="relative">
                      {/* skeleton shimmer holds the place until the book arrives */}
                      <motion.span
                        aria-hidden
                        className="skeleton absolute left-0 top-0 block rounded-md"
                        style={{ width: grid.w, height: grid.w * 1.5 }}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: d + 0.25 }}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.55, delay: d + 0.12, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <BookCard course={c} img={posterOf(c)} w={grid.w} added={list.includes(c.id)} onOpen={() => setView(c)} onToggle={() => toggle(c.id)} />
                      </motion.div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-6 text-base text-ink-2">
                Nothing matches that search.{" "}
                <a href={waLink([])} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">
                  Ask us on WhatsApp
                </a>
              </p>
            )}
        </div>
      </section>

      {/* 04 More than a classroom: numbered rows, the open one fills with its own colour */}
      <section className={`${GUTTER} border-t border-line py-16 lg:py-24`}>
        <SideLabel>Why CAD Desk</SideLabel>
        <StickyBar target="h-why" title="More than a classroom" index={3} total={5} />
        <Note>/ why · what you get</Note>
        <h2 id="h-why" data-rule className={`${DISPLAY} max-w-[16ch] text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>
          More than a classroom<span className="text-brand">.</span> A stronger career<span className="text-brand">.</span>
        </h2>
        <ol data-rule className="mt-12 border-t border-ink lg:mt-16">
          {WHY.map((w, i) => {
            const open = why === i
            const st = WHY_STYLE[i % WHY_STYLE.length]
            return (
              <li key={w.title} className={open ? "py-3" : "border-b border-line"}>
                <div className="relative rounded-[28px] transition-colors duration-500 ease-out" style={{ background: open ? st.bg : "transparent" }}>
                  {open && (
                    <>
                      {/* ticket notches: a folded corner at the top right and a cut in each side */}
                      <span aria-hidden className="absolute right-[6%] top-0 h-11 w-11 bg-white [clip-path:polygon(0_0,100%_0,100%_100%)]" />
                      <span aria-hidden className="absolute left-0 top-[66%] h-12 w-7 bg-white [clip-path:polygon(0_0,100%_50%,0_100%)]" />
                      <span aria-hidden className="absolute right-0 top-[66%] h-12 w-7 bg-white [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
                    </>
                  )}
                  <button
                    onClick={() => setWhy(i)}
                    aria-expanded={open}
                    className={`group grid w-full items-center gap-5 px-5 py-8 text-left transition-colors duration-500 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)_56px] md:gap-10 md:px-10 ${open ? st.fg : "text-ink"}`}
                  >
                    <span className="flex items-center gap-5 md:gap-7">
                      <span className={`${DISPLAY} text-[clamp(56px,7vw,112px)] leading-[0.8]`}>
                        {i + 1}
                        <span className={open ? "" : "text-brand"}>.</span>
                      </span>
                      <span className={`${DISPLAY} text-balance text-[clamp(26px,3vw,48px)] leading-[1.02]`}>{w.title}</span>
                    </span>
                    <span className={`text-base leading-7 transition-colors duration-500 ${open ? "" : "text-ink-2"}`}>{w.text}</span>
                    <span
                      aria-hidden
                      className={`grid h-14 w-14 place-items-center rounded-full transition-all duration-500 group-hover:scale-105 ${open ? st.btn : "bg-ink text-white"}`}
                    >
                      <ChevronDown className={`h-6 w-6 transition-transform duration-500 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mx-auto flex h-[250px] max-w-[980px] items-start gap-4 overflow-y-hidden overflow-x-auto px-5 [scrollbar-width:none] md:justify-center md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
                          <MiniCards i={i} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* 05 Dark: the numbers and how to enrol */}
      <section data-band className={`${GUTTER} py-16 text-white lg:py-24`}>
        <SideLabel>Numbers</SideLabel>
        <StickyBar target="h-numbers" title="Real courses" index={4} total={5} dark />
        <Note dark>/ numbers · how to enrol</Note>
        <div data-rule className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-center lg:gap-20">
          <div>
            <h2 id="h-numbers" className={`${DISPLAY} text-[clamp(44px,6vw,88px)] leading-[0.95]`}>
              Real courses<span className="text-brand">.</span> Real projects<span className="text-brand">.</span>
            </h2>
            <p className={`${DISPLAY} mt-8 text-[clamp(80px,12vw,180px)] leading-none`}>{all.length}</p>
            <p className="mt-2 max-w-[34ch] text-base leading-7 text-white/60">courses, each one ending in a CAD Desk certificate.</p>
          </div>
          <div className="relative" onMouseLeave={() => setDot(null)}>
            <div className="grid grid-cols-11 gap-2 sm:gap-3">
              {all.map((c, i) => {
                const on = dot?.c.id === c.id
                const img = posterOf(c)
                const pick = (e: React.SyntheticEvent<HTMLButtonElement>) => {
                  const el = e.currentTarget
                  setDot({ c, i, x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop, b: el.offsetTop + el.offsetHeight, w: el.parentElement?.offsetWidth ?? 0 })
                }
                return (
                  <button
                    key={c.id}
                    onMouseEnter={pick}
                    onFocus={pick}
                    onBlur={() => setDot(null)}
                    onClick={() => setView(c)}
                    aria-label={c.title}
                    className={`relative aspect-square rounded-full outline-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-white ${
                      on ? "z-10 scale-[1.9]" : "scale-100"
                    } ${c.certification ? "bg-brand" : "bg-white/15"}`}
                  >
                    {/* the course's own cover fades into the circle */}
                    <span
                      aria-hidden
                      className={`absolute inset-0 grid place-items-center overflow-hidden rounded-full bg-cover bg-center shadow-[0_0_0_2px_#fff] transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0"}`}
                      style={{
                        backgroundImage: img ? `url(${img})` : undefined,
                        background: img ? undefined : (COVER_COLORS[c.category] ?? "#171717"),
                      }}
                    >
                      {!img && <span className={`${DISPLAY} text-[10px] leading-none text-white/90`}>{c.title.replace(/[^A-Za-z0-9 ]/g, "").split(" ").slice(0, 2).map((w) => w[0]).join("")}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
            <AnimatePresence>
              {dot && (
                <motion.div
                  key="tip"
                  initial={{ opacity: 0, scale: 0.94, x: Math.min(Math.max(dot.x - 125, 0), Math.max(dot.w - 250, 0)), y: dot.i < 22 ? dot.b + 44 : dot.y - 44 - 170 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: Math.min(Math.max(dot.x - 125, 0), Math.max(dot.w - 250, 0)),
                    y: dot.i < 22 ? dot.b + 44 : dot.y - 44 - 170,
                  }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.7, opacity: { duration: 0.2 }, scale: { duration: 0.25 } }}
                  className="pointer-events-none absolute left-0 top-0 z-20 h-[170px] w-[250px] rounded-xl bg-white p-4 text-ink shadow-[0_16px_40px_rgba(0,0,0,.45)]"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={dot.c.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex gap-3"
                    >
                      <div className="shrink-0">
                        <CoverBook course={dot.c} img={posterOf(dot.c) ?? null} width={92} />
                      </div>
                      <div className="min-w-0 self-center">
                        <p className="font-mono text-[10px] text-ink-3">{code(dot.c.category)} · {days(dot.c)}</p>
                        <p className="mt-1.5 text-base font-medium leading-snug">{dot.c.title}</p>
                        {dot.c.certification && <p className="mt-1 text-[11px] text-brand">Certificate</p>}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <ol data-rule className="mt-16 grid gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-3 lg:mt-24">
          {STEPS.map((st, i) => (
            <li key={st.title} className="bg-ink p-7">
              <span className="font-mono text-xs text-white/50">Step {i + 1}</span>
              <p className={`${DISPLAY} mt-8 text-3xl leading-none`}>{st.title}</p>
              <p className="mt-3 text-base leading-7 text-white/60">{st.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 07 Call to action + centre + footer wordmark */}
      <section className={`${GUTTER} border-t border-line pt-16 lg:pt-24`}>
        <SideLabel>Contact</SideLabel>
        <StickyBar target="h-contact" title="Ready to build your career" index={5} total={5} size="clamp(31px, 4.8vw, 72px)" />
        <Note>/ contact · say hello</Note>
        <div data-rule className="flex flex-wrap items-end justify-between gap-8">
          <h2 id="h-contact" className={`${DISPLAY} text-[clamp(52px,8vw,120px)] leading-[0.92] text-ink`}>
            Ready to build<br />your career<span className="text-brand">?</span>
          </h2>
          <div className="max-w-[40ch]">
            <p className="text-base leading-7 text-ink-2">
              Tell us what you want to learn. We reply on WhatsApp with batches, timing and fees.
            </p>
            <a href={waLink([])} target="_blank" rel="noopener noreferrer" className={`${PRIMARY} mt-6`}>
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Start on WhatsApp
            </a>
          </div>
        </div>
        <div data-rule className="mt-16 grid gap-6 border-t border-ink pt-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:mt-24">
          <p className={`${DISPLAY} text-4xl leading-none text-ink`}>Our centre<br />in Guwahati</p>
          <div>
            <p className="text-xl font-medium text-ink">Noonmati</p>
            <p className="mt-1 text-base text-ink-2">CAD Desk Guwahati, Noonmati, Guwahati, Assam</p>
            <a href="tel:+919127281610" className="mt-4 inline-block font-mono text-sm text-ink underline underline-offset-4">+91 91272 81610</a>
          </div>
        </div>
        <p data-rule aria-hidden className={`${DISPLAY} mt-16 select-none overflow-hidden whitespace-nowrap text-center text-[min(21.5vw,340px)] leading-[0.8] text-brand lg:mt-24`}>
          CAD DESK
        </p>
      </section>

      {/* Your list: appears once something is added */}
      <AnimatePresence>
        {listed.length > 0 && (
          <motion.aside
            aria-label="Your list"
            initial={{ y: 88 }}
            animate={{ y: 0 }}
            exit={{ y: 88 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-xl bg-ink p-2 text-white shadow-[0_12px_32px_rgba(23,23,23,.25)]"
         >
            {listOpen && (
              <ul className="mb-2 max-h-[40vh] overflow-y-auto border-b border-white/15 pb-2">
                {listed.map((c) => (
                  <li key={c.id} className="flex h-9 items-center justify-between gap-3 px-2 text-sm">
                    <span className="truncate">{c.title}</span>
                    <button onClick={() => toggle(c.id)} aria-label={`Remove ${c.title}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-white/15">
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setListOpen((o) => !o)} aria-expanded={listOpen} className="flex h-10 flex-1 items-center gap-3 px-2 text-left text-sm">
                <span className="font-mono text-xs text-white/60">{String(listed.length).padStart(2, "0")}</span>
                {listed.length === 1 ? "course" : "courses"} in your list
                <span className="text-white/60 underline underline-offset-4">{listOpen ? "Hide" : "View"}</span>
              </button>
              <a
                href={waLink(listed.map((c) => c.title))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-[#b42318]"
             >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Enquire
              </a>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Course sheet */}
      <AnimatePresence>
        {view && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setView(null)}
         >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={view.title}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 12 }}
              animate={{ y: 0 }}
              exit={{ y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid w-full max-w-3xl gap-8 rounded-xl bg-white p-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:p-8"
           >
              <button
                autoFocus
                onClick={() => setView(null)}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-ink transition-colors hover:bg-paper-raised"
             >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <div className="mx-auto w-full max-w-[220px] sm:max-w-none">
                <CoverBook course={view} img={posterOf(view) ?? null} width={200} />
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="font-mono text-xs text-ink-3">
                  {code(view.category)} / {view.category}
                </p>
                <h2 className="mt-2 pr-10 text-2xl font-medium leading-tight tracking-[-0.02em] text-ink sm:text-3xl">{view.title}</h2>
                <p className="mt-3 font-mono text-xs text-ink-2">
                  {[days(view), Number(view.lessons) > 1 ? `${view.lessons} lessons` : null, "Offline and online", view.certification ? "Certificate" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-4 max-h-48 overflow-y-auto pr-2 text-sm leading-6 text-ink-2">
                  {view.caption ?? `${view.title} training at CAD Desk Guwahati, taught hands-on.`}
                </p>
                <div className="mt-auto flex flex-wrap gap-3 pt-8">
                  <a href={waLink([view.title])} target="_blank" rel="noopener noreferrer" className={PRIMARY}>
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} /> Enquire on WhatsApp
                  </a>
                  <button onClick={() => toggle(view.id)} className={SECONDARY}>
                    {list.includes(view.id) ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
                    {list.includes(view.id) ? "In your list" : "Add to list"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
