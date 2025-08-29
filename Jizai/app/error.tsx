"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-3">エラーが発生しました</h1>
      <p className="text-[color:var(--color-jz-text-secondary)] mb-6">少し待ってから再度お試しください。</p>
      <div className="flex gap-4 justify-center">
        <button onClick={() => reset()} className="underline">もう一度試す</button>
        <a className="underline" href="/">ホームへ</a>
      </div>
    </main>
  );
}

