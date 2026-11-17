"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"

export type MosaicTile =
  | { kind: "slice"; col: string; row: string; className?: string; rounded?: string }
  | { kind: "node"; col: string; row: string; className?: string; rounded?: string; node: React.ReactNode }

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
}: {
  src: string
  fallback: string
  tiles: MosaicTile[]
  className?: string
  objectPosition?: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const cells = useRef<(HTMLDivElement | null)[]>([])
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [offs, setOffs] = useState<{ x: number; y: number }[]>([])
  const [missing, setMissing] = useState(false)

  const measure = useCallback(() => {
    const el = wrap.current
    if (!el) return
    const wr = el.getBoundingClientRect()
    setBox({ w: wr.width, h: wr.height })
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
    <div ref={wrap} className={className}>
      {tiles.map((t, i) => (
        <div
          key={i}
          ref={(el) => {
            cells.current[i] = el
          }}
          className={`relative overflow-hidden ${t.rounded ?? "rounded-2xl"} ${t.className ?? ""}`}
          style={{ gridColumn: t.col, gridRow: t.row }}
        >
          {t.kind === "slice" ? (
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
