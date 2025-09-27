import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true
    const finalize = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.getSession()

          if (error) {
            console.error('OAuth callback error:', error);
            if (mounted) {
              setError(error.message);
            }
            return;
          }

          if (data.session) {
            console.log('OAuth authentication successful:', data.session.user?.email);
          }
        }
      } catch (err) {
        console.error('Auth callback processing error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
      } finally {
        if (!mounted) return

        // エラーがある場合はログインページに戻る
        if (error) {
          setTimeout(() => window.location.replace('/login'), 3000);
        } else {
          // 成功時はメインページに戻る
          const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
          window.location.replace(redirectTo);
        }
      }
    }
    finalize()
    return () => { mounted = false }
  }, [error])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[color:var(--color-jz-text-primary)] mb-2">認証エラー</h2>
          <p className="text-[color:var(--color-jz-text-secondary)] mb-4">{error}</p>
          <p className="text-sm text-[color:var(--color-jz-text-secondary)]">3秒後にログインページに戻ります...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-[color:var(--color-jz-text-primary)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--color-jz-primary)] mx-auto mb-4"></div>
        <p>サインイン処理中です…</p>
      </div>
    </div>
  )
}

