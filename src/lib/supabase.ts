import { createClient } from '@supabase/supabase-js'

// Supabase client for the frontend (Vite)
const url = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined
const anon = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anon) {
  // Warn but don’t crash — allows local UI development without auth
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Auth will be disabled.')
}

export const supabase = url && anon
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        storageKey: 'jizai.supabase.auth',
      },
    })
  : (null as any)

export type { Session, User } from '@supabase/supabase-js'

