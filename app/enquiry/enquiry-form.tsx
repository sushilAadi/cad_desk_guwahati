"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { CheckCircle2, MessageCircle, Search } from "lucide-react"
import { submitEnquiry, type EnquiryState } from "./actions"

type Course = { id: string; title: string }
type Group = { category: string; courses: Course[] }

const MAX = 10
const BATCHES = ["Morning", "Afternoon", "Evening", "Weekend", "Flexible"]
const MODES = ["Classroom", "Online", "Either"]
const HEARD = ["News Paper", "TV/Banners", "Presentations", "Social media", "Friend or relative", "Google search", "Other"]
const FILLED_BY = [
  { v: "student", label: "The student" },
  { v: "parent", label: "A parent or guardian" },
  { v: "other", label: "Someone else" },
]

const INPUT =
  "mt-1.5 block w-full rounded-lg border border-line bg-white px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink aria-[invalid=true]:border-brand"
const LABEL = "block text-sm font-medium text-ink"
const HINT = "mt-1 text-sm text-ink-3"
const CHIP =
  "inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-sm text-ink-2 transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"

function Err({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-[#b42318]">
      {children}
    </p>
  ) : null
}

function EnquiryFormInner({
  groups,
  initialType,
  initialCourses,
  phoneDisplay,
  whatsappHref,
  onAnother,
}: {
  groups: Group[]
  initialType: "enquiry" | "register"
  initialCourses: string[]
  phoneDisplay: string
  whatsappHref: string
  onAnother: () => void
}) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, null)
  const v = state && !state.ok ? state.values : null
  const errors = state && !state.ok ? state.errors : {}

  const [picked, setPicked] = useState<string[]>(initialCourses)
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState(() => groups.find((g) => g.courses.some((c) => initialCourses.includes(c.id)))?.category ?? groups[0]?.category ?? "")
  const [filledBy, setFilledBy] = useState(v?.filledBy ?? "student")
  // set once, when the form first shows; the server rejects a form "filled" in under a few seconds
  const [openedAt] = useState(() => Date.now())

  const all = groups.flatMap((g) => g.courses)
  const q = query.trim().toLowerCase()
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX ? p : [...p, id]))

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-paper-raised p-8 lg:p-12">
        <CheckCircle2 className="h-10 w-10 text-brand" strokeWidth={1.5} />
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(32px,4vw,56px)] uppercase leading-[0.95] text-ink">
          Thank you, {state.name}<span className="text-brand">.</span>
        </h2>
        <p className="mt-4 max-w-[52ch] text-base leading-7 text-ink-2">
          We have your details. Our team will contact you on +91 {state.phone.slice(0, 5)} {state.phone.slice(5)} to talk about batches, fees and seats.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={onAnother} className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-[#b42318]">
            Send another enquiry
          </button>
          <Link href="/courses" className="inline-flex h-11 items-center rounded-full border border-ink/25 px-6 text-sm font-medium text-ink transition-colors hover:border-ink">
            Browse courses
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/25 px-6 text-sm font-medium text-ink transition-colors hover:border-ink">
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} /> Chat on WhatsApp
          </a>
        </div>
        <p className="mt-6 text-sm text-ink-3">Need us sooner? Call {phoneDisplay}.</p>
      </div>
    )
  }

  return (
    <form action={action} noValidate className="space-y-9">
      {/* spam traps: a field people never see, and the time the form opened */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="t" value={openedAt} />

      {state && !state.ok && (state.message || Object.keys(errors).length > 0) && (
        <div role="alert" className="rounded-lg border border-[#b42318]/30 bg-[#fdecea] p-4 text-sm text-[#b42318]">
          {state.message ?? "Please fix the highlighted fields below."}
        </div>
      )}

      <fieldset>
        <legend className={LABEL}>I want to</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { v: "enquiry", label: "Ask about courses" },
            { v: "register", label: "Register for a course" },
          ].map((o) => (
            <label key={o.v} className={CHIP}>
              <input type="radio" name="type" value={o.v} defaultChecked={(v?.type ?? initialType) === o.v} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={LABEL}>This form is being filled by</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FILLED_BY.map((o) => (
            <label key={o.v} className={CHIP}>
              <input type="radio" name="filledBy" value={o.v} checked={filledBy === o.v} onChange={() => setFilledBy(o.v)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
        <p className={HINT}>If the student is under 18, a parent or guardian should fill this in.</p>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={LABEL}>Student&apos;s name <span className="text-brand">*</span></label>
          <input id="name" name="name" type="text" autoComplete="name" defaultValue={v?.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} className={INPUT} />
          <Err id="name-err">{errors.name}</Err>
        </div>
        {filledBy !== "student" && (
          <div>
            <label htmlFor="contactName" className={LABEL}>Your name</label>
            <input id="contactName" name="contactName" type="text" defaultValue={v?.contactName} className={INPUT} />
          </div>
        )}
        <div>
          <label htmlFor="phone" className={LABEL}>Mobile number <span className="text-brand">*</span></label>
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-3.5 top-[calc(0.375rem+0.8rem)] text-base text-ink-3">+91</span>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" defaultValue={v?.phone} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : "phone-hint"} className={`${INPUT} pl-12`} />
          </div>
          {errors.phone ? <Err id="phone-err">{errors.phone}</Err> : <p id="phone-hint" className={HINT}>We will call or WhatsApp this number.</p>}
        </div>
        <div>
          <label htmlFor="email" className={LABEL}>Email <span className="font-normal text-ink-3">(optional)</span></label>
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={v?.email} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} className={INPUT} />
          <Err id="email-err">{errors.email}</Err>
        </div>
      </div>

      <fieldset aria-describedby={errors.course ? "course-err" : undefined}>
        <legend className={LABEL}>Courses you are interested in <span className="text-brand">*</span> <span className="font-normal text-ink-3">(pick from any track, up to {MAX})</span></legend>

        {/* selections live outside the tabs so they are kept, and submitted, whichever track is showing */}
        {picked.map((id) => (
          <input key={id} type="hidden" name="course" value={id} />
        ))}

        {picked.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected courses">
            {picked.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => toggle(id)} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-sm text-white" aria-label={`Remove ${all.find((c) => c.id === id)?.title}`}>
                  {all.find((c) => c.id === id)?.title} <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative mt-3">
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.75} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all courses" aria-label="Search all courses" className={`${INPUT} mt-0 pl-10`} />
        </div>

        {!q && (
          <div role="tablist" aria-label="Course tracks" className="mt-3 flex flex-wrap gap-2">
            {groups.map((g, i) => {
              const n = g.courses.filter((c) => picked.includes(c.id)).length
              const on = g.category === tab
              return (
                <button
                  key={g.category}
                  id={`tab-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="course-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setTab(g.category)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
                    e.preventDefault()
                    const next = groups[(i + (e.key === "ArrowRight" ? 1 : groups.length - 1)) % groups.length]
                    setTab(next.category)
                    document.getElementById(`tab-${groups.indexOf(next)}`)?.focus()
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${on ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink"}`}
                >
                  {g.category}
                  {n > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-medium ${on ? "bg-white text-ink" : "bg-brand text-white"}`}>{n}</span>}
                </button>
              )
            })}
          </div>
        )}

        <div id="course-panel" role={q ? undefined : "tabpanel"} aria-labelledby={q ? undefined : `tab-${groups.findIndex((g) => g.category === tab)}`} className="mt-3 rounded-lg border border-line p-4">
          {(q ? groups : groups.filter((g) => g.category === tab)).map((g) => {
            const shown = g.courses.filter((c) => !q || c.title.toLowerCase().includes(q))
            if (!shown.length) return null
            return (
              <div key={g.category} className="mb-4 last:mb-0">
                {q && <p className="mb-2 text-sm font-medium text-ink">{g.category}</p>}
                <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {shown.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-ink-2">
                      <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-[#d92d20]" />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          {q && !groups.some((g) => g.courses.some((c) => c.title.toLowerCase().includes(q))) && <p className="text-sm text-ink-3">No course matches &quot;{query}&quot;. Try another word, or clear the search.</p>}
        </div>
        {picked.length >= MAX && <p className={HINT}>You have picked the maximum of {MAX} courses.</p>}
        <Err id="course-err">{errors.course}</Err>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="qualification" className={LABEL}>Current studies or qualification <span className="font-normal text-ink-3">(optional)</span></label>
          <input id="qualification" name="qualification" type="text" placeholder="e.g. 12th pass, B.Tech Civil" defaultValue={v?.qualification} className={INPUT} />
        </div>
        <div>
          <label htmlFor="batch" className={LABEL}>Preferred batch <span className="font-normal text-ink-3">(optional)</span></label>
          <select id="batch" name="batch" defaultValue={v?.batch ?? ""} className={INPUT}>
            <option value="">No preference</option>
            {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={LABEL}>How would you like to learn? <span className="font-normal text-ink-3">(optional)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <label key={m} className={CHIP}>
              <input type="radio" name="mode" value={m} defaultChecked={v?.mode === m} className="sr-only" />
              {m === "Either" ? "Either is fine" : m}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className={LABEL}>Anything else we should know? <span className="font-normal text-ink-3">(optional)</span></label>
        <textarea id="message" name="message" rows={4} maxLength={500} defaultValue={v?.message} className={INPUT} />
      </div>

      <fieldset>
        <legend className={LABEL}>How did you hear about us? <span className="font-normal text-ink-3">(optional)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {HEARD.map((h) => (
            <label key={h} className={CHIP}>
              <input type="checkbox" name="heard" value={h} defaultChecked={v?.heard.includes(h)} className="sr-only" />
              {h}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink-2">
          <input type="checkbox" name="consent" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-err" : undefined} className="mt-1 h-4 w-4 shrink-0 accent-[#d92d20]" />
          <span>
            I agree that CAD Desk Guwahati may contact me about this enquiry. See the <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
          </span>
        </label>
        <Err id="consent-err">{errors.consent}</Err>
      </div>

      <button type="submit" disabled={pending} className="inline-flex h-12 items-center rounded-full bg-brand px-8 text-base font-medium text-white transition-colors hover:bg-[#b42318] disabled:opacity-60">
        {pending ? "Sending…" : "Send my details"}
      </button>
    </form>
  )
}

/**
 * The form, plus a way back to it. After a send the thank-you card replaces the form; "Send another enquiry" gives
 * a brand-new, empty form (a new key makes React start the form's state again, including the ticked courses).
 */
export function EnquiryForm(props: Omit<Parameters<typeof EnquiryFormInner>[0], "onAnother">) {
  const [round, setRound] = useState(0)
  return (
    <EnquiryFormInner
      key={round}
      {...props}
      onAnother={() => {
        setRound((r) => r + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }}
    />
  )
}
