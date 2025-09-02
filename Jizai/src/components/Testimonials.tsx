"use client";
import React from 'react';

type Testimonial = { name: string; text: string; rating?: number };

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items?.length) return null;
  return (
    <section className="my-8">
      <h2 className="jz-font-display jz-text-display-small mb-3 text-center">お客様の声</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((t, i) => (
          <blockquote key={i} className="rounded-md border p-4 bg-[color:var(--color-jz-card)]">
            <p className="text-sm text-[color:var(--color-jz-text-primary)]">“{t.text}”</p>
            <footer className="mt-2 text-xs text-[color:var(--color-jz-text-tertiary)]">— {t.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

