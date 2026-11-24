"use client"

import { useEffect, useState } from "react"
import { SquareDashed } from "lucide-react"

/** Shows or hides the page border lines and hatched strips. The choice is remembered in this browser. */
export function FrameToggle() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    try {
      const off = localStorage.getItem("frame") === "off"
      document.documentElement.dataset.frame = off ? "off" : "on"
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read after hydration to avoid a server/client mismatch
      setOn(!off)
    } catch {}
  }, [])
  const toggle = () => {
    const next = !on
    setOn(next)
    document.documentElement.dataset.frame = next ? "on" : "off"
    try {
      localStorage.setItem("frame", next ? "on" : "off")
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Hide page borders and strips" : "Show page borders and strips"}
      title={on ? "Hide borders" : "Show borders"}
      className={`hidden h-9 w-9 items-center justify-center rounded-lg border transition-colors md:inline-flex ${on ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:bg-paper-raised"}`}
    >
      <SquareDashed className="h-4 w-4" strokeWidth={1.5} />
    </button>
  )
}
