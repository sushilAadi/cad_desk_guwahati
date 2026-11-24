"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ChevronDown, MessageCircle, Search, X } from "lucide-react"
import { submitEnquiry, type EnquiryState } from "./actions"

type Course = { id: string; title: string }
type Group = { category: string; courses: Course[] }

const MAX = 10
const BATCHES = ["Morning", "Afternoon", "Evening", "Weekend", "Flexible"]
const MODES = ["Classroom", "Online", "Either"]
const HEARD = ["News Paper", "TV/Banners", "Presentations", "Social media", "Friend or relative", "Google search", "Other"]

const INPUT =
  "mt-1.5 block w-full rounded-lg border border-line bg-paper-card px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink aria-[invalid=true]:border-brand"
const LABEL = "block text-sm font-medium text-ink"
const HINT = "mt-1 text-sm text-ink-3"
const CHIP =
  "inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-sm text-ink-2 transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"

const OPTION =
  "flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 transition-colors hover:border-ink/40 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
const RADIO = "mt-1 h-4 w-4 shrink-0 accent-[#d92d20]"

// same rules as actions.ts, so people see a problem when they leave a field instead of after sending
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
function mobileOk(raw: string) {
  let d = raw.replace(/\D/g, "")
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2)
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d)
}
const CHECKS: Record<string, (v: string) => string | undefined> = {
  name: (v) => (v.trim().length < 2 ? "Please enter the student's name." : undefined),
  phone: (v) => (!mobileOk(v) ? "Enter a 10-digit mobile number, for example 98765 43210." : undefined),
  email: (v) => (v.trim() && !EMAIL.test(v.trim()) ? "That email address doesn't look right." : undefined),
}

function Section({ n, title, sub, aside, children }: { n: number; title: string; sub?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-line p-5 first-of-type:border-t-0 sm:p-8">
      <div className="mb-5 flex items-start gap-3">
        <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-medium text-paper">{n}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-7 text-ink">{title}</h2>
          {sub && <p className="text-sm text-ink-3">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Err({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-brand-deep">
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
  // set once, when the form first shows; the server rejects a form "filled" in under a few seconds
  const [openedAt] = useState(() => Date.now())

  // live errors: start from the server's, then update as people leave a field or fix it
  const [live, setLive] = useState<Record<string, string | undefined>>({})
  const [seen, setSeen] = useState(state)
  if (seen !== state) {
    setSeen(state)
    setLive({})
  }
  const err: Record<string, string | undefined> = { ...errors, ...live }
  const clear = (k: string) => err[k] && setLive((l) => ({ ...l, [k]: undefined }))
  const onBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const t = e.target as unknown as HTMLInputElement
    const check = CHECKS[t.name]
    if (check) setLive((l) => ({ ...l, [t.name]: check(t.value) }))
  }

  const all = groups.flatMap((g) => g.courses)
  const q = query.trim().toLowerCase()
  const toggle = (id: string) => (clear("course"), setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX ? p : [...p, id])))

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
    <form action={action} noValidate onBlur={onBlur} className="min-w-0 rounded-2xl border border-line bg-paper-card">
      {/* spam traps: a field people never see, and the time the form opened */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="t" value={openedAt} />

      {state && !state.ok && (state.message || Object.keys(errors).length > 0) && (
        <div role="alert" className="m-5 mb-0 rounded-lg border border-brand/30 bg-brand-soft p-4 text-sm text-brand-deep sm:m-8 sm:mb-0">
          {state.message ?? "Please fix the highlighted fields below."}
        </div>
      )}

      <Section n={1} title="What would you like to do?">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: "enquiry", label: "Ask about courses", sub: "Get fees, batch timings and seats" },
            { v: "register", label: "Register for a course", sub: "Reserve your place in a batch" },
          ].map((o) => (
            <label key={o.v} className={OPTION}>
              <input type="radio" name="type" value={o.v} defaultChecked={(v?.type ?? initialType) === o.v} className={RADIO} />
              <span>
                <span className="block text-base font-medium text-ink">{o.label}</span>
                <span className="mt-0.5 block text-sm text-ink-3">{o.sub}</span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section n={2} title="Your details">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={LABEL}>Student&apos;s name <span className="text-brand">*</span></label>
            <input id="name" name="name" type="text" autoComplete="name" defaultValue={v?.name} aria-invalid={!!err.name} aria-describedby={err.name ? "name-err" : undefined} className={INPUT} />
            <Err id="name-err">{err.name}</Err>
          </div>
          <div>
            <label htmlFor="phone" className={LABEL}>Mobile number <span className="text-brand">*</span></label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-3.5 top-[calc(0.375rem+0.8rem)] text-base text-ink-3">+91</span>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" defaultValue={v?.phone} aria-invalid={!!err.phone} aria-describedby={err.phone ? "phone-err" : "phone-hint"} className={`${INPUT} pl-12`} />
            </div>
            {err.phone ? <Err id="phone-err">{err.phone}</Err> : <p id="phone-hint" className={HINT}>We will call or WhatsApp this number.</p>}
          </div>
          <div>
            <label htmlFor="email" className={LABEL}>Email <span className="font-normal text-ink-3">(optional)</span></label>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue={v?.email} aria-invalid={!!err.email} aria-describedby={err.email ? "email-err" : undefined} className={INPUT} />
            <Err id="email-err">{err.email}</Err>
          </div>
        </div>
      </Section>

      <Section n={3} title="Pick your courses" sub={`Choose from any track, up to ${MAX}.`} aside={<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${picked.length ? "bg-brand-soft text-brand-deep" : "bg-paper-raised text-ink-3"}`}>{picked.length}/{MAX} picked</span>}>
        <fieldset aria-describedby={err.course ? "course-err" : undefined} className="min-w-0">
          <legend className="sr-only">Courses you are interested in</legend>

          {/* selections live outside the tabs so they are kept, and submitted, whichever track is showing */}
          {picked.map((id) => (
            <input key={id} type="hidden" name="course" value={id} />
          ))}

          {picked.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2" aria-label="Selected courses">
              {picked.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => toggle(id)} className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft py-1.5 pl-3.5 pr-2.5 text-sm text-brand-deep transition-colors hover:border-brand" aria-label={`Remove ${all.find((c) => c.id === id)?.title}`}>
                    {all.find((c) => c.id === id)?.title} <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={`overflow-hidden rounded-xl border ${err.course ? "border-brand" : "border-line"}`}>
            <div className="relative border-b border-line">
              <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={1.75} />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all courses" aria-label="Search all courses" className="block w-full bg-transparent py-3 pl-10 pr-3.5 text-base text-ink outline-none placeholder:text-ink-3" />
            </div>

            {!q && (
              <div role="tablist" aria-label="Course tracks" className="flex gap-1 overflow-x-auto border-b border-line px-2 [scrollbar-width:none]">
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
                      className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors ${on ? "border-brand font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
                    >
                      {g.category}
                      {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-medium text-white">{n}</span>}
                    </button>
                  )
                })}
              </div>
            )}

            <div id="course-panel" role={q ? undefined : "tabpanel"} aria-labelledby={q ? undefined : `tab-${groups.findIndex((g) => g.category === tab)}`} className="max-h-[360px] overflow-y-auto p-2">
              {(q ? groups : groups.filter((g) => g.category === tab)).map((g) => {
                const shown = g.courses.filter((c) => !q || c.title.toLowerCase().includes(q))
                if (!shown.length) return null
                return (
                  <div key={g.category} className="mb-3 last:mb-0">
                    {q && <p className="px-2 pb-1 pt-2 text-xs font-medium text-ink-3">{g.category}</p>}
                    <div className="grid gap-1 sm:grid-cols-2">
                      {shown.map((c) => {
                        const on = picked.includes(c.id)
                        const full = !on && picked.length >= MAX
                        return (
                          <label key={c.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${on ? "bg-brand-soft text-ink" : full ? "cursor-not-allowed text-ink-3 opacity-60" : "cursor-pointer text-ink-2 hover:bg-paper-raised"}`}>
                            <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(c.id)} className="h-4 w-4 shrink-0 accent-[#d92d20]" />
                            {c.title}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {q && !groups.some((g) => g.courses.some((c) => c.title.toLowerCase().includes(q))) && <p className="p-3 text-sm text-ink-3">No course matches &quot;{query}&quot;. Try another word, or clear the search.</p>}
            </div>
          </div>
          {picked.length >= MAX && <p className={HINT}>You have picked the maximum of {MAX} courses. Remove one to pick another.</p>}
          <Err id="course-err">{err.course}</Err>
        </fieldset>
      </Section>

      <details className="group border-t border-line" open={!!(v && (v.qualification || v.batch || v.mode || v.message || v.heard.length))}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:px-8 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-base font-medium text-ink">A bit more about you <span className="font-normal text-ink-3">(optional)</span></span>
            <span className="mt-0.5 block text-sm text-ink-3">Studies, batch, how you want to learn. Helps us call you with the right answers.</span>
          </span>
          <ChevronDown aria-hidden className="h-5 w-5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" strokeWidth={1.75} />
        </summary>
        <div className="space-y-6 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="qualification" className={LABEL}>Current studies or qualification</label>
              <input id="qualification" name="qualification" type="text" placeholder="e.g. 12th pass, B.Tech Civil" defaultValue={v?.qualification} className={INPUT} />
            </div>
            <div>
              <label htmlFor="batch" className={LABEL}>Preferred batch</label>
              <select id="batch" name="batch" defaultValue={v?.batch ?? ""} className={INPUT}>
                <option value="">No preference</option>
                {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={LABEL}>How would you like to learn?</legend>
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
            <label htmlFor="message" className={LABEL}>Anything else we should know?</label>
            <textarea id="message" name="message" rows={3} maxLength={500} placeholder="Preferred timings, questions about a course…" defaultValue={v?.message} className={INPUT} />
          </div>

          <fieldset>
            <legend className={LABEL}>How did you hear about us?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {HEARD.map((h) => (
                <label key={h} className={CHIP}>
                  <input type="checkbox" name="heard" value={h} defaultChecked={v?.heard.includes(h)} className="sr-only" />
                  {h}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="rounded-b-2xl border-t border-line bg-paper-raised p-5 sm:px-8 sm:py-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink-2">
          <input type="checkbox" name="consent" onChange={(e) => e.target.checked && clear("consent")} aria-invalid={!!err.consent} aria-describedby={err.consent ? "consent-err" : undefined} className="mt-1 h-4 w-4 shrink-0 accent-[#d92d20]" />
          <span>
            I agree that CAD Desk Guwahati may contact me about this enquiry. See the <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
          </span>
        </label>
        <Err id="consent-err">{err.consent}</Err>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-8 text-base font-medium text-white transition-colors hover:bg-[#b42318] disabled:opacity-60 sm:w-auto">
            {pending ? "Sending…" : <>Send my details <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2} /></>}
          </button>
          <p className="text-center text-sm text-ink-3 sm:text-right">We reply within one working day.</p>
        </div>
      </div>
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
