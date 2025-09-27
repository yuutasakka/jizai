import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function SessionExpiryBanner() {
  const { isAuthenticated, sessionExpiry, refreshSession, confirmReLogin } = useAuth();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = useMemo(() => {
    if (!sessionExpiry) return null;
    return sessionExpiry.getTime() - now;
  }, [sessionExpiry, now]);

  if (!isAuthenticated || !remainingMs) return null;

  // Show banner when remaining < 10 minutes
  const TEN_MIN = 10 * 60 * 1000;
  if (remainingMs > TEN_MIN) return null;

  const mins = Math.max(0, Math.floor(remainingMs / 60000));
  const secs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-yellow-500 text-black text-sm px-4 py-2 flex items-center justify-between shadow-md">
        <div>
          セッションがまもなく期限切れになります（{mins}:{secs.toString().padStart(2,'0')}）。
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refreshSession().catch(() => {})}
            className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded"
          >
            更新
          </button>
          <button
            onClick={() => confirmReLogin()}
            className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded"
          >
            再ログイン
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiryBanner;
