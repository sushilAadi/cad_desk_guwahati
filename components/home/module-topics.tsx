"use client"

import { useId, useState } from "react"
import { CheckCircle2, ChevronDown } from "lucide-react"

/** A module's topic list: the first few are always shown, the rest open below them, and the toggle always sits at the bottom. */
export function ModuleTopics({ topics, visible = 3 }: { topics: string[]; visible?: number }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const hidden = topics.length - visible
  const shown = open ? topics : topics.slice(0, visible)

  return (
    <>
      <ul id={id} className="mt-4 space-y-3 border-t border-line pt-4 text-sm text-ink-2">
        {shown.map((t) => (
          <li key={t} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={1.5} />
            {t}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="mt-3 flex items-center gap-1 self-start text-sm font-medium text-brand outline-none focus-visible:underline"
        >
          {open ? "Show less" : `Show ${hidden} more`}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} />
        </button>
      )}
    </>
  )
}
