import React, { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../router';

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
  { key: '4cut', label: '四つ切りサイズ', mm: '254×305', mmW: 254, mmH: 305, group: '祭壇用遺影写真' },
  { key: 'a4', label: 'A4サイズ', mm: '210×297', mmW: 210, mmH: 297, group: '祭壇用遺影写真' },
  { key: 'l', label: 'L判サイズ', mm: '89×127', mmW: 89, mmH: 127, group: '焼香台用遺影写真' },
  { key: 'scab', label: '小キャビネ', mm: '120×165', mmW: 120, mmH: 165, group: '焼香台用遺影写真' },
  { key: '2l', label: '2L', mm: '127×178', mmW: 127, mmH: 178, group: '焼香台用遺影写真' },
  { key: 'a3', label: 'A3ポスター', mm: '297×420', mmW: 297, mmH: 420, group: 'ポスター' },
  { key: 'a2', label: 'A2ポスター', mm: '420×594', mmW: 420, mmH: 594, group: 'ポスター' },
  { key: 'a1', label: 'A1ポスター', mm: '594×841', mmW: 594, mmH: 841, group: 'ポスター' },
];

export default function PrintPreparePage() {
  const q = useQuery();
  const srcParam = q.get('src') || '';
  const titleParam = q.get('title') || '';
  const dpiParam = parseInt(q.get('dpi') || '', 10);
  const presetKey = q.get('preset') || '';

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SizePreset>(() => sizePresets.find(p => p.key === presetKey) || sizePresets[0]);
  const [dpi, setDpi] = useState<number>(Number.isFinite(dpiParam) ? dpiParam : 300);

  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      let src = srcParam;
      if (!src) {
        try { src = sessionStorage.getItem('create_image_file') || ''; } catch {}
      }
      if (!src) return;
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => setImg(i);
      i.onerror = () => setError('画像の読み込みに失敗しました');
      i.src = src;
    }
    load();
  }, [srcParam]);

  const targetPx = useMemo(() => {
    const w = Math.round(selected.mmW * dpi / 25.4);
    const h = Math.round(selected.mmH * dpi / 25.4);
    return { w, h };
  }, [selected, dpi]);

  const effectiveDpi = useMemo(() => {
    if (!img) return null;
    const inchW = selected.mmW / 25.4;
    const inchH = selected.mmH / 25.4;
    const dpiW = img.width / inchW;
    const dpiH = img.height / inchH;
    return Math.floor(Math.min(dpiW, dpiH));
  }, [img, selected]);

  const drawOriginal = () => {
    if (!img || !originalCanvasRef.current) return;
    const max = 450;
    let w = img.width, h = img.height;
    if (w > max || h > max) {
      const s = Math.min(max / w, max / h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    const c = originalCanvasRef.current;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  };

  const computeFit = (targetW: number, targetH: number) => {
    if (!img) return { dx: 0, dy: 0, dw: 0, dh: 0 };
    const s = Math.min(targetW / img.width, targetH / img.height);
    const dw = Math.round(img.width * s);
    const dh = Math.round(img.height * s);
    const dx = Math.round((targetW - dw) / 2);
    const dy = Math.round((targetH - dh) / 2);
    return { dx, dy, dw, dh };
  };

  const drawPreview = () => {
    if (!img || !previewCanvasRef.current) return;
    const max = 450;
    let pw = targetPx.w, ph = targetPx.h;
    if (pw > max || ph > max) {
      const s = Math.min(max / pw, max / ph);
      pw = Math.round(pw * s); ph = Math.round(ph * s);
    }
    const c = previewCanvasRef.current;
    c.width = pw; c.height = ph;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, pw, ph);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const fit = computeFit(pw, ph);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pw, ph);
    ctx.drawImage(img, 0, 0, img.width, img.height, fit.dx, fit.dy, fit.dw, fit.dh);
  };

  useEffect(() => { drawOriginal(); drawPreview(); }, [img, selected, dpi]);

  const downloadPrint = async () => {
    if (!img) return;
    const cnv = document.createElement('canvas');
    cnv.width = targetPx.w; cnv.height = targetPx.h;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetPx.w, targetPx.h);
    const s = Math.min(targetPx.w / img.width, targetPx.h / img.height, 1);
    const dw = Math.round(img.width * s);
    const dh = Math.round(img.height * s);
    const dx = Math.round((targetPx.w - dw) / 2);
    const dy = Math.round((targetPx.h - dh) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    const blob: Blob = await new Promise((resolve) => cnv.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.95));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const base = (titleParam || 'print').replace(/[^\w\-]+/g, '_').slice(0, 40);
    a.href = url; a.download = `${base}_${selected.mm}mm_${dpi}dpi.jpg`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPrintPreview = async () => {
    if (!img) return;
    const cnv = document.createElement('canvas');
    cnv.width = targetPx.w; cnv.height = targetPx.h;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetPx.w, targetPx.h);
    const s = Math.min(targetPx.w / img.width, targetPx.h / img.height, 1);
    const dw = Math.round(img.width * s);
    const dh = Math.round(img.height * s);
    const dx = Math.round((targetPx.w - dw) / 2);
    const dy = Math.round((targetPx.h - dh) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    const dataUrl = cnv.toDataURL('image/jpeg', 0.95);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>印刷プレビュー</title><style>@media print{@page{size:auto;margin:0}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{width:${selected.mm.split('×')[0]}mm;height:${selected.mm.split('×')[1]}mm;object-fit:contain}}</style></head><body><img src="${dataUrl}" alt="preview" /></body></html>`);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-5">
      <div className="max-w-[1200px] mx-auto rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-500/60 text-white">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">印刷用にする</h1>
          <button onClick={() => navigate('/')} className="text-sm text-white/90 underline">戻る</button>
        </div>
        <p className="text-white/80 mb-6">印刷に適したプリセットとDPIを選択し、印刷用の画像を出力します。</p>

        {!img && (
          <div className="border-2 border-dashed border-gray-400 rounded-xl p-10 text-center mb-8 text-white">
            <p className="text-5xl mb-4">📸</p>
            <p className="font-semibold text-white/90 mb-4">画像のURLが指定されていません。マイファイルから「サイズ変更」→「印刷用にする」で遷移してください。</p>
          </div>
        )}

        {img && (
          <>
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">📏 サイズ選択</h3>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <div className="text-white font-bold mb-2">祭壇用遺影写真</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {sizePresets.filter(p => p.group === '祭壇用遺影写真').map(p => (
                      <button key={p.key} onClick={() => setSelected(p)} className={`text-left p-3 rounded-lg border transition active:scale-95 ${selected.key === p.key ? 'bg-[#2a5298] text-white border-[#2a5298]' : 'bg-transparent border-gray-400 text-white hover:bg-white/10'}`}>
                        <span className="block font-bold text-white">{p.label}</span>
                        <span className="text-sm opacity-90">{p.mm} mm</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white font-bold mb-2">焼香台用遺影写真</div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {sizePresets.filter(p => p.group === '焼香台用遺影写真').map(p => (
                      <button key={p.key} onClick={() => setSelected(p)} className={`text-left p-3 rounded-lg border transition active:scale-95 ${selected.key === p.key ? 'bg-[#2a5298] text白 border-[#2a5298]' : 'bg-transparent border-gray-400 text-white hover:bg-white/10'}`}>
                        <span className="block font-bold text-white">{p.label}</span>
                        <span className="text-sm opacity-90">{p.mm} mm</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-white font-bold mb-2">ポスター</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {sizePresets.filter(p => p.group === 'ポスター').map(p => (
                    <button key={p.key} onClick={() => setSelected(p)} className={`text-left p-3 rounded-lg border transition active:scale-95 ${selected.key === p.key ? 'bg-[#2a5298] text-white border-[#2a5298]' : 'bg-transparent border-gray-400 text-white hover:bg-white/10'}`}>
                      <span className="block font-bold text-white">{p.label}</span>
                      <span className="text-sm opacity-90">{p.mm} mm</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">🖨️ DPI 設定</h3>
              <div className="flex items-center gap-2">
                {[72,150,300].map(v => (
                  <button key={v} onClick={() => setDpi(v)} className={`px-4 py-2 rounded border transition active:scale-95 ${dpi === v ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-white border-gray-400 hover:bg-white/10'}`}>
                    {v} dpi
                  </button>
                ))}
                <span className="text-white/70 text-sm ml-2">（用途に合わせて選択）</span>
              </div>
              {effectiveDpi !== null && (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  {dpi === 72 ? (
                    effectiveDpi >= 200 ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/30 border border-green-400 text-white">
                        <span>✅ 72dpiでも十分な印刷品質</span>
                        <span className="opacity-80">（実効 {effectiveDpi} dpi）</span>
                      </span>
                    ) : effectiveDpi >= 150 ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-600/30 border border-amber-400 text-white">
                        <span>⚠️ 用途によっては粗く見える可能性</span>
                        <span className="opacity-80">（実効 {effectiveDpi} dpi）</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-400 text-white">
                        <span>❗ 72dpiは推奨されません</span>
                        <span className="opacity-80">（実効 {effectiveDpi} dpi）</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-white">
                      <span>実効解像度の目安</span>
                      <span className="opacity-80">（実効 {effectiveDpi} dpi）</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-white font-semibold mb-2">元の写真</h4>
                <canvas ref={originalCanvasRef} className="w-full max-w-full border-2 border-gray-400 rounded" />
                <p className="text-white/90 text-sm mt-2">既存のサイズ: {img?.width}px*{img?.height}px（ベース 72dpi）</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">印刷プレビュー</h4>
                <canvas ref={previewCanvasRef} className="w-full max-w-full border-2 border-gray-400 rounded" />
                <p className="text-white/90 text-sm mt-2">サイズ変更後: {targetPx.w}px*{targetPx.h}px</p>
                <p className="text-white/70 text-xs mt-1">{selected.mm} mm（{dpi}dpi） / 実効 {effectiveDpi ?? '-'} dpi</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={downloadPrint} className="px-5 py-3 rounded bg-[#2a5298] text-white font-bold hover:bg-[#1e3c72] active:scale-95 transition">印刷用JPEGをダウンロード</button>
              <button onClick={openPrintPreview} className="px-5 py-3 rounded bg-green-600 text-white font-bold hover:bg-green-700 active:scale-95 transition">印刷プレビュー</button>
              <button onClick={() => navigate('/')} className="px-5 py-3 rounded border border-gray-400 text-white font-bold hover:bg-white/10 active:scale-95 transition">戻る</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

