"use client";
import React from 'react';

type Testimonial = { name: string; text: string; rating?: number; verified?: boolean };

interface TestimonialsProps {
  usecase: string;
  items?: Testimonial[];
}

export function Testimonials({ usecase, items }: TestimonialsProps) {
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>(items || []);
  
  React.useEffect(() => {
    if (!items && usecase) {
      fetch('/testimonials.json')
        .then(res => res.json())
        .then(data => setTestimonials(data[usecase] || []))
        .catch(() => setTestimonials([]));
    }
  }, [usecase, items]);
  
  if (!testimonials?.length) return null;
  
  return (
    <section className="my-8">
      <h2 className="jz-font-display jz-text-display-small mb-3 text-center">お客様の声</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <blockquote key={i} className="rounded-md border p-4 bg-[color:var(--color-jz-card)]">
            <div className="flex items-center gap-1 mb-2">
              {t.rating && [...Array(t.rating)].map((_, j) => (
                <span key={j} className="text-yellow-400 text-sm">★</span>
              ))}
              {t.verified && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">認証済み</span>}
            </div>
            <p className="text-sm text-[color:var(--color-jz-text-primary)]">"{t.text}"</p>
            <footer className="mt-2 text-xs text-[color:var(--color-jz-text-tertiary)]">— {t.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

