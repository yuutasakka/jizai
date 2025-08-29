export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-3">ページが見つかりません</h1>
      <p className="text-[color:var(--color-jz-text-secondary)] mb-6">
        入力したURLが正しくないか、ページが移動しました。
      </p>
      <div className="flex flex-col items-center gap-3">
        <a className="underline" href="/">ホームに戻る</a>
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <a className="underline" href="/memorial/human">遺影写真（人）</a>
          <a className="underline" href="/memorial/pet">ペット遺影</a>
          <a className="underline" href="/memorial/seizen">生前撮影</a>
          <a className="underline" href="/memorial/photo">メモリアルフォト</a>
        </div>
      </div>
    </main>
  );
}

