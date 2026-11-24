"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

/** Switches light/dark. Light is the default; the choice is remembered in this browser (see the script in app/layout.tsx). */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read after hydration to avoid a server/client mismatch
    setDark(document.documentElement.classList.contains("dark"))
  }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem("theme", next ? "dark" : "light")
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-2 transition-colors hover:bg-paper-raised hover:text-ink"
    >
      {dark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
    </button>
  )
}
