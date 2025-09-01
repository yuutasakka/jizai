"use client";
import Image from "next/image";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow importing JSON from public via relative path
import examples from "@/../public/examples/examples.json";

export function ExampleGallery({ usecase }: { usecase: "human" | "pet" | "seizen" | "photo" }) {
  const items = (examples as any[]).filter((x) => x.usecase === usecase);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((ex) => (
        <article key={ex.id} className="rounded-xl border border-[color:var(--color-jz-border)] p-4 bg-[color:var(--color-jz-card)]">
          <h3 className="text-base font-semibold text-[color:var(--color-jz-text-primary)]">{ex.title}</h3>
          <p className="text-sm text-[color:var(--color-jz-text-secondary)]">{ex.desc}</p>

          {/* Before/After */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <figure>
              <Image src={ex.before} alt={`${ex.usecase}の${ex.title}（Before）`} width={600} height={400} className="rounded-md object-cover" />
              <figcaption className="text-xs text-[color:var(--color-jz-text-tertiary)]">Before</figcaption>
            </figure>
            <figure>
              <Image src={ex.after} alt={`${ex.usecase}の${ex.title}（After）`} width={600} height={400} className="rounded-md object-cover" />
              <figcaption className="text-xs text-[color:var(--color-jz-text-tertiary)]">After</figcaption>
            </figure>
          </div>

          {/* 日本語入力例 */}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-[color:var(--color-jz-text-primary)]">日本語入力の例</summary>
            <pre className="mt-1 whitespace-pre-wrap text-xs text-[color:var(--color-jz-text-secondary)]">{ex.prompt_ja}</pre>
          </details>

          {/* この例で試す */}
          <div className="mt-4 flex gap-3 items-center">
            <a
              href={`/?usecase=${ex.usecase}&preset=${encodeURIComponent(ex.id)}&engine=${ex.engine_profile}`}
              className="inline-flex items-center rounded-md bg-[color:var(--color-jz-accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              この例で試す
            </a>
            <span className="text-xs text-[color:var(--color-jz-text-tertiary)]">※編集画面に設定が反映されます</span>
          </div>
        </article>
      ))}
    </div>
  );
}

