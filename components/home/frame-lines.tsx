"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Full-width hairlines at the top and bottom edge of every element marked `data-rule`,
 * the way tailwindcss.com rules off each block. Positions come from layout (offsetTop), not
 * from transforms, so entrance animations don't throw the lines off.
 */
export function FrameLines() {
  const ref = useRef<HTMLDivElement>(null)
  const [ys, setYs] = useState<number[]>([])
  const [bands, setBands] = useState<{ top: number; height: number }[]>([])

  useEffect(() => {
    const root = ref.current?.parentElement
    if (!root) return
    let raf = 0

    const top = (el: HTMLElement) => {
      let y = 0
      let n: HTMLElement | null = el
      while (n && n !== root) {
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
      }
      return y
    }

    const measure = () => {
      const set = new Set<number>()
      root.querySelectorAll<HTMLElement>("[data-rule]").forEach((el) => {
        if (el.offsetParent === null || el.offsetHeight === 0) return // hidden
        const t = top(el)
        set.add(Math.round(t))
        set.add(Math.round(t + el.offsetHeight))
      })
      // merge lines closer than 3px so touching blocks share one rule
      const sorted = [...set].sort((a, b) => a - b)
      const merged: number[] = []
      for (const y of sorted) if (!merged.length || y - merged[merged.length - 1] > 3) merged.push(y)
      const b = [...root.querySelectorAll<HTMLElement>("[data-band]")].map((el) => ({ top: Math.round(top(el)), height: el.offsetHeight }))
      setBands((prev) => (prev.length === b.length && prev.every((v, i) => v.top === b[i].top && v.height === b[i].height) ? prev : b))
      setYs((prev) => (prev.length === merged.length && prev.every((v, i) => v === merged[i]) ? prev : merged))
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    measure()
    const ro = new ResizeObserver(schedule)
    ro.observe(root)
    const mo = new MutationObserver(schedule) // tab switches, accordion, list changes
    mo.observe(root, { childList: true, subtree: true })
    window.addEventListener("resize", schedule)
    const t = setInterval(schedule, 600) // catches late layout (fonts, images, animations)
    const stop = setTimeout(() => clearInterval(t), 6000)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", schedule)
      clearInterval(t)
      clearTimeout(stop)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden md:block">
      {/* dark bands are painted here so the lines can sit on top of them yet still behind the content */}
      {bands.map((b) => (
        <span key={b.top} className="absolute inset-x-0 bg-ink" style={{ top: b.top, height: b.height }} />
      ))}
      {ys.map((y) => (
        <span key={y} className="frame-deco absolute inset-x-0 h-px bg-[rgba(115,115,115,0.3)]" style={{ top: y }} />
      ))}
    </div>
  )
}

/** The hatched strips that hug both sides of the 1440px content column (hidden by the navbar toggle). */
export function FrameStrips() {
  return (
    <div aria-hidden className="frame-deco pointer-events-none absolute inset-0 z-0 hidden lg:block">
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
  )
}
