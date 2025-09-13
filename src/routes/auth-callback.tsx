import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    let mounted = true
    const finalize = async () => {
      try {
        if (supabase) {
          await supabase.auth.getSession() // ensure session is hydrated
        }
      } finally {
        if (!mounted) return
        // Return to app root
        window.location.replace('/')
      }
    }
    finalize()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-[color:var(--color-jz-text-primary)]">
        <p>サインイン処理中です…</p>
      </div>
    </div>
  )
}

