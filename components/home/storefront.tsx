"use client"

import { ViewTransition, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FrameLines, FrameStrips } from "@/components/home/frame-lines"
import { MaskedMosaic, type MosaicTile } from "@/components/home/masked-mosaic"
import { Book } from "@/components/ui/book"
import { RibbonTwist } from "@/components/home/ribbon-twist"
import { useResponsive } from "@/components/ui/use-responsive"
import { AnimatePresence, motion } from "motion/react"
import { UNIVERSITIES, type University } from "@/lib/universities"
import { ScrollRevealText } from "@/components/ui/scroll-reveal-text"
import { CAD_DESK_NETWORK, FAQ } from "@/lib/site"
import { ArrowRight, Check, ChevronDown, MessageCircle, Plus, Search, X } from "lucide-react"
import { COVER_COLORS, CoverBook, sharedImages } from "@/components/home/course-cover"
import type { PublicCourse } from "@/lib/public-courses"
import { courseSlugs } from "@/lib/course-slug"
import { webp } from "@/lib/webp"

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
  "Civil / Architecture": "/images/categories/civil.webp",
  "CS/IT": "/images/categories/cs-it.webp",
  Mechanical: "/images/categories/mechanical.webp",
  "Creative Arts": "/images/categories/creative-arts.webp",
  Electrical: "/images/categories/electrical.webp",
}
const DISPLAY = "font-[family-name:var(--font-display)] uppercase tracking-[-0.01em]"
const BAND_A = ["Civil / Architecture", "Mechanical", "Electrical", "CS/IT", "Creative Arts"]
// page margin 20 / 60 / 100; every direct child of a section is a centred 1440px column, so left and right edges always match
const GUTTER = "relative px-5 md:px-[60px] lg:px-[100px] [&>*]:mx-auto [&>*]:max-w-[1440px]"
const PRIMARY = "inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-[#b42318]"

const GAP = 24 // gap between books in the course grid

/** A course as a book: poster (or generated cover) on the front, title and length underneath. */
function BookCard({ course, img, w, added, href, onToggle }: { course: PublicCourse; img?: string; w: number; added: boolean; href: string; onToggle: () => void }) {
  return (
    <div className="shrink-0" style={{ width: w }}>
      <Link href={href} transitionTypes={["nav-forward"]} aria-label={`View ${course.title}`} className="book-card block rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <ViewTransition name={`course-book-${course.id}`} share="morph">
          <div><CoverBook course={course} img={img ?? null} width={w} /></div>
        </ViewTransition>
      </Link>
      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <ViewTransition name={`course-title-${course.id}`} share="morph">
            <p className="truncate text-sm font-medium text-ink">{course.title}</p>
          </ViewTransition>
          <p className="mt-1 truncate text-xs text-ink-3">{code(course.category)} · {days(course)}</p>
        </div>
        <button
          onClick={onToggle}
          aria-pressed={added}
          aria-label={added ? `Remove ${course.title} from your list` : `Add ${course.title} to your list`}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors ${added ? "border-ink bg-ink text-paper" : "border-line text-ink hover:bg-paper-raised"}`}
       >
          {added ? <Check className="h-4 w-4" strokeWidth={1.5} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  )
}

/** A university tile. Hovering any tile reports it so a popover can show; with a letter it is also a link to the full letter. */
function UniTile({ u, className, children, onPeek }: { u: University; className: string; children: React.ReactNode; onPeek: (p: { id: string; x: number; y: number } | null) => void }) {
  const show = (e: React.SyntheticEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onPeek({ id: u.id, x: r.left + r.width / 2, y: r.bottom })
  }
  const hide = () => onPeek(null)
  if (!u.letter)
    return <div tabIndex={0} aria-label={u.name} className={`group ${className}`} onMouseEnter={show} onFocus={show} onMouseLeave={hide} onBlur={hide}>{children}</div>
  return (
    <Link href={`/appreciation/${u.id}`} aria-label={`Read the appreciation letter from ${u.name}`} className={`group cursor-pointer ${className}`} onMouseEnter={show} onFocus={show} onMouseLeave={hide} onBlur={hide}>
      {children}
    </Link>
  )
}

/** Small monospace caption above a block, like the class-name notes on tailwindcss.com. */
function Note({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p data-rule className={`mb-4 text-xs tracking-wide ${dark ? "text-white/65" : "text-ink-3"}`}>{children}</p>
}

/** Vertical label sitting in the hatched strip to the left of the column (large screens only). */
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-12 left-[calc(50%-min(720px,50vw-100px)-23px)] z-20 hidden rotate-180 text-xs uppercase tracking-[0.22em] text-brand [writing-mode:vertical-rl] lg:block"
    >
      {children}
    </span>
  )
}

/** Colour of each "what you get" row when it is open, and how its text and button read on that colour. */
const WHY_STYLE = [
  { bg: "#ff8a35", fg: "text-ink", btn: "bg-ink text-paper" },
  { bg: "#e6fa55", fg: "text-ink", btn: "bg-ink text-paper" },
  { bg: "#ff4a3f", fg: "text-ink", btn: "bg-ink text-paper" },
]

const PILL: Record<string, string> = {
  lime: "bg-[#e6fa55] text-ink",
  orange: "bg-[#ff8a35] text-ink",
  red: "bg-[#ff4a3f] text-ink",
  violet: "bg-[#9b7bf7] text-ink",
  green: "bg-[#06b57b] text-ink",
  ink: "bg-ink text-paper",
  sky: "bg-[#bcd8f2] text-ink",
}

function Pill({ c, children }: { c: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${PILL[c]}`}>{children}</span>
}

function MiniCard({ title, sub, className = "", children }: { title: string; sub: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`min-h-[330px] w-[230px] shrink-0 md:w-[min(300px,30%)] rounded-t-[28px] bg-paper-card p-6 text-center text-ink ${className}`}>
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
          <span className="mt-2 grid h-14 w-14 place-items-center rounded-full bg-brand text-xs text-white">CAD DESK</span>
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
// the hero pours between these like ink (see ink-flow-carousel); a single image is shown as before
const HERO_IMAGES = [HERO_IMAGE, "/images/hero/institute-1.webp", "/images/hero/institute-2.webp", "/images/hero/institute-3.webp", "/images/hero/institute-4.webp"]
const MAX_LIST = 20
const MAX_PER_TRACK = 10
const HERO_FALLBACK = "/images/hero/categories-collage.webp"

// 8 x 3 grid, 24 boxes numbered across (1 to 24). The first and last columns are half width and the top and
// bottom rows are half height, so the four corners are quarter size and the middle boxes are square.
// Boxes 11, 15 and 21 carry text; every other box is a slice of the one big image.
// What the "Hands-on training" box says for each hero picture (same order as HERO_IMAGES).
const HERO_COPY = [
  { title: "Hands-on training", text: "Real projects as you learn, with internships encouraged." },
  { title: "Mechanical design", text: "3D models and drawings, taught step by step." },
  { title: "Civil and architecture", text: "Floor plans and building models, from drawing to 3D." },
  { title: "Learn by making", text: "Work with real models as you learn." },
  { title: "Learn together", text: "Guided practice in a working CAD lab, with an instructor on the floor." },
]
// The other two boxes keep their words and change colour with each picture. Full class names so Tailwind sees them.
const HERO_COLORS = [
  { a: "bg-ink text-paper", b: "bg-[#2f3bff] text-white", badge: "bg-white text-[#2f3bff]" },
  { a: "bg-[#ff4a3f] text-ink", b: "bg-[#e6fa55] text-ink", badge: "bg-ink text-paper" },
  { a: "bg-[#06b57b] text-ink", b: "bg-[#9b7bf7] text-ink", badge: "bg-ink text-paper" },
  { a: "bg-[#ff8a35] text-ink", b: "bg-ink text-paper", badge: "bg-paper text-ink" },
  { a: "bg-[#2f3bff] text-white", b: "bg-[#bcd8f2] text-ink", badge: "bg-ink text-paper" },
]
const heroText = (i: number): Record<number, { cls: string; node: React.ReactNode }> => ({
  11: {
    cls: "bg-paper-raised",
    node: (
      <Link href="/courses" className="group flex h-full flex-col justify-between p-3 sm:p-4">
        <span>
          <span key={i} className="rise block">
            <span className="block text-[clamp(13px,1.3vw,19px)] font-medium leading-tight text-ink">{HERO_COPY[i].title}</span>
            <span className="mt-1 block text-[clamp(12px,0.9vw,14px)] leading-snug text-ink-2">{HERO_COPY[i].text}</span>
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-ink">
          Browse courses <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} />
        </span>
      </Link>
    ),
  },
  15: {
    cls: HERO_COLORS[i].a,
    node: (
      <div className="flex h-full flex-col justify-between p-3 sm:p-4">
        <span className={`${DISPLAY} text-[clamp(16px,1.7vw,26px)] leading-[1.02]`}>Classroom<br />or live online</span>
        <span className="text-xs opacity-80">Noonmati, Guwahati</span>
      </div>
    ),
  },
  21: {
    cls: HERO_COLORS[i].b,
    node: (
      <div className="flex h-full flex-col justify-between p-3 sm:p-4">
        <span className={`${DISPLAY} text-[clamp(16px,1.7vw,26px)] leading-[1.02]`}>Certificate with<br />every course</span>
        <span className={`grid h-7 w-7 place-items-center rounded-full ${HERO_COLORS[i].badge}`}>
          <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </div>
    ),
  },
})
const heroFull = (i: number): MosaicTile[] => Array.from({ length: 24 }, (_, k): MosaicTile => {
  const n = k + 1
  const col = String((k % 8) + 1)
  const row = String(Math.floor(k / 8) + 1)
  const t = heroText(i)[n]
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
        const hdr = document.querySelector("[data-site-header]")?.getBoundingClientRect().height ?? 64
        const p = Math.min(Math.max((hdr + 36 - el.getBoundingClientRect().bottom) / 90, 0), 1)
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
      className={`sticky top-[var(--site-header)] z-30 -mb-[var(--bh)] flex h-[var(--bh)] items-center justify-between gap-4 border-b will-change-transform ${
        dark ? "border-white/15 bg-night text-white" : "border-line bg-paper text-ink"
      }`}
    >
      <span className={`${DISPLAY} leading-none`} style={{ fontSize: size }}>
        {title}
        <span className="text-brand">.</span>
      </span>
      <span className={`text-xs ${dark ? "text-white/70" : "text-ink-3"}`}>
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  )
}

export function Storefront({ groups, mode = "home" }: { groups: Groups; mode?: "home" | "catalogue" }) {
  const page = mode === "catalogue" // /courses: just the catalogue, centred

  const all = groups.flatMap((g) => g.courses)
  const shared = sharedImages(all)
  const slugs = courseSlugs(all)
  // ponytail: only our own uploads (".../course-images/...") are portrait posters; the older hotlinked
  // thumbnails are small landscape logos that a 2:3 cover would letterbox, so those courses get a
  // drawing-sheet cover instead. Switch to real image dimensions if the image sources ever change.
  const posterOf = (c: PublicCourse) =>
    c.image && !shared.has(c.image) && c.image.includes("/course-images/") ? c.image : undefined

  const [active, setActive] = useState(groups[0]?.category ?? "all")
  const [query, setQuery] = useState("")
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("track")
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL must wait until after hydration
    if (t && groups.some((g) => g.category === t)) setActive(t)
  }, [groups])
  // ponytail: the list lives in memory only and resets on reload. Persist to localStorage if people ask.
  const [list, setList] = useState<string[]>([])
  const [listOpen, setListOpen] = useState(false)
  const router = useRouter()
  const open = (c: PublicCourse) => router.push(`/courses/${slugs.get(c.id)}`)
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
  const [peek, setPeek] = useState<{ id: string; x: number; y: number } | null>(null) // letter preview under the hovered university
  const peekUni = peek ? UNIVERSITIES.find((u) => u.id === peek.id) : undefined
  const [seed, setSeed] = useState(1) // bumps on every tab change so the books reveal in a new random order
  const [why, setWhy] = useState(0)
  const [dot, setDot] = useState<{ c: PublicCourse; i: number; x: number; y: number; b: number; w: number } | null>(null)

  // Limits: 20 courses in the list, at most 10 from any one track. A blocked add shows a note in the list bar.
  const [limitNote, setLimitNote] = useState("")
  const toggle = (id: string) => {
    if (list.includes(id)) return setList(list.filter((x) => x !== id)), setLimitNote("")
    const cat = all.find((c) => c.id === id)?.category
    const sameTrack = list.filter((x) => all.find((c) => c.id === x)?.category === cat).length
    if (list.length >= MAX_LIST) return setLimitNote(`Your list is full (${MAX_LIST} courses). Remove one to add another.`)
    if (sameTrack >= MAX_PER_TRACK) return setLimitNote(`Up to ${MAX_PER_TRACK} courses per track. Remove one from ${cat} first.`)
    setList([...list, id])
    setLimitNote("")
  }
  const q = query.trim().toLowerCase()
  const filtered = q
    ? all.filter((c) => `${c.title} ${c.category}`.toLowerCase().includes(q))
    : active === "all"
      ? all
      : (groups.find((g) => g.category === active)?.courses ?? [])
  const heroMode = useResponsive<string>({ sm: "compact", lg: "full" })
  // The boxes follow the picture: switch just as the new one finishes pouring in, not when the pour starts.
  const [heroIdx, setHeroIdx] = useState(0)
  const heroTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(heroTimer.current), [])
  const onHeroSlide = (i: number) => {
    clearTimeout(heroTimer.current)
    heroTimer.current = setTimeout(() => setHeroIdx(i), 1100)
  }
  const heroTiles = useMemo(() => heroFull(heroIdx), [heroIdx])
  const listed = all.filter((c) => list.includes(c.id))
  const tabs = groups.map((g) => ({ category: g.category, label: g.category, count: g.courses.length }))

  return (
    <div className="relative bg-paper">
      <FrameLines />

      <FrameStrips />

      {!page && (<>
      {/* 01 Hero: a mosaic of tiles, then a line of text, two pills and a large light headline */}
      <section className={`${GUTTER} pb-2 pt-6 lg:pb-4 lg:pt-8`}>
        <div data-rule className="rise">
          <MaskedMosaic
            src={HERO_IMAGE}
            fallback={HERO_FALLBACK}
            tiles={heroMode === "compact" ? HERO_COMPACT : heroTiles}
            objectPosition="center 40%"
            images={HERO_IMAGES}
            focusY={0.4}
            autoplay={6000}
            onSlide={onHeroSlide}
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
          <Link href="/courses" className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink-2">
            Browse courses
          </Link>
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

      {/* Universities strip: bold title, then logo + name pairs drifting past on the white sheet; the full grid is further down */}
      <section id="universities" aria-label="Universities we have trained students at" className={`${GUTTER} scroll-mt-[var(--site-header)] pb-10 pt-12 lg:pb-14 lg:pt-16`}>
        <Note>/ 02 · trust · who we have taught</Note>
        <div data-rule className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 className={`${DISPLAY} text-[clamp(36px,5vw,72px)] leading-[0.95] text-ink`}>
            Trusted by <span className="text-brand">Assam&apos;s</span> universities<span className="text-brand">.</span>
          </h2>
          <ScrollRevealText end={0.5} text="We have trained students at these universities and received letters of appreciation." className="max-w-[38ch] text-base leading-7 text-ink-2" />
        </div>
        <div data-rule className="uni-marquee mt-8 overflow-hidden border-y border-line py-6 lg:mt-10">
          <ul className="uni-track flex w-max items-center">
            {[...UNIVERSITIES, ...UNIVERSITIES].map((u, i) => (
              <li key={`${u.id}-${i}`} aria-hidden={i >= UNIVERSITIES.length || undefined} className="shrink-0">
                <UniTile u={u} onPeek={setPeek} className="flex items-center gap-4 pr-12 outline-none md:pr-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/universities/${u.id}.webp`}
                    alt={i < UNIVERSITIES.length ? `${u.short} logo` : ""}
                    draggable={false}
                    className={`block h-16 w-16 shrink-0 object-contain md:h-20 md:w-20 ${u.dark ? "rounded-full bg-[#1a2a4a] p-1.5" : "bg-white"}`}
                  />
                  <span className="block">
                    <span className={`${DISPLAY} block whitespace-nowrap text-xl leading-none text-ink transition-colors group-hover:text-brand group-focus-visible:text-brand md:text-2xl`}>{u.short}</span>
                    <span className="mt-1.5 block text-xs text-ink-3">{u.place}</span>
                  </span>
                  <span aria-hidden className="ml-12 h-10 w-px bg-line md:ml-16" />
                </UniTile>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 02 Ribbon: two satin ribbons that wave and twist, weaving over and under each other */}
      <div className="relative -mb-2 overflow-hidden">
        <RibbonTwist text={BAND_A.join("   ✦   ")} className="h-[190px] sm:h-[230px]" />
      </div>

      {/* 03 Train your way: tracks */}
      <section className={`${GUTTER} pb-16 pt-6 lg:pb-24 lg:pt-8`}>
        <SideLabel>Tracks</SideLabel>
        <StickyBar target="h-tracks" title="Train your way" index={3} total={7} />
        <Note>/ 03 · choose · pick a track</Note>
        <div data-rule className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="h-tracks" className={`${DISPLAY} text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>
            Train your way<span className="text-brand">.</span>
          </h2>
          <ScrollRevealText end={0.5} text="Different goals, one institute. Pick a track and see every course in it." className="max-w-[40ch] text-base leading-7 text-ink-2" />
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
                href={`/courses?track=${encodeURIComponent(g.category)}`}
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
                        <img src={webp(TRACK_IMG[g.category])} alt="" draggable={false} className="h-full w-full object-cover" />
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
                      className="mt-2 block font-medium text-ink/70 transition-colors duration-300 group-hover:text-ink group-focus-visible:text-ink"
                      style={{ fontSize: Math.max(10, bw * 0.085) }}
                   >
                      Courses
                    </span>
                  </span>
                </div>
                <span className="mt-5 flex items-baseline justify-between gap-3">
                  <span className={`${DISPLAY} text-xl leading-none text-ink`}>{g.category}</span>
                  <span className="text-xs text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                </span>
              </a>
            </motion.li>
          ))}
        </ul>
      </section>

      </>)}

      {/* Sheet 03: every course, under tabs (own page: /courses) */}
      {page && (
      <section id="courses" className={`${GUTTER} scroll-mt-[var(--site-header)] pb-32 pt-12 lg:pt-16`}>
        <SideLabel>Catalogue</SideLabel>
        <StickyBar target="h-courses" title="Find your course" index={3} total={7} />
        <Note>/ 03 · choose · five tracks</Note>
        <div data-rule className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
          <h1 id="h-courses" className={`${DISPLAY} text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>Find your course<span className="text-brand">.</span></h1>
          <div className="w-full sm:w-[360px] lg:pt-4">
            <label className="flex w-full max-w-[420px] items-center gap-3 border-b border-ink pb-2 text-ink">
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH COURSES"
                aria-label="Search courses"
                className="min-w-0 flex-1 bg-transparent text-sm uppercase tracking-[0.12em] outline-none placeholder:text-ink-3"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-xs uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-ink">
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
                      on ? "text-ink" : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {t.label}
                    <sup className="ml-[0.12em] align-super text-[max(12px,0.24em)] tracking-normal text-ink-3">{t.count}</sup>
                  </button>
                </span>
              )
            })}
          </div>

        <div ref={gridRef} className="mt-8">
          <p className="text-xs text-ink-3">
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
                        initial={seed === 1 ? false : { opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: d + 0.25 }}
                      />
                      <motion.div
                        // staggered reveal only when switching tabs; on first show (and when returning from a course) the book is already there so the shared-element morph has something to land on
                        initial={seed === 1 ? false : { opacity: 0, y: 28, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.55, delay: d + 0.12, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <BookCard course={c} img={posterOf(c)} w={grid.w} added={list.includes(c.id)} href={`/courses/${slugs.get(c.id)}`} onToggle={() => toggle(c.id)} />
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
      )}

      {!page && (<>
      {/* 04 More than a classroom: numbered rows, the open one fills with its own colour */}
      <section className={`${GUTTER} border-t border-line py-16 lg:py-24`}>
        <SideLabel>Why CAD Desk</SideLabel>
        <StickyBar target="h-why" title="More than a classroom" index={4} total={7} />
        <Note>/ 04 · difference · what you get</Note>
        <h2 id="h-why" data-rule className={`${DISPLAY} max-w-[16ch] text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>
          More than a classroom<span className="text-brand">.</span> A stronger career<span className="text-brand">.</span>
        </h2>
        <ol data-rule className="mt-12 border-t border-line lg:mt-16">
          {WHY.map((w, i) => {
            const open = why === i
            const st = WHY_STYLE[i % WHY_STYLE.length]
            return (
              <li key={w.title} className={open ? "py-3" : "border-b border-line"}>
                <div className="relative rounded-[28px] transition-colors duration-500 ease-out" style={{ background: open ? st.bg : "transparent" }}>
                  {open && (
                    <>
                      {/* ticket notches: a folded corner at the top right and a cut in each side */}
                      <span aria-hidden className="absolute right-[6%] top-0 h-11 w-11 bg-paper [clip-path:polygon(0_0,100%_0,100%_100%)]" />
                      <span aria-hidden className="absolute left-0 top-[66%] h-12 w-7 bg-paper [clip-path:polygon(0_0,100%_50%,0_100%)]" />
                      <span aria-hidden className="absolute right-0 top-[66%] h-12 w-7 bg-paper [clip-path:polygon(100%_0,0_50%,100%_100%)]" />
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
                      className={`grid h-14 w-14 place-items-center rounded-full transition-all duration-500 group-hover:scale-105 ${open ? st.btn : "bg-ink text-paper"}`}
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

      {/* Proof, in Guwahati's own numbers: years here, universities taught at, what we teach */}
      <section className={`${GUTTER} border-t border-line py-16 lg:py-24`}>
        <SideLabel>Guwahati</SideLabel>
        <StickyBar target="h-network" title="Eight years in Guwahati" index={5} total={7} />
        <Note>/ 05 · proof · in Guwahati</Note>
        <div data-rule className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="h-network" className={`${DISPLAY} max-w-[16ch] text-[clamp(44px,6vw,88px)] leading-[0.95] text-ink`}>
            Eight years in <span className="text-brand">Guwahati</span>.
          </h2>
          <ScrollRevealText
            end={0.5}
            text="CAD Desk Guwahati, a CAD Desk franchise centre in Noonmati, has trained students for over 8 years, including at more than 10 private and government universities."
            className="max-w-[44ch] text-base leading-7 text-ink-2"
          />
        </div>
        <dl data-rule className="mt-12 grid grid-cols-2 border-t border-line lg:mt-16 lg:grid-cols-4">
          {[
            { n: "8+", label: "Years teaching in Guwahati" },
            { n: "10+", label: "Universities, private and government" },
            { n: String(all.length), label: "Courses to choose from" },
            { n: String(groups.length), label: "Tracks, from Civil to Creative Arts" },
          ].map((x, i) => (
            <div key={x.label} className={`flex min-w-0 flex-col border-b border-line py-8 pr-4 ${i % 2 ? "pl-4 lg:pl-8" : ""} ${i > 0 ? "lg:border-l lg:pl-8" : ""}`}>
              <dt className="order-2 mt-3 text-base text-ink-2">{x.label}</dt>
              <dd className={`${DISPLAY} order-1 whitespace-nowrap text-[clamp(34px,4.4vw,72px)] leading-none text-ink`}>{x.n}</dd>
            </div>
          ))}
        </dl>

        {/* The parent brand, kept visibly separate: national figures, labelled as the network's and not Guwahati's */}
        <div data-rule className="mt-10 rounded-xl border border-line bg-paper-raised p-6 md:p-8 lg:mt-14 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-[46ch]">
            <h3 className={`${DISPLAY} text-[clamp(26px,2.6vw,40px)] leading-none text-ink`}>
              Part of <span className="text-brand">CAD Desk</span> India
            </h3>
            <p className="mt-3 text-base leading-7 text-ink-2">
              CAD Desk Guwahati is a franchise centre of CAD Desk India, a national CAD and IT training network. These figures are for the whole network, not for Guwahati alone.
            </p>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-6 lg:mt-0 lg:min-w-[420px]">
            {CAD_DESK_NETWORK.stats.map((x) => (
              <div key={x.label} className="flex min-w-0 flex-col">
                <dt className="order-2 mt-2 text-sm text-ink-2">{x.label}</dt>
                <dd className={`${DISPLAY} order-1 whitespace-nowrap text-[clamp(28px,3vw,44px)] leading-none text-ink`}>{x.n}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p data-rule className="mt-4 text-xs text-ink-3">
          Network figures as published by CAD Desk India at{" "}
          <a href={`https://${CAD_DESK_NETWORK.source}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">{CAD_DESK_NETWORK.source}</a>
          , checked {CAD_DESK_NETWORK.checked}.
        </p>
      </section>

      {/* 05 Dark: the numbers and how to enrol */}
      <section data-band className={`${GUTTER} py-16 text-white lg:py-24`}>
        <SideLabel>Numbers</SideLabel>
        <StickyBar target="h-numbers" title="Real courses" index={6} total={7} dark />
        <Note dark>/ 06 · start · pick a course and enrol</Note>
        <div data-rule className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-center lg:gap-20">
          <div>
            <h2 id="h-numbers" className={`${DISPLAY} text-[clamp(44px,6vw,88px)] leading-[0.95]`}>
              Real courses<span className="text-brand">.</span> Real projects<span className="text-brand">.</span>
            </h2>
            <p className={`${DISPLAY} mt-8 text-[clamp(80px,12vw,180px)] leading-none`}>{all.length}</p>
            <p className="mt-2 max-w-[34ch] text-base leading-7 text-white/75">courses, each one ending in a CAD Desk certificate.</p>
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
                    onClick={() => open(c)}
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
                        backgroundImage: img ? `url(${webp(img)})` : undefined,
                        background: img ? undefined : (COVER_COLORS[c.category] ?? "#171717"),
                      }}
                    >
                      {!img && <span className={`${DISPLAY} text-xs leading-none text-white/90`}>{c.title.replace(/[^A-Za-z0-9 ]/g, "").split(" ").slice(0, 2).map((w) => w[0]).join("")}</span>}
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
                  className="pointer-events-none absolute left-0 top-0 z-20 h-[170px] w-[250px] rounded-xl bg-paper-card p-4 text-ink shadow-[0_16px_40px_rgba(0,0,0,.45)]"
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
                        <p className="text-xs text-ink-3">{code(dot.c.category)} · {days(dot.c)}</p>
                        <p className="mt-1.5 text-base font-medium leading-snug">{dot.c.title}</p>
                        {dot.c.certification && <p className="mt-1 text-xs text-brand">Certificate</p>}
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
            <li key={st.title} className="bg-night p-7">
              <span className="text-xs text-white/70">Step {i + 1}</span>
              <p className={`${DISPLAY} mt-8 text-3xl leading-none`}>{st.title}</p>
              <p className="mt-3 text-base leading-7 text-white/75">{st.text}</p>
            </li>
          ))}
        </ol>
      </section>

      </>)}

      {!page && (
      <section aria-labelledby="h-faq" className={`${GUTTER} border-t border-line py-16 lg:py-24`}>
        <div>
          <h2 id="h-faq" className={`${DISPLAY} text-[clamp(40px,5vw,72px)] leading-[0.95] text-ink`}>Questions, answered<span className="text-brand">.</span></h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium text-ink">
                  <h3>{f.q}</h3>
                  <span aria-hidden className="text-brand transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[760px] text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 07 Call to action + centre + footer wordmark */}
      <section className={`${GUTTER} border-t border-line pt-16 lg:pt-24`}>
        <SideLabel>Contact</SideLabel>
        <StickyBar target="h-contact" title="Ready to build your career" index={7} total={7} size="clamp(31px, 4.8vw, 72px)" />
        <Note>/ 07 · begin · say hello</Note>
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
        <div data-rule className="mt-16 grid gap-6 border-t border-line pt-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:mt-24">
          <p className={`${DISPLAY} text-4xl leading-none text-ink`}>Our centre<br />in Guwahati</p>
          <div>
            <p className="text-xl font-medium text-ink">Noonmati</p>
            <p className="mt-1 text-base text-ink-2">CAD Desk Guwahati, Noonmati, Guwahati, Assam</p>
            <a href="tel:+919127281610" className="mt-4 inline-block text-sm text-ink underline underline-offset-4">+91 91272 81610</a>
          </div>
        </div>
        <p data-rule aria-hidden className={`${DISPLAY} mt-16 select-none overflow-hidden whitespace-nowrap text-center text-[min(21.5vw,340px)] leading-[0.8] text-brand lg:mt-24`}>
          CAD DESK
        </p>
      </section>

      {/* University popover: name plus the appreciation letter (or the logo until a letter is added). Fixed so the scrolling strip's clipping can't hide it.
          It fades and rises in, glides from tile to tile, and fades the content when the university changes. */}
      <AnimatePresence>
        {peek && peekUni && (
          <motion.div
            key="uni-pop"
            aria-hidden
            initial={{ opacity: 0, y: 10, scale: 0.96, left: Math.min(Math.max(peek.x - 140, 8), window.innerWidth - 288), top: Math.min(peek.y + 12, window.innerHeight - 400) }}
            animate={{ opacity: 1, y: 0, scale: 1, left: Math.min(Math.max(peek.x - 140, 8), window.innerWidth - 288), top: Math.min(peek.y + 12, window.innerHeight - 400) }}
            exit={{ opacity: 0, y: 6, scale: 0.97, transition: { duration: 0.18, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 240, damping: 28, mass: 0.8, opacity: { duration: 0.25 } }}
            style={{ transformOrigin: "top center" }}
            className="pointer-events-none fixed z-50 w-[280px] rounded-xl border border-line bg-paper-card p-3 shadow-[0_16px_40px_rgba(0,0,0,.25)]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={peekUni.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex h-[240px] items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-raised p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={peekUni.letter ?? `/images/universities/${peekUni.id}.webp`}
                    alt=""
                    className={peekUni.letter ? "h-full w-full object-cover object-top" : `max-h-full max-w-full object-contain ${peekUni.dark ? "h-40 w-40 rounded-full bg-[#1a2a4a] p-3" : ""}`}
                  />
                </div>
                <p className={`${DISPLAY} mt-3 text-xl leading-tight text-ink`}>{peekUni.name}</p>
                <p className="mt-1 text-xs text-ink-3">
                  {peekUni.place} · {peekUni.letter ? "letter of appreciation, click to read" : "letter of appreciation coming soon"}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Your list: appears once something is added */}
      <AnimatePresence>
        {listed.length > 0 && (
          <motion.aside
            aria-label="Your list"
            initial={{ y: 88 }}
            animate={{ y: 0 }}
            exit={{ y: 88 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-xl bg-night p-2 text-white shadow-[0_12px_32px_rgba(23,23,23,.25)]"
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
            {limitNote && (
              <p role="alert" className="mb-2 rounded-md bg-white/10 px-3 py-2 text-xs text-white">
                {limitNote}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setListOpen((o) => !o)} aria-expanded={listOpen} className="flex h-10 flex-1 items-center gap-3 px-2 text-left text-sm">
                <span className="text-xs text-white/75">{String(listed.length).padStart(2, "0")}/{MAX_LIST}</span>
                {listed.length === 1 ? "course" : "courses"} in your list
                <span className="text-white/75 underline underline-offset-4">{listOpen ? "Hide" : "View"}</span>
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
    </div>
  )
}
