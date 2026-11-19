// /courses/<slug>: derived from the title, so no DB change. Same title in two tracks would collide; the id suffix is only added then.
export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

export function courseSlugs<T extends { id: string; title: string }>(courses: T[]) {
  const seen = new Map<string, number>()
  for (const c of courses) seen.set(slugify(c.title), (seen.get(slugify(c.title)) ?? 0) + 1)
  return new Map(
    courses.map((c) => {
      const base = slugify(c.title)
      return [c.id, (seen.get(base) ?? 0) > 1 ? `${base}-${c.id.slice(0, 6)}` : base] as const
    })
  )
}
