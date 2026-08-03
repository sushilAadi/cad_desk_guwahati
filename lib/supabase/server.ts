import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client for the admin panel.
 *
 * Uses the service role key, which bypasses Row Level Security. The
 * `enquiries` and `student_registrations` tables only grant SELECT to the
 * `authenticated` role (see Supabase policies) — there is no admin auth
 * flow in this app yet, so the admin dashboard reads through the service
 * role key instead. NEVER import this file from a Client Component, and
 * never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
let client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  if (!client) {
    client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  return client
}
