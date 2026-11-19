"use client"

import { useEffect, useRef } from "react"

type Ribbon = { color: string; dir: 1 | -1; phase: number; zSign: 1 | -1 }

const RIBBONS: Ribbon[] = [
  { color: "#171717", dir: -1, phase: Math.PI, zSign: -1 },
  { color: "#d92d20", dir: 1, phase: 0, zSign: 1 },
]
const STEP = 4 // px per slice
const FRAME_MS = 16 // every display frame, so the motion is smooth
const TWIST = 0.48 // radians of twist (~27 deg): about 35% of the earlier 1.35, so the ribbon never flips over

/**
 * Two satin ribbons that wave and twist across the page, showing their back where they turn over, and
 * weaving over and under each other. Drawn on a canvas by slicing a text strip along a moving curve,
 * so it needs no 3D library. Pauses off-screen and holds still for reduced-motion.
 */
export function RibbonTwist({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let W = 0
    let H = 0
    let dpr = 1
    let strips: HTMLCanvasElement[] = []
    let stripW = 0
    let ribbonH = 0
    let raf = 0
    let lastDraw = 0
    const gradients = new Map<string, CanvasGradient>()
    let visible = true
    const t0 = performance.now()
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    const buildStrips = () => {
      const family = getComputedStyle(canvas).fontFamily
      const size = ribbonH * 0.46
      const unit = `${text.toUpperCase()}   ✦   `
      const m = document.createElement("canvas").getContext("2d")!
      m.font = `700 ${size}px ${family}`
      m.letterSpacing = `${size * 0.04}px`
      const unitW = m.measureText(unit).width || 400
      const n = Math.max(1, Math.ceil((W * 1.4) / unitW))
      stripW = Math.round(unitW * n)
      const pitch = stripW / n // evenly spaced, so the strip wraps with no overlap or gap at the seam
      strips = RIBBONS.map((r) => {
        const c = document.createElement("canvas")
        c.width = stripW
        c.height = Math.ceil(ribbonH)
        const g = c.getContext("2d")!
        g.fillStyle = r.color
        g.fillRect(0, 0, c.width, c.height)
        g.fillStyle = "#ffffff"
        g.font = `700 ${size}px ${family}`
        g.textBaseline = "middle"
        g.letterSpacing = `${size * 0.04}px`
        for (let i = 0; i < n; i++) g.fillText(unit, i * pitch, c.height / 2 + size * 0.04)
        return c
      })
    }

    const size = () => {
      const r = canvas.getBoundingClientRect()
      W = Math.round(r.width)
      H = Math.round(r.height)
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = W * dpr
      canvas.height = H * dpr
      gradients.clear()
      ribbonH = (W < 640 ? 0.3 : 0.27) * H * dpr
      buildStrips()
    }

    const draw = (now: number) => {
      const t = reduced ? 0 : (now - t0) / 1000
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const A = H * 0.21 * dpr
      const lam = Math.max(1100, W * 1.15) * dpr // long wavelength: only about one crossing is on screen at a time
      const mid = (H / 2) * dpr
      const dx = STEP * dpr

      const yOf = (ri: number, x: number) => {
        const r = RIBBONS[ri]
        const k = (x / lam) * Math.PI * 2
        return mid + A * Math.sin(k + r.phase + t * 0.5) + A * 0.1 * Math.sin(k * 2 + r.phase * 2 + t * 0.35) // both waves travel the same way, so the gap between them slides instead of closing
      }
      const thetaOf = (ri: number, x: number) => {
        const k = (x / (lam * 0.8)) * Math.PI * 2
        return TWIST * Math.sin(k - t * 0.5 + ri * 1.7)
      }

      // where the two centre lines cross; the ribbons alternate which one passes over, like a weave
      const xs: number[] = []
      for (let x = -dx * 4; x <= canvas.width + dx * 4; x += dx) xs.push(x)
      const crossings: number[] = []
      let prev = yOf(0, xs[0]) - yOf(1, xs[0])
      for (const x of xs) {
        const d = yOf(0, x) - yOf(1, x)
        if (d * prev < 0) crossings.push(x)
        prev = d
      }
      const frontAt = (x: number) => {
        if (!crossings.length) return 1
        let best = 0
        for (let i = 1; i < crossings.length; i++) if (Math.abs(crossings[i] - x) < Math.abs(crossings[best] - x)) best = i
        return best % 2 === 0 ? 1 : 0 // ribbon index that is in front around this crossing
      }

      // the ribbon behind is drawn first, whole; the front one is drawn last. The owner only changes midway between
      // crossings, where the ribbons are far apart, so there is no visible cut.
      const back: { ri: number; x: number; front: boolean }[] = []
      const front: { ri: number; x: number; front: boolean }[] = []
      for (const x of xs) {
        const f = frontAt(x)
        for (let ri = 0; ri < RIBBONS.length; ri++) (ri === f ? front : back).push({ ri, x, front: ri === f })
      }
      const order = back.concat(front)

      for (const sl of order) {
        const r = RIBBONS[sl.ri]
        const y0 = yOf(sl.ri, sl.x)
        const y1 = yOf(sl.ri, sl.x + dx)
        const ang = Math.atan2(y1 - y0, dx)
        const len = Math.hypot(dx, y1 - y0)
        const th = thetaOf(sl.ri, sl.x)
        const half = (ribbonH / 2) * Math.cos(th) // never flips: the twist is slight
        const scroll = t * 55 * dpr * r.dir
        const sx = (((sl.x + scroll) % stripW) + stripW) % stripW

        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.translate(sl.x, y0)
        ctx.rotate(ang)
        ctx.drawImage(strips[sl.ri], sx, 0, Math.min(len + 1, stripW - sx), ribbonH, 0, -half, len + 1, 2 * half)
        // satin: a bright streak on the edge facing the light, deepening toward the other edge, plus a thin edge line
        const s = Math.sin(th)
        // gradients are relative to the slice, so one per (sheen, height) bucket is reused by every slice
        const key = `${Math.round(s * 8)}|${Math.round(half / 3)}`
        let g = gradients.get(key)
        if (!g) {
          g = ctx.createLinearGradient(0, -half, 0, half)
          g.addColorStop(0, `rgba(255,255,255,${0.16 + 0.55 * Math.max(s, 0)})`)
          g.addColorStop(0.5, "rgba(255,255,255,0)")
          g.addColorStop(1, `rgba(0,0,0,${0.22 + 0.5 * Math.max(-s, 0)})`)
          gradients.set(key, g)
        }
        ctx.fillStyle = g
        ctx.fillRect(0, -half, len + 1, 2 * half)
      }
    }

    const loop = (now: number) => {
      if (visible && now - lastDraw >= FRAME_MS) {
        lastDraw = now
        draw(now)
      }
      raf = requestAnimationFrame(loop)
    }

    size()
    document.fonts?.ready.then(() => {
      buildStrips()
      draw(performance.now())
    })
    const ro = new ResizeObserver(() => {
      size()
      draw(performance.now())
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    if (!reduced) raf = requestAnimationFrame(loop)
    else draw(performance.now())

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [text])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={text}
      className={className}
      style={{ fontFamily: "var(--font-display)", display: "block", width: "100%" }}
    />
  )
}
