"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Plays the crosshair skeleton once on every <section> as it scrolls into view, on every public page.
// Purely client-side over server-rendered HTML, so crawlers get full content.
// Perf: above-the-fold and busy sections are skipped, and the library is a separate chunk
// loaded only on the first scroll, so it adds nothing to first load or blocking time.
export function CrosshairSections() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    const runs: { cancel(): void }[] = []
    let io: IntersectionObserver | undefined
    let dead = false
    // Course detail pages play on load over everything in <main> (banner, side panel, modules).
    // ponytail: costs LCP on these pages since the banner is covered at first paint; drop the flag if Core Web Vitals slip.
    const eager = /^\/courses\/[^/]+$/.test(pathname)
    const start = () =>
      import("@/lib/crosshair-skeleton").then(({ crosshair }) => {
        if (dead) return
        // Skip anything visible at load (protects LCP) and busy sections like logo walls (protects TBT).
        // ponytail: 150-element cap is a heuristic; raise it if a wanted section gets skipped.
        // Each section is set up only when it nears the viewport, so nothing runs during page load.
        io = new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (!e.isIntersecting) return
              io!.unobserve(e.target)
              runs.push(crosshair(e.target as HTMLElement, { auto: true, speed: e.target.closest("[aria-labelledby=h-toc]") ? 3.5 : 2.5 }))
            }),
          { rootMargin: "50% 0px" },
        )
        // Positions are page-absolute (setup runs after the first scroll). A busy section animates its smaller blocks instead.
        const small = (el: Element) => el.querySelectorAll("*").length <= 150
        const below = (el: Element) => eager || el.getBoundingClientRect().top + scrollY > innerHeight
        // Busy blocks are split until each piece is small enough (e.g. course grid -> each card).
        const pick = (el: Element): Element[] => (small(el) ? [el] : [...el.children].flatMap(pick))
        document.querySelectorAll(eager ? "main > *" : "section").forEach((sec) => {
          pick(sec).filter((el) => el.querySelectorAll("*").length >= 3 && below(el)).forEach((el) => io!.observe(el))
        })
      })
    if (eager) start()
    else addEventListener("scroll", start, { once: true, passive: true })
    return () => {
      dead = true
      removeEventListener("scroll", start)
      io?.disconnect()
      runs.forEach((r) => r.cancel())
    }
  }, [pathname])
  return null
}
