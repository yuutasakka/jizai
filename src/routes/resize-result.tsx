import React, { useEffect, useRef, useState } from 'react';
import { navigate } from '../router';
import { supabase } from '../lib/supabase';

function useQuery() {
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search));
  useEffect(() => {
    const onPop = () => setQ(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return q;
}

type SizePreset = { key: string; label: string; mm: string; mmW: number; mmH: number; group: string };
const sizePresets: Array<SizePreset> = [
  // 祭壇用
  { key: '4cut', label: '四つ切りサイズ', mm: '254×305', mmW: 254, mmH: 305, group: '祭壇用遺影写真' },
  { key: 'a4', label: 'A4サイズ', mm: '210×297', mmW: 210, mmH: 297, group: '祭壇用遺影写真' },
  // 焼香台用
  { key: 'l', label: 'L判サイズ', mm: '89×127', mmW: 89, mmH: 127, group: '焼香台用遺影写真' },
  { key: 'scab', label: '小キャビネ', mm: '120×165', mmW: 120, mmH: 165, group: '焼香台用遺影写真' },
  { key: '2l', label: '2L', mm: '127×178', mmW: 127, mmH: 178, group: '焼香台用遺影写真' },
  // ポスター（拡充）
  { key: 'a3', label: 'A3ポスター', mm: '297×420', mmW: 297, mmH: 420, group: 'ポスター' },
  { key: 'a2', label: 'A2ポスター', mm: '420×594', mmW: 420, mmH: 594, group: 'ポスター' },
  { key: 'a1', label: 'A1ポスター', mm: '594×841', mmW: 594, mmH: 841, group: 'ポスター' },
];

export default function ResizeResultPage() {
  const q = useQuery();
  const srcParam = q.get('src') || '';
  const titleParam = q.get('title') || '';
  const presetKey = q.get('preset') || '4cut';
  const dpi = parseInt(q.get('dpi') || '72', 10);
  const effectiveDpi = parseInt(q.get('effectiveDpi') || '0', 10);
  const targetW = parseInt(q.get('targetW') || '0', 10);
  const targetH = parseInt(q.get('targetH') || '0', 10);

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const preset = sizePresets.find(p => p.key === presetKey) || sizePresets[0];

  // Load image
  useEffect(() => {
    let src = srcParam;
    if (!src) {
      try { src = sessionStorage.getItem('create_image_file') || ''; } catch {}
    }
    if (!src) return;
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.onerror = () => console.error('画像の読み込みに失敗しました');
    i.src = src;
  }, [srcParam]);

  // Draw preview
  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const max = 400;
    let pw = targetW, ph = targetH;
    if (pw > max || ph > max) {
      const s = Math.min(max / pw, max / ph);
      pw = Math.round(pw * s); ph = Math.round(ph * s);
    }
    const c = canvasRef.current;
    c.width = pw; c.height = ph;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, pw, ph);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pw, ph);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate fit
    const s = Math.min(pw / img.width, ph / img.height);
    const dw = Math.round(img.width * s);
    const dh = Math.round(img.height * s);
    const dx = Math.round((pw - dw) / 2);
    const dy = Math.round((ph - dh) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
  }, [img, targetW, targetH]);

  const downloadStandard = async () => {
    if (!img || downloading) return;
    setDownloading(true);
    try {
      const cnv = document.createElement('canvas');
      cnv.width = targetW; cnv.height = targetH;
      const ctx = cnv.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      const s = Math.min(targetW / img.width, targetH / img.height, 1);
      const dw = Math.round(img.width * s);
      const dh = Math.round(img.height * s);
      const dx = Math.round((targetW - dw) / 2);
      const dy = Math.round((targetH - dh) / 2);
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);

      const blob: Blob = await new Promise((resolve) =>
        cnv.toBlob(b => resolve(b as Blob), 'image/png')
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = (titleParam || 'resized').replace(/[^\w\-]+/g, '_').slice(0, 40);
      a.href = url;
      a.download = `${base}_${preset.mm}mm_${dpi}dpi.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('ダウンロードに失敗しました');
    } finally {
      setDownloading(false);
    }
  };

  async function sha256Hex(str: string): Promise<string> {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const downloadHighQuality = async () => {
    if (!img || downloading) return;
    setDownloading(true);
    try {
      // Generate stable image key (ignore querystring)
      let keyBase = srcParam || (img.src || '');
      try { const u = new URL(keyBase); keyBase = `${u.origin}${u.pathname}`; } catch {}
      const imageKey = await sha256Hex(keyBase);

      // Try to attach auth or device id
      let headers: Record<string,string> = { 'Content-Type': 'application/json' };
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
      try {
        // optional: include device id if present
        const devId = localStorage.getItem('jizai-device-id');
        if (devId) headers['x-device-id'] = devId;
      } catch {}

      const resp = await fetch('/v1/upscale', {
        method: 'POST',
        headers,
        body: JSON.stringify({ src_url: srcParam || img.src, factor: 3, image_key: imageKey })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          alert('高画質ダウンロードの上限（3回）に達しました');
        } else {
          alert(`高画質ダウンロードに失敗しました: ${err.message || resp.statusText}`);
        }
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = (titleParam || 'resized').replace(/[^\w\-]+/g, '_').slice(0, 40);
      a.href = url;
      a.download = `${base}_${preset.mm}mm_${dpi}dpi_hq.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('高画質ダウンロードに失敗しました');
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-5">
      <div className="max-w-[800px] mx-auto rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-500/60 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">サイズ変更完了</h1>
          <button onClick={() => navigate('/tools/resize')} className="text-sm text-white/90 underline">戻る</button>
        </div>

        {!img ? (
          <div className="border-2 border-dashed border-gray-400 rounded-xl p-10 text-center mb-8 text-white">
            <p className="text-5xl mb-4">📸</p>
            <p className="font-semibold text-white/90 mb-4">画像を読み込み中...</p>
          </div>
        ) : (
          <>
            {/* 印刷最適度表示 */}
            <div className="mb-6">
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: effectiveDpi >= 300 ? 'rgba(34, 197, 94, 0.15)' :
                               effectiveDpi >= 200 ? 'rgba(234, 179, 8, 0.15)' :
                               effectiveDpi >= 150 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderColor: effectiveDpi >= 300 ? 'rgb(34, 197, 94)' :
                           effectiveDpi >= 200 ? 'rgb(234, 179, 8)' :
                           effectiveDpi >= 150 ? 'rgb(249, 115, 22)' : 'rgb(239, 68, 68)'
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">
                    {effectiveDpi >= 300 ? '🖨️✨' :
                     effectiveDpi >= 200 ? '🖨️✅' :
                     effectiveDpi >= 150 ? '🖨️⚠️' : '🖨️❌'}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {effectiveDpi >= 300 ? '印刷に最適' :
                       effectiveDpi >= 200 ? '印刷品質良好' :
                       effectiveDpi >= 150 ? '印刷品質注意' : '印刷品質不適'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {preset.label} ({preset.mm}) - 実効解像度 {effectiveDpi} dpi
                    </p>
                  </div>
                </div>

                <div className="text-white/90 text-sm mb-3">
                  {effectiveDpi >= 300 ? (
                    <p className="font-semibold text-green-200">📈 プロフェッショナル品質での印刷が可能です</p>
                  ) : effectiveDpi >= 200 ? (
                    <p className="font-semibold text-yellow-200">📊 家庭用プリンターでの印刷に適しています</p>
                  ) : effectiveDpi >= 150 ? (
                    <p className="font-semibold text-orange-200">📉 遠目から見る用途では使用可能です</p>
                  ) : (
                    <p className="font-semibold text-red-200">⚠️ 画質が粗く、印刷には推奨されません</p>
                  )}
                </div>

                {/* 品質レベルバー */}
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span>印刷品質</span>
                  <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (effectiveDpi / 300) * 100)}%`,
                        backgroundColor: effectiveDpi >= 300 ? 'rgb(34, 197, 94)' :
                                       effectiveDpi >= 200 ? 'rgb(234, 179, 8)' :
                                       effectiveDpi >= 150 ? 'rgb(249, 115, 22)' : 'rgb(239, 68, 68)'
                      }}
                    />
                  </div>
                  <span>300dpi</span>
                </div>
              </div>
            </div>

            {/* プレビュー */}
            <div className="mb-6 text-center">
              <h4 className="text-white font-semibold mb-3">プレビュー</h4>
              <canvas ref={canvasRef} className="mx-auto border-2 border-gray-400 rounded bg-white" />
              <p className="text-white/90 text-sm mt-2">
                出力サイズ: {targetW} × {targetH} px ({preset.mm} mm, {dpi} dpi)
              </p>
            </div>

            {/* アクション選択 */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-center">ダウンロード方法を選択</h4>

              <div className="grid gap-3">
                {/* 標準ダウンロード */}
                <button
                  onClick={downloadStandard}
                  disabled={downloading}
                  className="p-4 rounded-lg bg-[#2a5298] hover:bg-[#1e3c72] text-white font-medium transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💾</div>
                    <div className="text-left">
                      <div className="font-bold">標準ダウンロード</div>
                      <div className="text-sm text-white/80">JPEG形式 - ファイルサイズ軽量</div>
                    </div>
                  </div>
                </button>

                {/* 高画質ダウンロード */}
                <button
                  onClick={downloadHighQuality}
                  disabled={downloading}
                  className="p-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✨</div>
                    <div className="text-left">
                      <div className="font-bold">高画質ダウンロード</div>
                      <div className="text-sm text-white/80">PNG形式 - 1.5倍解像度でより鮮明</div>
                    </div>
                  </div>
                </button>

              </div>

              {downloading && (
                <div className="text-center text-white/80 text-sm">
                  処理中...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
