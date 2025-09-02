"use client";
import Image from "next/image";
import React from "react";
import { TryEditButton } from "./TryEditButton";

export function ExampleGallery({ usecase }: { usecase: "human" | "pet" | "seizen" | "photo" }) {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    // 用途別JSONを優先、404なら全量JSONにフォールバック
    fetch(`/examples/${usecase}.json`)
      .then(async (r) => {
        if (r.ok) {
          return r.json();
        }
        // フォールバック: 全量JSONから該当用途をフィルタ
        const fallbackResponse = await fetch('/examples/examples.json');
        const allExamples = await fallbackResponse.json();
        return (allExamples as any[]).filter((x) => x.usecase === usecase);
      })
      .then((examples) => setItems(examples))
      .catch(() => setItems([]));
  }, [usecase]);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((ex) => (
        <article key={ex.id} className="rounded-xl border border-[color:var(--color-jz-border)] p-4 bg-[color:var(--color-jz-card)]">
          <h3 className="text-base font-semibold text-[color:var(--color-jz-text-primary)]">{ex.title}</h3>
          <p className="text-sm text-[color:var(--color-jz-text-secondary)]">{ex.desc}</p>

          {/* Before/After */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <figure>
              <Image src={ex.before} alt={`${usecase}の${ex.title}（Before）`} width={600} height={400} className="rounded-md object-cover" />
              <figcaption className="text-xs text-[color:var(--color-jz-text-tertiary)]">Before</figcaption>
            </figure>
            <figure>
              <Image src={ex.after} alt={`${usecase}の${ex.title}（After）`} width={600} height={400} className="rounded-md object-cover" />
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
              href={`/?usecase=${usecase}&preset=${encodeURIComponent(ex.id)}&engine=${ex.engine_profile}`}
              className="inline-flex items-center rounded-md bg-[color:var(--color-jz-accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              この例で試す
            </a>
            <TryEditButton 
              sampleImageUrl={ex.before} 
              usecase={usecase} 
              preset={ex.id}
              className="px-3 py-2 text-sm border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)]"
            >
              試し編集
            </TryEditButton>
            <span className="text-xs text-[color:var(--color-jz-text-tertiary)]">※編集画面に設定が反映されます</span>
          </div>
        </article>
      ))}
    </div>
  );
}
