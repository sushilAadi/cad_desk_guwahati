"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
import { preload } from "react-dom"
import InkFlowCarousel from "@/components/ui/ink-flow-carousel"

export type MosaicTile =
  | { kind: "slice"; col: string; row: string; className?: string; rounded?: string }
  | { kind: "node"; col: string; row: string; className?: string; rounded?: string; node: React.ReactNode }

type Rect = { x: number; y: number; w: number; h: number }

/** Corner radii in px from a tile's rounded-* classes (2xl is 16px, none is 0). Default is all four 16px. */
function radii(cls = "rounded-2xl") {
  const r = { tl: 16, tr: 16, bl: 16, br: 16 }
  for (const t of cls.split(/\s+/)) {
    const m = /^rounded-(tl|tr|bl|br)-(none|2xl)$/.exec(t)
    if (m) r[m[1] as keyof typeof r] = m[2] === "none" ? 0 : 16
    else if (t === "rounded-none") r.tl = r.tr = r.bl = r.br = 0
  }
  return r
}

/** One SVG path made of every slice tile's rounded rectangle, so the ink canvas shows only through the tiles. */
function tilesPath(tiles: MosaicTile[], rects: Rect[]) {
  return tiles
    .map((t, i) => {
      const q = rects[i]
      if (t.kind !== "slice" || !q) return ""
      const { tl, tr, bl, br } = radii(t.rounded)
      const { x, y, w, h } = q
      return `M${x + tl} ${y}H${x + w - tr}A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}V${y + h - br}A${br} ${br} 0 0 1 ${x + w - br} ${y + h}H${x + bl}A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}V${y + tl}A${tl} ${tl} 0 0 1 ${x + tl} ${y}Z`
    })
    .join("")
}

/**
 * One large image shown through a grid of rounded tiles, so the gaps cut it into pieces
 * but it still reads as a single picture. Every "slice" tile holds the same full-size image,
 * shifted so it lines up with the tile's place in the grid. "node" tiles are ordinary content.
 *
 * `src` is tried first; if it is missing the `fallback` is used.
 */
export function MaskedMosaic({
  src,
  fallback,
  tiles,
  className = "",
  objectPosition = "center",
  images,
  focusY = 0.5,
  autoplay = 0,
  onSlide,
}: {
  src: string
  fallback: string
  tiles: MosaicTile[]
  className?: string
  objectPosition?: string
  /** Two or more images: they pour into each other like ink, behind the same tiles. */
  images?: string[]
  /** Which part of a cropped image stays in view: 0 top, 1 bottom (the same idea as objectPosition's y). */
  focusY?: number
  autoplay?: number
  /** Called with the new picture's index each time the picture changes. */
  onSlide?: (index: number) => void
}) {
  const ink = !!images && images.length > 1
  const wrap = useRef<HTMLDivElement>(null)
  const cells = useRef<(HTMLDivElement | null)[]>([])
  preload(images?.[0] ?? src, { as: "image", fetchPriority: "high" })
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [offs, setOffs] = useState<{ x: number; y: number }[]>([])
  const [rects, setRects] = useState<Rect[]>([])
  const [missing, setMissing] = useState(false)

  const measure = useCallback(() => {
    const el = wrap.current
    if (!el) return
    const wr = el.getBoundingClientRect()
    setBox({ w: wr.width, h: wr.height })
    setRects(
      tiles.map((_, i) => {
        const c = cells.current[i]
        if (!c) return { x: 0, y: 0, w: 0, h: 0 }
        const r = c.getBoundingClientRect()
        return { x: r.left - wr.left, y: r.top - wr.top, w: r.width, h: r.height }
      })
    )
    setOffs(
      tiles.map((_, i) => {
        const c = cells.current[i]
        if (!c) return { x: 0, y: 0 }
        const r = c.getBoundingClientRect()
        return { x: wr.left - r.left, y: wr.top - r.top }
      })
    )
  }, [tiles])

  useLayoutEffect(() => {
    // The server-rendered <img> can fail before React is listening, so look for an already-failed one.
    const failed = [...(wrap.current?.querySelectorAll("img") ?? [])].some((im) => im.complete && im.naturalWidth === 0)
    if (failed) setMissing(true)
    measure()
    const ro = new ResizeObserver(measure)
    if (wrap.current) ro.observe(wrap.current)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return (
    <div ref={wrap} className={`${ink ? "relative " : ""}${className}`}>
      {ink && (
        // The ink canvas fills the whole mosaic and is cut to the slice tiles, so the gaps, corners and text tiles are untouched.
        // The first picture sits underneath so there is never an empty frame while the canvas starts up.
        <div aria-hidden className="absolute inset-0 z-0" style={{ clipPath: `path('${tilesPath(tiles, rects)}')` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images![0]} alt="" draggable={false} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `center ${focusY * 100}%` }} />
          <InkFlowCarousel items={images!.map((u) => ({ src: u }))} height="100%" rail={false} decorative focusY={focusY} autoplay={autoplay} onIndexChange={onSlide} />
        </div>
      )}
      {tiles.map((t, i) => (
        <div
          key={i}
          ref={(el) => {
            cells.current[i] = el
          }}
          className={`relative overflow-hidden transition-colors duration-700 ${ink ? "z-10 " : ""}${ink && t.kind === "slice" ? "pointer-events-none " : ""}${t.rounded ?? "rounded-2xl"} ${t.className ?? ""}`}
          style={{ gridColumn: t.col, gridRow: t.row }}
        >
          {t.kind === "slice" ? (
            ink ? null :
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={missing ? fallback : src}
              alt=""
              draggable={false}
              onError={() => setMissing(true)}
              className="absolute max-w-none select-none"
              style={{
                width: box.w,
                height: box.h,
                left: offs[i]?.x ?? 0,
                top: offs[i]?.y ?? 0,
                objectFit: "cover",
                objectPosition,
              }}
            />
          ) : (
            t.node
          )}
        </div>
      ))}
    </div>
  )
}
