import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Environment variables (set in .env)
// ─────────────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

// ─────────────────────────────────────────────────────────────
// Supabase client (singleton)
// ─────────────────────────────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─────────────────────────────────────────────────────────────
// TypeScript domain types
// ─────────────────────────────────────────────────────────────

/** Row in public.profiles */
export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  theme: string | null
  language: string | null
  watch_history: any[] | null
  watch_progress: Record<string, number> | null
  watchlist: any[] | null
  updated_at: string | null
}

/** Row in public.comments (with joined profile data) */
export interface Comment {
  id: string
  movie_id: string
  user_id: string
  content: string
  created_at: string
  profiles: Pick<Profile, 'username' | 'avatar_url'> | null
}

/** Row in public.allowed_emails */
export interface AllowedEmail {
  email: string
}
