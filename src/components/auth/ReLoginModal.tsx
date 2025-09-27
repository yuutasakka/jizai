import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function ReLoginModal() {
  const { reLoginPromptVisible, confirmReLogin, cancelReLogin } = useAuth();
  if (!reLoginPromptVisible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={cancelReLogin} />
      <div className="relative bg-white text-black rounded-xl shadow-2xl w-[90%] max-w-sm p-6">
        <h2 className="text-lg font-bold mb-2">セッションが無効です</h2>
        <p className="text-sm text-gray-700 mb-4">再ログインが必要です。続行するにはログインしてください。</p>
        <div className="flex justify-end gap-2">
          <button onClick={cancelReLogin} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">後で</button>
          <button onClick={confirmReLogin} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">ログインへ</button>
        </div>
      </div>
    </div>
  );
}

export default ReLoginModal;

