// Loads courses_v2.json into public.courses_v2 and checks it against the old table. Never writes to `courses`.
//   node supabase/courses_v2/load.cjs --check     only verify (table exists? row count? every field filled?)
//   node supabase/courses_v2/load.cjs             upsert the 66 rows, then verify
const fs = require("fs")
const path = require("path")
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => {
    const i = l.indexOf("=")
    return [l.slice(0, i), l.slice(i + 1)]
  })
)
const { createClient } = require("@supabase/supabase-js")
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, "courses_v2.json"), "utf8"))

async function verify() {
  const { data: v2, error } = await sb.from("courses_v2").select("*")
  if (error) return console.log("courses_v2 not readable:", error.message, "\n-> run 01_schema.sql in the Supabase SQL editor first.")
  const { data: old } = await sb.from("courses").select("id, title, category")
  const ids = new Set(v2.map((r) => r.id))
  const missing = old.filter((o) => !ids.has(o.id))
  const empty = (r, k) => r[k] == null || r[k] === "" || (Array.isArray(r[k]) && !r[k].length)
  const bad = []
  for (const r of v2) for (const k of ["title", "caption", "description", "category", "table_of_contents", "duration"]) if (empty(r, k)) bad.push(`${r.title}: ${k} is empty`)
  const stillCad = v2.filter((r) => /caddeskindia\.com/i.test(`${r.image} ${r.banner}`)).length
  const scrapedStudents = v2.filter((r) => r.students).length
  console.log(`courses_v2 rows: ${v2.length} (old table: ${old.length})`)
  console.log(`old courses missing from v2: ${missing.length}`, missing.map((m) => m.title).join(", "))
  console.log(`empty required fields: ${bad.length}`, bad.slice(0, 10).join(" | "))
  console.log(`rows still pointing at caddeskindia.com images: ${stillCad}`)
  console.log(`rows carrying the scraped student count: ${scrapedStudents}`)
  console.log(v2.length === old.length && !missing.length && !bad.length && !stillCad && !scrapedStudents ? "RESULT: OK" : "RESULT: needs attention")
}

;(async () => {
  if (process.argv.includes("--check")) return verify()
  const { error: probe } = await sb.from("courses_v2").select("id").limit(1)
  if (probe) return console.log("courses_v2 not found:", probe.message, "\n-> run 01_schema.sql in the Supabase SQL editor first.")
  for (let i = 0; i < rows.length; i += 11) {
    const { error } = await sb.from("courses_v2").upsert(rows.slice(i, i + 11), { onConflict: "id" })
    if (error) return console.log("upsert failed:", error.message)
  }
  console.log(`upserted ${rows.length} rows into courses_v2`)
  await verify()
})()
