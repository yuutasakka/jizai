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

export default function ResizeEditorPage() {
  const q = useQuery();
  const srcParam = q.get('src') || '';
  const titleParam = q.get('title') || '';

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SizePreset>(sizePresets[0]);
  const [dpi, setDpi] = useState<number>(72);

  const targetPx = React.useMemo(() => {
    const w = Math.round(selected.mmW * dpi / 25.4);
    const h = Math.round(selected.mmH * dpi / 25.4);
    return { w, h };
  }, [selected, dpi]);

  // 実効dpi（元画像のピクセル量から算出）: 最小辺ベース
  const effectiveDpi = React.useMemo(() => {
    if (!img) return null;
    const inchW = selected.mmW / 25.4;
    const inchH = selected.mmH / 25.4;
    const dpiW = img.width / inchW;
    const dpiH = img.height / inchH;
    return Math.floor(Math.min(dpiW, dpiH));
  }, [img, selected]);
  // trimming removed; only resize-to-fit

  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image from query param or from session storage
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

  // compute fit rectangle (contain) for target size
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
    // preview sizing (contain)
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
    // background (letterbox) as transparent; keep as default
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const fit = computeFit(pw, ph);
    ctx.drawImage(img, 0, 0, img.width, img.height, fit.dx, fit.dy, fit.dw, fit.dh);
  };

  useEffect(() => { drawOriginal(); drawPreview(); }, [img, selected, dpi]);

  const download = async () => {
    if (!img) return;
    const cnv = document.createElement('canvas');
    cnv.width = targetPx.w; cnv.height = targetPx.h;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // fill background white then draw fitted image (no trimming)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetPx.w, targetPx.h);
    // Clamp scale to avoid upscaling beyond original
    const s = Math.min(targetPx.w / img.width, targetPx.h / img.height, 1);
    const dw = Math.round(img.width * s);
    const dh = Math.round(img.height * s);
    const dx = Math.round((targetPx.w - dw) / 2);
    const dy = Math.round((targetPx.h - dh) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    const blob: Blob = await new Promise((resolve) => cnv.toBlob(b => resolve(b as Blob), 'image/jpeg', 0.95));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const base = (titleParam || 'resized').replace(/[^\w\-]+/g, '_').slice(0, 40);
    a.href = url; a.download = `${base}_${selected.mm}mm_${dpi}dpi.jpg`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const prepareForPrint = async () => {
    if (!img) return;
    const cnv = document.createElement('canvas');
    cnv.width = targetPx.w; cnv.height = targetPx.h;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // 印刷用に白背景を設定
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetPx.w, targetPx.h);
    // フィットした画像を描画
    const s = Math.min(targetPx.w / img.width, targetPx.h / img.height, 1);
    const dw = Math.round(img.width * s);
    const dh = Math.round(img.height * s);
    const dx = Math.round((targetPx.w - dw) / 2);
    const dy = Math.round((targetPx.h - dh) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);

    // 印刷用の設定で新しいウィンドウを開く
    const dataUrl = cnv.toDataURL('image/jpeg', 0.95);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>印刷用 - ${titleParam || '画像'}</title>
          <style>
            @media print {
              @page {
                size: ${selected.mm.split('×')[0]}mm ${selected.mm.split('×')[1]}mm;
                margin: 0;
              }
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              img {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
            }
            body {
              margin: 0;
              padding: 20px;
              text-align: center;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: 100%;
              height: auto;
              border: 1px solid #ddd;
            }
            .print-info {
              margin: 20px 0;
              color: #666;
            }
            .print-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px;
            }
            .print-button:hover {
              background: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="print-info">
            <h2>${titleParam || '画像'}</h2>
            <p>サイズ: ${selected.mm} mm (${targetPx.w} × ${targetPx.h} px, ${dpi} DPI)</p>
            <button class="print-button" onclick="window.print()">印刷する</button>
            <button class="print-button" onclick="window.close()">閉じる</button>
          </div>
          <img src="${dataUrl}" alt="印刷用画像" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // trimming UI removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-5">
      <div className="max-w-[1200px] mx-auto rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-500/60 text-white">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">サイズ変更</h1>
          <button onClick={() => navigate('/')} className="text-sm text-white/90 underline">戻る</button>
        </div>
        <p className="text-white/80 mb-6">印刷に適したプリセットでサイズ変更し、ダウンロード/印刷ができます。</p>

        {!img && (
          <div className="border-2 border-dashed border-gray-400 rounded-xl p-10 text-center mb-8 text-white">
            <p className="text-5xl mb-4">📸</p>
            <p className="font-semibold text-white/90 mb-4">画像のURLが指定されていません。マイファイルから「サイズ変更」で遷移してください。</p>
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
                      <button key={p.key} onClick={() => setSelected(p)} className={`text-left p-3 rounded-lg border transition active:scale-95 ${selected.key === p.key ? 'bg-[#2a5298] text-white border-[#2a5298]' : 'bg-transparent border-gray-400 text-white hover:bg-white/10'}`}>
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
                    <button key={p.key} onClick={() => setSelected(p)} className={`text-left p-3 rounded-lg border transition active:scale-95 ${selected.key === p.key ? 'bg-[#2a5298] text-white border-[#2a5298]' : 'bg-transparent border-gray-400 text-white hover:bg:white/10'}`}>
                      <span className="block font-bold text-white">{p.label}</span>
                      <span className="text-sm opacity-90">{p.mm} mm</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DPI 設定 */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">🖨️ DPI 設定</h3>
              <div className="flex items-center gap-2">
                {[72,150,300].map(v => (
                  <button key={v} onClick={() => setDpi(v)} className={`px-4 py-2 rounded border transition active:scale-95 ${dpi === v ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-white border-gray-400 hover:bg-white/10'}`}>
                    {v} dpi
                  </button>
                ))}
                <span className="text-white/70 text-sm ml-2">（ベースは 72dpi）</span>
              </div>
              {/* 印刷最適度インジケータ */}
              {effectiveDpi !== null && (
                <div className="mt-4 space-y-3">
                  {/* 全体的な印刷最適度 */}
                  <div className="p-4 rounded-lg border" style={{
                    backgroundColor: effectiveDpi >= 300 ? 'rgba(34, 197, 94, 0.15)' :
                                   effectiveDpi >= 200 ? 'rgba(234, 179, 8, 0.15)' :
                                   effectiveDpi >= 150 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    borderColor: effectiveDpi >= 300 ? 'rgb(34, 197, 94)' :
                               effectiveDpi >= 200 ? 'rgb(234, 179, 8)' :
                               effectiveDpi >= 150 ? 'rgb(249, 115, 22)' : 'rgb(239, 68, 68)'
                  }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg">
                        {effectiveDpi >= 300 ? '🖨️✨' :
                         effectiveDpi >= 200 ? '🖨️✅' :
                         effectiveDpi >= 150 ? '🖨️⚠️' : '🖨️❌'}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-base">
                          {effectiveDpi >= 300 ? '印刷に最適' :
                           effectiveDpi >= 200 ? '印刷品質良好' :
                           effectiveDpi >= 150 ? '印刷品質注意' : '印刷品質不適'}
                        </h4>
                        <p className="text-white/80 text-sm">
                          実効解像度 {effectiveDpi} dpi（{selected.mm}サイズ）
                        </p>
                      </div>
                    </div>

                    {/* 詳細説明 */}
                    <div className="text-white/90 text-sm">
                      {effectiveDpi >= 300 ? (
                        <>
                          <p className="font-semibold text-green-200 mb-1">📈 高品質印刷に最適な解像度です</p>
                          <p>• プロフェッショナル品質での印刷が可能</p>
                          <p>• 細部まで鮮明に再現されます</p>
                        </>
                      ) : effectiveDpi >= 200 ? (
                        <>
                          <p className="font-semibold text-yellow-200 mb-1">📊 一般的な印刷に適した解像度です</p>
                          <p>• 家庭用プリンターでの印刷に適しています</p>
                          <p>• 通常の用途では十分な品質です</p>
                        </>
                      ) : effectiveDpi >= 150 ? (
                        <>
                          <p className="font-semibold text-orange-200 mb-1">📉 印刷品質に注意が必要です</p>
                          <p>• 遠目から見る用途では使用可能</p>
                          <p>• 近距離では粗さが目立つ可能性があります</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-red-200 mb-1">⚠️ 印刷には推奨されません</p>
                          <p>• 画質が粗く、印刷に適していません</p>
                          <p>• より高解像度の元画像をご利用ください</p>
                        </>
                      )}
                    </div>

                    {/* 品質レベルバー */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-xs text-white/70 mb-1">
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

                  {/* DPI別の詳細情報 */}
                  <div className="text-sm text-white/70 bg-white/5 p-3 rounded-lg border border-white/20">
                    <p className="font-semibold text-white/90 mb-1">💡 設定情報</p>
                    <p>出力DPI: {dpi} | 実効DPI: {effectiveDpi} | サイズ: {selected.mm}</p>
                    <p>出力解像度: {targetPx.w} × {targetPx.h} px</p>
                  </div>
                </div>
              )}
            </div>

            {/* トリミング機能は削除 */}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-white font-semibold mb-2">元の写真</h4>
                <canvas ref={originalCanvasRef} className="w-full max-w-full border-2 border-gray-400 rounded" />
                <p className="text-white/90 text-sm mt-2">既存のサイズ: {img.width}px*{img.height}px（ベース 72dpi）</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">サイズ変更プレビュー</h4>
                <canvas ref={previewCanvasRef} className="w-full max-w-full border-2 border-gray-400 rounded" />
                <p className="text-white/90 text-sm mt-2">サイズ変更後: {targetPx.w}px*{targetPx.h}px</p>
                <p className="text-white/70 text-xs mt-1">{selected.mm} mm（{dpi}dpi） / 実効 {effectiveDpi ?? '-'} dpi</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={download} className="px-5 py-3 rounded bg-[#2a5298] text-white font-bold hover:bg-[#1e3c72] active:scale-95 transition">ダウンロード</button>
              <button onClick={prepareForPrint} className="px-5 py-3 rounded bg-green-600 text-white font-bold hover:bg-green-700 active:scale-95 transition">印刷用にする</button>
              <button onClick={() => { setDpi(300); prepareForPrint(); }} className="px-5 py-3 rounded bg-white/10 border border-white/30 text-white font-bold hover:bg-white/20 active:scale-95 transition">高画質</button>
              <button onClick={() => navigate('/')} className="px-5 py-3 rounded border border-gray-400 text-white font-bold hover:bg-white/10 active:scale-95 transition">戻る</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
