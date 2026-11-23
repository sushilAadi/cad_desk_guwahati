"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

// useLayoutEffect warns during SSR; fall back to useEffect there so the component still renders on the server.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * Word-by-word scroll reveal: each word starts dim and brightens to full opacity as the paragraph
 * scrolls up through the viewport. Ported from the uraniam_fitness project's ScrollRevealText: one
 * rAF-throttled scroll listener writes each word's opacity from the scroll progress, no animation library.
 */
export function ScrollRevealText({
  text,
  className = "",
  end = 0.25,
  dim = "before:text-ink/15",
}: {
  text: string
  className?: string
  /** Colour of the not-yet-revealed words (a `before:` text class). */
  dim?: string
  /** Viewport fraction where the reveal completes; raise it for text that sits low on screen. */
  end?: number
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = text.split(" ")

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const spans = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"))
    let ticking = false

    const update = () => {
      ticking = false
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // The reveal begins once the block's top crosses 90% of the viewport height and finishes at `end`.
      const start = vh * 0.9
      const finish = vh * end
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - finish)))

      spans.forEach((span, i) => {
        const wordStart = i / spans.length
        const wordEnd = wordStart + 1 / spans.length
        span.style.opacity = String(Math.min(1, Math.max(0, (progress - wordStart) / (wordEnd - wordStart))))
      })
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [end])

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        // The dim copy is a ::before pseudo-element, not a text node: purely visual, so screen readers
        // and contrast checkers only see the real word layered on top of it.
        <span
          key={`${i}-${word}`}
          data-dim={word}
          className={`relative mr-[0.3em] inline-block before:absolute before:inset-0 before:content-[attr(data-dim)] ${dim}`}
        >
          <span data-word className="relative opacity-100">
            {word}
          </span>
        </span>
      ))}
    </p>
  )
}
