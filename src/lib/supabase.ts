// Limit environment logging to development only
if ((import.meta as any)?.env?.DEV) {
  console.log('[Supabase] Direct env check at load:', {
    directUrl: import.meta.env.VITE_SUPABASE_URL,
    directKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30),
    hasImportMeta: !!import.meta,
    hasEnv: !!import.meta.env,
  });
}
import { createClient } from '@supabase/supabase-js'

// Supabase client for the frontend (Vite)
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// デバッグ: 環境変数の状態を確認（開発時のみ）
if ((import.meta as any)?.env?.DEV) {
  console.log('[Supabase] Environment check:', {
    hasUrl: !!url,
    urlPrefix: url?.substring(0, 30),
    hasAnonKey: !!anon,
    keyPrefix: anon?.substring(0, 30)
  });
}

if (!url || !anon) {
  // Warn but don't crash — allows local UI development without auth
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
